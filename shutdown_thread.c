#include "panoptes.h"
#include "utils/configuration.h"
#include <signal.h>
#include <pthread.h>

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

  (void *)sigemptyset(&sigs_to_catch);
  (void *)sigaddset(&sigs_to_catch, SIGINT);
  (void *)sigaddset(&sigs_to_catch, SIGTERM);
  (void *)sigaddset(&sigs_to_catch, SIGSEGV);
  (void *)sigaddset(&sigs_to_catch, SIGBUS);
  
  (void *)sigwait(&sigs_to_catch, &caught);

  /* lock working lock to prevent new threads from starting */
  if ((rc = pthread_mutex_lock(&working_lock)) != 0) {
    strerror_r(errno, errbuf, 1024);
    syslog(LOG_ALERT, "pthread_mutex_lock: %s", errbuf);
  }

  /* let threads know we're shutting down */
  stop_threads = 1;

  /* wait for threads to finish */
  while (working_count != 0) {
    if ((rc = pthread_cond_wait(&working, &working_lock)) != 0) {
      strerror_r(errno, errbuf, 1024);
      syslog(LOG_ALERT, "pthread_cond_wait: %s", errbuf);
    }
  }

  /* unlock working lock */
  if ((rc = pthread_mutex_unlock(&working_lock)) != 0) {
    strerror_r(errno, errbuf, 1024);
    syslog(LOG_ALERT, "pthread_mutex_unlock: %s", errbuf);
  }
  
  config_term_handler();
  database_term_handler();

  if (configfile)
    free(configfile);

  
  /* terminate monitor threads */

  closelog();

  fprintf(stderr, "Terminated.\n");
}
