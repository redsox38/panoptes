/*
 *
 * Copyright (C) 2010 Todd Merritt <redsox38@gmail.com>
 *
 *    This program is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU General Public License as published by
 *    the Free Software Foundation, either version 3 of the License, or
 *    (at your option) any later version.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU General Public License for more details.
 *
 *    You should have received a copy of the GNU General Public License
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

#include "panoptes.h"
#include "panoptes/configuration.h"
#include <signal.h>
#include <pthread.h>
#include <errno.h>
#include <sys/time.h>
#include <string.h>
#include <time.h>
#include "panoptes/monitor_core.h"
#include <stdlib.h>
#include <sys/select.h>
#include <pwd.h>
#include <unistd.h>

monitor_result_t *monitor_shell(char *addr, char *script, 
				char *params, monitor_result_t *r)
{
  pid_t          pid, waited_pid;
  char           *user, *pfx, *scrbuf, pwbuf[256];
  char           readbuf[1024], errbuf[1024];
  char           *monitor_output = NULL;
  char           *p, *perf_output = NULL;
  struct passwd  *pw;
  int            rc, exit_status, done = 0;
  int            pipe_stdout_fd[2], pipe_stderr_fd[2];
  fd_set         rd_set;
  int            ok_to_exec = 1, len, i, nfds = 0, logged = 0;
  struct timeval to, start, stop;
  double         elapsed;
  char           *envp[3];

  r->status = MONITOR_RESULT_OK;

  pipe(pipe_stdout_fd);
  pipe(pipe_stderr_fd);

  pfx = get_config_value("script.directory");
  scrbuf = (char *)malloc(sizeof(char) * (strlen(pfx) + 
					  strlen(script) + 2));
  sprintf(scrbuf, "%s/%s", pfx, script);

  /* fork */
  if (!(pid = fork())) {
    /* child */

    /* re-assign stdout/stderr to writer end of pipe */
    dup2(pipe_stdout_fd[1], fileno(stdout));
    dup2(pipe_stderr_fd[1], fileno(stderr));
    
    /* set environment variable containing the device address */
    envp[0] = (char *)malloc(sizeof(char) * (2 + strlen(addr) +
					     strlen("PANOPTES_MONITOR_ADDR")));
    sprintf(envp[0], "PANOPTES_MONITOR_ADDR=%s", addr);

    if (params) {
      envp[1] = (char *)malloc(sizeof(char) * (2 + strlen(params) +
					       strlen("PANOPTES_MONITOR_PARAM")));
      sprintf(envp[1], "PANOPTES_MONITOR_PARAM=%s", params);
    } else {
      envp[1] = NULL;
    }
    envp[2] = NULL;

    user = get_config_value("script.user");

    if (user != NULL) {
      pw = (struct passwd *)malloc(sizeof(struct passwd));
      getpwnam_r(user, pw, pwbuf, 256, &pw);
      if (pw == NULL) {
	ok_to_exec = 0;
	syslog(LOG_ALERT, "%s does not exist", user);
      } else {
	/* setuid and exec */
	if (setuid(pw->pw_uid) < 0) {
	  /* setuid failed */
	  ok_to_exec = 0;
	  strerror_r(errno, errbuf, 1024);
	  syslog(LOG_NOTICE, "setuid: %s", errbuf);
	}
      }
      free(pw);
    } else {
      syslog(LOG_ALERT, "No script user defined running as root.  It's your funeral...");
    }

    /* exec... */
    if (ok_to_exec) {
      if (execle(scrbuf, scrbuf, params, NULL, envp) < 0) {
	strerror_r(errno, errbuf, 1024);
	syslog(LOG_NOTICE, "execl: %s", errbuf);
      }
    }

    for (i = 0; i < 3; i++) {
      if (envp[i] != NULL) {
	free(envp[i]);
      }
    }
    
    /* should never get here under normal circumstances, but just in case... */
    exit(-1);
  } else {
    gettimeofday(&start, NULL);

    /* initialize FD SET */
    FD_ZERO(&rd_set);
    FD_SET(pipe_stdout_fd[0], &rd_set);
    FD_SET(pipe_stderr_fd[0], &rd_set);

    nfds = max(nfds, pipe_stdout_fd[0]);
    nfds = max(nfds, pipe_stderr_fd[0]);
    
    while(!done) {
      /* set how long to wait for output before moving on to see
	 if the script has terminated */
      to.tv_sec = 5;
      to.tv_usec = 0;

      rc = select(++nfds, &rd_set, NULL, NULL, &to);      
      
      if (rc > 0) {
	/* got output */
	/* see which fd */
	if (FD_ISSET(pipe_stdout_fd[0], &rd_set)) {
	  /* stdout is for perf mon data */
	  /* erase whatever was in readbuf */
	  memset(readbuf, 0x0, 1024);
	  read(pipe_stdout_fd[0], readbuf, 1024);
	  /* see if it's setting a title, otherwise append it to perf mon 
	     output */
	  if (!strncasecmp(readbuf, "title:", strlen("title:"))) {
	    if (r->perf_title) {
	      free(r->perf_title);
	    }
	    *p = readbuf[strlen("title:")];
	    r->perf_title = strdup(p);
	  } else {
	    if (perf_output == NULL) {
	      perf_output = strdup(readbuf);
	    } else {
	      perf_output = realloc(perf_output, (sizeof(char) * (strlen(perf_output) + strlen(readbuf) + 1)));
	      sprintf(perf_output, "%s%s", perf_output, readbuf);
	    }
	  }
	} else if (FD_ISSET(pipe_stderr_fd[0], &rd_set)) {
	  /* stderr is for monitor messages */
	  read(pipe_stderr_fd[0], readbuf, 1024);
	  if (monitor_output == NULL) {
	    monitor_output = strdup(readbuf);
	  } else {
	    monitor_output = realloc(perf_output, (sizeof(char) * (strlen(monitor_output) + strlen(readbuf) + 1)));
	    sprintf(monitor_output, "%s%s", monitor_output, readbuf);
	  }
	}
      } else if ((rc < 0) && (!logged)) {
	/* error, only report it once though */
	logged = 1;
	strerror_r(errno, errbuf, 1024);
	syslog(LOG_NOTICE, "select: %s", errbuf);
      }

      /* parent, wait for kid */
      syslog(LOG_DEBUG, "waiting for %d...", pid);
      waited_pid = waitpid(pid, &exit_status, WNOHANG);
      syslog(LOG_DEBUG, "waiting for %d returned %d", pid, waited_pid);

      if (waited_pid < 0) {
	strerror_r(errno, errbuf, 1024);
	syslog(LOG_NOTICE, "waitpid: %s", errbuf);
      } else if (waited_pid > 0) {
	close(pipe_stdout_fd[0]);
	close(pipe_stderr_fd[0]);
	close(pipe_stdout_fd[1]);
	close(pipe_stderr_fd[1]);
	done = 1;
	syslog(LOG_DEBUG, "%s exited with %d", scrbuf, 
	       WEXITSTATUS(exit_status));
	if (WEXITSTATUS(exit_status) < 0) {
	  r->status = MONITOR_RESULT_ERR;
	} else if (WEXITSTATUS(exit_status) == 0) {
	  r->status = MONITOR_RESULT_OK;
	} else if (WEXITSTATUS(exit_status) > 0) {
	  r->status = MONITOR_RESULT_WARN;
	}
      }     
    }
    gettimeofday(&stop, NULL);

    /* update monitor message */
    if (monitor_output) {
      syslog(LOG_DEBUG, "copying monitor output");
      r->monitor_msg = strdup(monitor_output);
      free(monitor_output);
    }
 
    /* if script didn't provide timing data, save execution time */
    if (perf_output) {
      syslog(LOG_DEBUG, "copying perf output");
      r->perf_data = strdup(perf_output);
      free(perf_output);
   } else {
      syslog(LOG_DEBUG, "generating perf output");
      /* get elapsed time in milliseconds */
      elapsed = (stop.tv_sec - start.tv_sec) * 1000;
      elapsed += (stop.tv_usec - start.tv_usec) / 1000;

      /* space for string and a 10 digit number */
      len = strlen("elapsed time|") + 10;
      r->perf_data = (char *)malloc(len * sizeof(char));
      snprintf(r->perf_data, len, "elapsed time|%.4f", 
	       elapsed);
    }
  }

  syslog(LOG_DEBUG, "freeing scrbuf");
  free(scrbuf);
  syslog(LOG_DEBUG, "freed scrbuf");

  return(r);
}
