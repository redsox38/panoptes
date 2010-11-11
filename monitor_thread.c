#include "panoptes.h"
#include "utils/configuration.h"
#include <signal.h>
#include <pthread.h>
#include "monitor_core.h"

void *monitor_thread(void *arg) 
{
  sigset_t         sigmask;
  monitor_entry_t  m;
  char             **p, **q;
  monitor_result_t r;
  /* data for port monitoring */
  char             *addr, *proto, *port, *url;
  char             perf_attr[256];
  int              portnum;

  /* block termination/interrupt signals */
  (void *)sigemptyset(&sigmask);
  (void *)sigaddset(&sigmask, SIGINT);
  (void *)sigaddset(&sigmask, SIGSEGV);
  (void *)sigaddset(&sigmask, SIGPIPE);
  (void *)sigaddset(&sigmask, SIGBUS);
  (void *)sigaddset(&sigmask, SIGTERM);
  pthread_sigmask(SIG_BLOCK, &sigmask, NULL);

  /* allocate TSD for rrd tool libraries */
  rrd_get_context();

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
	  
	  /*
	    add ssl certificate check if there isn't one there already 
	    and this is the first time this has been checked
	  */
	  if ((portnum == 443 || portnum == 8443) && 
	      (!strcmp(get_attr_val(&m, "status"), "new"))) {
	    /* add ssl check */
	    add_ssl_monitor(get_attr_val(&m, "device_id"), addr, portnum);
	  }

	  monitor_port(addr, proto, portnum, &r);
	  update_monitor_entry(&m, &r);
	  
	  if (r.perf_data != NULL) {
	    snprintf(perf_attr, 256, "%s-%s", proto, port);
	    update_performance_data(addr, perf_attr, &m, &r);
	  }
	  
	  free_monitor_result(&r, 0);
	} else {
	  syslog(LOG_NOTICE, "Missing data required to monitor: %s %s", 
		 m.table_name, m.id);
	}
      } else if (!strcmp(m.table_name, "ping_monitors")) {
	addr = get_attr_val(&m, "address");
	if (addr != NULL) {
	  monitor_icmp(addr, &r);
	  update_monitor_entry(&m, &r);
	  
	  if (r.perf_data != NULL) {
	    snprintf(perf_attr, 256, "icmp");
	    update_performance_data(addr, perf_attr, &m, &r);
	  }
	  
	  free_monitor_result(&r, 0);
	} else {
	  syslog(LOG_NOTICE, "Missing data required to monitor: %s %s", 
		 m.table_name, m.id);
	}
      } else if (!strcmp(m.table_name, "certificate_monitors")) {
	url = get_attr_val(&m, "url");
	if (url != NULL) {

	  monitor_certificate(url, &r);
	  update_monitor_entry(&m, &r);

	  free_monitor_result(&r, 0);
	} else {
	  syslog(LOG_NOTICE, "Missing data required to monitor: %s %s", 
		 m.table_name, m.id);
	}
      }
    } else {
      syslog(LOG_ALERT, "Unable to allocate result");
    }
  } else {
    /* nothing to monitor, sleep for a minute and check again */
    sleep(60);
  }

  free_monitor_entry(&m, 0);
}
