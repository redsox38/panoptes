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
#include "utils/configuration.h"
#include <signal.h>
#include <pthread.h>
#include <errno.h>
#include <sys/time.h>
#include <string.h>
#include <time.h>
#include "monitor_core.h"
#include <stdlib.h>
#include <sys/select.h>
#include <pwd.h>

monitor_result_t *monitor_shell(char *addr, char *script, 
				char *params, monitor_result_t *r)
{
  pid_t          pid, waited_pid;
  char           *user, *pfx, *scrbuf, pwbuf[256];
  char           readbuf[1024], errbuf[1024];
  char           *output = NULL;
  struct passwd  *pw;
  int            rc, exit_status, done = 0, pipe_fd[2];
  fd_set         rd_set;
  int            i, nfds = 0, logged = 0;
  struct timeval to, start, stop;
  double         elapsed;
  char           *envp[3];

  r->status = MONITOR_RESULT_OK;

  pipe(pipe_fd);

  pfx = get_config_value("script.directory");
  scrbuf = (char *)malloc(sizeof(char) * (strlen(pfx) + 
					  strlen(script) + 2));
  sprintf(scrbuf, "%s/%s", pfx, script);

  /* fork */
  if (!(pid = fork())) {
    dup2(pipe_fd[1], fileno(stdout));

    /* child */
    
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
	syslog(LOG_ALERT, "%s does not exist", user);
      } else {
	/* setuid and exec */
	if (setuid(pw->pw_uid) < 0) {
	  /* setuid failed */
	  strerror_r(errno, errbuf, 1024);
	  syslog(LOG_NOTICE, "setuid: %s", errbuf);
	} else {
	  /* exec... */
	  if (execle(scrbuf, scrbuf, params, NULL, envp) < 0) {
	    strerror_r(errno, errbuf, 1024);
	    syslog(LOG_NOTICE, "execl: %s", errbuf);
	  }
	}
      }
      free(pw);

      for (i = 0; i < 3; i++) {
	if (envp[i] != NULL) {
	  free(envp[i]);
	}
      }

      /* should never get here, but just in case... */
      exit(-1);
    } else {
      syslog(LOG_ALERT, "No script user defined running as root.  It's your funeral...");
    }
  } else {
    gettimeofday(&start, NULL);

    while(!done) {
      /* read from pipe */
      FD_ZERO(&rd_set);
      FD_SET(pipe_fd[0], &rd_set);

      /* set how long to wait for output before moving on to see
	 if the script has terminated */
      to.tv_sec = 5;
      to.tv_usec = 0;

      nfds = max(nfds, pipe_fd[0]);
      rc = select(++nfds, &rd_set, NULL, NULL, &to);      
      
      if (rc > 0) {
	/* got output */
	read(pipe_fd[0], readbuf, 1024);
	if (output == NULL) {
	  output = strdup(readbuf);
	} else {
	  output = realloc(output, (sizeof(char) * (strlen(output) + strlen(readbuf) + 1)));
	  sprintf(output, "%s%s", output, readbuf);
	}
      } else if ((rc < 0) && (!logged)) {
	/* error, only report it once though */
	logged = 1;
	strerror_r(errno, errbuf, 1024);
	syslog(LOG_NOTICE, "select: %s", errbuf);
      }

      /* parent, wait for kid */
      waited_pid = waitpid(pid, &exit_status, WNOHANG);

      if (waited_pid < 0) {
	strerror_r(errno, errbuf, 1024);
	syslog(LOG_NOTICE, "waitpid: %s", errbuf);
      } else if (waited_pid > 0) {
	close(pipe_fd[0]);
	close(pipe_fd[1]);
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
    if (output) {
      r->monitor_msg = strdup(output);
    }

    /* if script didn't provide timing data, save execution time */
    if (r->perf_data == NULL) {
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

  free(scrbuf);
  return(r);
}
