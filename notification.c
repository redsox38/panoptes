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
#include "panoptes/monitor_core.h"
#include <errno.h>
#include <unistd.h>

/* log_status_change
 *
 * parameters: monitor_entry_t information about the monitor being updated
 *             monitor_result_t information about the most recent monitoring output
 *
 * return: void
 *
 * Log results of status change to database
 */
void log_status_change(monitor_entry_t *m, monitor_result_t *r)
{
}

/* send_notification
 *
 * parameters: monitor_entry_t information about the monitor being updated
 *             monitor_result_t information about the most recent monitoring output
 *
 * return: void
 *
 * Send notifications of change in status to anybody subscribed to be notified of changes
 * Currently this is handles email and xmpp notifications
 */
void send_notification(monitor_entry_t *m, monitor_result_t *r)
{
  char           *sendmail_cmd, *from_addr, writebuf[1024], errbuf[1024];
  char           **notify_user_list, **p;
  int            rc, pipe_stdin_fd[2], i = 0;
  pid_t          pid;
  char           *xmpp_user, *xmpp_pass, **xmpp_args;
  char           *statuses[] = { "new","ok","pending","warn","error" };

  sendmail_cmd = get_config_value("notification.sendmail");
  from_addr = get_config_value("notification.from_address");

  /* send mail notification */
  if (from_addr != NULL) {
    if (sendmail_cmd != NULL) {
      /* see if anybody is interested in being notified for this */
      notify_user_list = get_notify_user_list(m, "email");

      if (notify_user_list) {
	pipe(pipe_stdin_fd);
	if (!(pid = fork())) {
	  /* child */
	  /* free up stdin */
	  close(0);
	  
	  dup(pipe_stdin_fd[0]);

	  execl(sendmail_cmd, sendmail_cmd, "-t", "-f", from_addr, NULL);
	  exit(0);
	} else {
	  /* parent */
	  syslog(LOG_DEBUG, "Forked sendmail. fd[1] = %d", pipe_stdin_fd[1]);

	  p = notify_user_list;
	  while (*p != NULL) {
	    memset(writebuf, '\0', 1024);
	    snprintf(writebuf, 1024, "To: <%s>\n", *p);
	    rc = write(pipe_stdin_fd[1], writebuf, strlen(writebuf));
	    if (rc < 0) {
	      strerror_r(errno, errbuf, 1024);
	      syslog(LOG_NOTICE, "write: %s", errbuf);
	    } else {
	      syslog(LOG_DEBUG, "wrote %d bytes", rc);
	    }
	    free(*p);
	    *p++;
	  }

	  p = notify_user_list;
	  while (*p != NULL) {
	    free(p);
	    *p++;
	  }

	  memset(writebuf, '\0', 1024);
	  snprintf(writebuf, 1024, "From: <%s>\n", from_addr);
	  write(pipe_stdin_fd[1], writebuf, strlen(writebuf));
	  memset(writebuf, '\0', 1024);
	  snprintf(writebuf, 1024, "Subject: Monitoring notice for %s\n\n", 
		   get_attr_val(m, "address"));
	  write(pipe_stdin_fd[1], writebuf, strlen(writebuf));
	  
	  memset(writebuf, '\0', 1024);
	  snprintf(writebuf, 1024, "Status changed to %s\n", statuses[r->status]);
	  write(pipe_stdin_fd[1], writebuf, strlen(writebuf));
	  memset(writebuf, '\0', 1024);
	  snprintf(writebuf, 1024, ".\n");
	  write(pipe_stdin_fd[1], writebuf, strlen(writebuf));

	  close(pipe_stdin_fd[0]);
	  close(pipe_stdin_fd[1]);

	  /* wait for child */
	  waitpid(pid, NULL, 0);
	}
      }
    } else {
      syslog(LOG_NOTICE, "No sendmail path is defined");
    }
  } else {
    syslog(LOG_NOTICE, "No notification address is defined");
  }

  xmpp_user = get_config_value("notification.xmpp_user");
  xmpp_pass = get_config_value("notification.xmpp_pass");

  /* send xmpp notification if so configured */
  if ((xmpp_user != NULL) && (xmpp_pass != NULL)) {
    /* see if anybody is interested in being notified for this */
    notify_user_list = get_notify_user_list(m, "xmpp");
    
    if (notify_user_list) {      
      pipe(pipe_stdin_fd);
      if (!(pid = fork())) {
	/* child */
	/* free up stdin */
	close(0);
	
	/* build args */
	i = 0;
	p = notify_user_list;
	while (*p != NULL) {
	  i++;
	  *p++;
	}

	/* space for all rcpts + user/pass + prog name + NULL */
	xmpp_args = (char **)malloc(sizeof(char *) * ((i * 2) + 6));
	xmpp_args[0] = "xmpp_msg";
	xmpp_args[1] = "--user";
	xmpp_args[2] = xmpp_user;
	xmpp_args[3] = "--pass";
	xmpp_args[4] = xmpp_pass;
	i = 5;
	p = notify_user_list;
	while (*p != NULL) {
	  xmpp_args[i] = "--rcpt";
	  i++;
	  xmpp_args[i] = *p;
	  i++;
	  *p++;
	}
	xmpp_args[i] = NULL;

	dup(pipe_stdin_fd[0]);

	execvp("xmpp_msg", xmpp_args);
	exit(0);
      } else {
	/* parent */
	p = notify_user_list;
	while (*p != NULL) {
	  free(p);
	  *p++;
	}

	memset(writebuf, '\0', 1024);       
	snprintf(writebuf, 1024, "%s status changed to %s\n", get_attr_val(m, "address"), statuses[r->status]);
	rc = write(pipe_stdin_fd[1], writebuf, strlen(writebuf));
	if (rc < 0) {
	  strerror_r(errno, errbuf, 1024);
	  syslog(LOG_NOTICE, "write: %s", errbuf);
	} else {
	  syslog(LOG_DEBUG, "wrote %d bytes", rc);
	}
	close(pipe_stdin_fd[0]);
	close(pipe_stdin_fd[1]);

	/* wait for child */
	waitpid(pid, NULL, 0);
      }
    } else {
      syslog(LOG_DEBUG, "no xmpp user notifications registered");
    }
  } else {
    syslog(LOG_DEBUG, "xmpp user or pass is null");
  }
}
