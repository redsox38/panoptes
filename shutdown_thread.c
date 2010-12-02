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

extern char            *configfile;
extern int             stop_threads;
extern int             working_count;
extern pthread_cond_t  working;
extern pthread_mutex_t working_lock;

void *shutdown_thread(void *arg) 
{
  sigset_t     sigs_to_catch;
  int          caught, rc;
  char         errbuf[1024];

  sigemptyset(&sigs_to_catch);
  sigaddset(&sigs_to_catch, SIGINT);
  sigaddset(&sigs_to_catch, SIGTERM);
  sigaddset(&sigs_to_catch, SIGSEGV);
  sigaddset(&sigs_to_catch, SIGBUS);
  
  (void *)sigwait(&sigs_to_catch, &caught);

  syslog(LOG_DEBUG, "getting working lock");
  /* lock working lock to prevent new threads from starting */
  if ((rc = pthread_mutex_lock(&working_lock)) != 0) {
    strerror_r(errno, errbuf, 1024);
    syslog(LOG_ALERT, "pthread_mutex_lock: %s", errbuf);
  }
  syslog(LOG_DEBUG, "got working lock");

  /* let threads know we're shutting down */
  stop_threads = 1;

  /* wait for threads to finish */
  while (working_count != 0) {
    syslog(LOG_DEBUG, "working_count %d wakeup", working_count);    
    if ((rc = pthread_cond_wait(&working, &working_lock)) != 0) {
      strerror_r(errno, errbuf, 1024);
      syslog(LOG_ALERT, "pthread_cond_wait: %s", errbuf);
    }
    syslog(LOG_DEBUG, "working_count %d wokeup", working_count);    
  }

  /* monitor threads have terminated */
  
  /* unlock working lock */
  if ((rc = pthread_mutex_unlock(&working_lock)) != 0) {
    strerror_r(errno, errbuf, 1024);
    syslog(LOG_ALERT, "pthread_mutex_unlock: %s", errbuf);
  }

  
  config_term_handler();
  database_term_handler();

  if (configfile)
    free(configfile);
  
  closelog();

  fprintf(stderr, "Terminated.\n");
  exit(0);
}
