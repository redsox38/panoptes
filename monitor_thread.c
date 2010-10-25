#include "config.h"
#include "utils/configuration.h"
#include <signal.h>
#include <stdlib.h>
#include <pthread.h>
#include <stdio.h>
#include "monitor_core.h"

void *monitor_thread(void *arg) 
{
  sigset_t         sigmask;
  monitor_entry_t  m;
  char             **p, **q;
  monitor_result_t r;
  /* data for port monitoring */
  char             *addr, *proto, *port;
  int              portnum;

  /* block termination/interrupt signals */
  (void *)sigemptyset(&sigmask);
  (void *)sigaddset(&sigmask, SIGINT);
  (void *)sigaddset(&sigmask, SIGSEGV);
  (void *)sigaddset(&sigmask, SIGPIPE);
  (void *)sigaddset(&sigmask, SIGBUS);
  (void *)sigaddset(&sigmask, SIGTERM);
  pthread_sigmask(SIG_BLOCK, &sigmask, NULL);

  /* get next monitor entry from task table */
  allocate_monitor_entry(&m);

  get_next_monitor_entry(&m);

  /* make sure we got a result */
  if (m.table_name != NULL) {
    if (allocate_monitor_result(&r) != NULL) {
      if (!strcmp(m.table_name, "port_monitors")) {
	/* open socket if we have all the data needed */
	addr = get_attr_val(&m, "address");
	proto = get_attr_val(&m, "proto");
	port = get_attr_val(&m, "port");
	if (addr != NULL && proto != NULL && port != NULL) {
	  sscanf(port, "%d", &portnum);
	  
	  monitor_port(addr, proto, portnum, &r);
	  update_monitor_entry(&m, &r);
	  
	  if (r.perf_data != NULL)
	    printf("perf: %s\n", r.perf_data);
	  
	  free_monitor_result(&r, 0);
	} else {
	  fprintf(stderr, "Missing data required to monitor: %s %s", 
		  m.table_name, m.id);
	}
      }
    } else {
      fprintf(stderr, "Unable to allocate result\n");
    }
  } else {
    /* nothing to monitor, sleep for a minute and check again */
    sleep(60);
  }

  free_monitor_entry(&m, 0);
}
