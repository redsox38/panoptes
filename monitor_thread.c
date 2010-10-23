#include "config.h"
#include "utils/configuration.h"
#include <signal.h>
#include <stdlib.h>
#include <pthread.h>
#include <stdio.h>
#include "monitor_core.h"

void *monitor_thread(void *arg) 
{
  sigset_t     sigmask;

  monitor_entry_t m;

  /* block termination/interrupt signals */
  (void *)sigemptyset(&sigmask);
  (void *)sigaddset(&sigmask, SIGINT);
  (void *)sigaddset(&sigmask, SIGSEGV);
  (void *)sigaddset(&sigmask, SIGPIPE);
  (void *)sigaddset(&sigmask, SIGBUS);
  (void *)sigaddset(&sigmask, SIGTERM);
  pthread_sigmask(SIG_BLOCK, &sigmask, NULL);


  /* get next monitor entry from task table */
  allocate_new_monitor_entry(&m);

  get_next_monitor_entry(&m);

  printf("id: %s\n", m.id);
  printf("table: %s\n", m.table_name);
  printf("attr %s: %s\n", m.attrs[0], m.vals[0]);

  free_monitor_entry(&m, 0);
}
