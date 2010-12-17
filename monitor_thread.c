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
#include "panoptes/monitor_core.h"
#include <errno.h>

extern int             working_count;
extern int             stop_threads;
extern pthread_cond_t  working;
extern pthread_mutex_t working_lock;

void *monitor_thread(void *arg) 
{
  sigset_t         sigmask;
  monitor_entry_t  m;
  char             **p, **q;
  monitor_result_t r;
  char             perf_attr[256], errbuf[1024];
  int              rc, current_status;
  char             *addr;
  /* data for port monitoring */
  char             *proto, *port;
  int              portnum;
  /* for certificate/utl monitoring */
  char             *url, *expect_status;
  /* for snmp monitoring */
  char             *nm, *oid, *comm;
  /* for shell script monitoring */
  char             *script, *params;

  /* block termination/interrupt signals */
  sigemptyset(&sigmask);
  sigaddset(&sigmask, SIGINT);
  sigaddset(&sigmask, SIGSEGV);
  sigaddset(&sigmask, SIGPIPE);
  sigaddset(&sigmask, SIGBUS);
  sigaddset(&sigmask, SIGTERM);
  pthread_sigmask(SIG_BLOCK, &sigmask, NULL);

  /* allocate TSD for rrd tool libraries */
  rrd_get_context();

  while(1) {
    /* increment active thread count */
    if ((rc = pthread_mutex_lock(&working_lock)) != 0) {
      strerror_r(errno, errbuf, 1024);
      syslog(LOG_ALERT, "pthread_mutex_lock: %s", errbuf);
    }

    working_count++;

    /* unlock working lock */
    if ((rc = pthread_mutex_unlock(&working_lock)) != 0) {
      strerror_r(errno, errbuf, 1024);
      syslog(LOG_ALERT, "pthread_mutex_unlock: %s", errbuf);
    }

    /* get next monitor entry from task table */
    allocate_monitor_entry(&m);

    get_next_monitor_entry(&m);
    
    /* make sure we got a result */
    if (m.table_name != NULL) {
      current_status = get_status_code(get_attr_val(&m, "status"))
;
      if (allocate_monitor_result(&r) != NULL) {
	syslog(LOG_DEBUG, "got %s", m.table_name);
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

	    if (current_status != r.status) {
	      send_notification(&m, &r);
	    }

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
	    
	    if (current_status != r.status) {
	      send_notification(&m, &r);
	    }

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
	    
	    if (current_status != r.status) {
	      send_notification(&m, &r);
	    }

	    free_monitor_result(&r, 0);
	  } else {
	    syslog(LOG_NOTICE, "Missing data required to monitor: %s %s", 
		   m.table_name, m.id);
	  }
	} else if (!strcmp(m.table_name, "snmp_monitors")) {
	  addr = get_attr_val(&m, "address");
	  nm = get_attr_val(&m, "name");
	  comm = get_attr_val(&m, "community");
	  oid = get_attr_val(&m, "oid");
	  if (nm != NULL &&
	      oid != NULL &&
	      comm != NULL &&
	      addr != NULL) {
	    
	    monitor_snmp(addr, nm, comm, oid, &r);
	    update_monitor_entry(&m, &r);

	    if (current_status != r.status) {
	      send_notification(&m, &r);
	    }

	    if (r.perf_data != NULL) {
	      snprintf(perf_attr, 256, nm);
	      update_performance_data(addr, perf_attr, &m, &r);
	    }
	    
	    free_monitor_result(&r, 0);
	  } else {
	    syslog(LOG_NOTICE, "Missing data required to monitor: %s %s", 
		   m.table_name, m.id);
	  }
	} else if (!strcmp(m.table_name, "shell_monitors")) {
	  addr = get_attr_val(&m, "address");
	  script = get_attr_val(&m, "script");
	  params = get_attr_val(&m, "params");
	  if (script != NULL) {
	    monitor_shell(addr, script, params, &r);
	    update_monitor_entry(&m, &r);

	    if (current_status != r.status) {
	      send_notification(&m, &r);
	    }

	    if (r.perf_data != NULL) {
	      snprintf(perf_attr, 256, script);
	      update_performance_data(addr, perf_attr, &m, &r);
	    }
	    
	    free_monitor_result(&r, 0);
	  } else {
	    syslog(LOG_NOTICE, "Missing data required to monitor: %s %s", 
		   m.table_name, m.id);
	  }
	} else if (!strcmp(m.table_name, "url_monitors")) {
	  url = get_attr_val(&m, "url");
	  expect_status = get_attr_val(&m, "expect_http_status");
	  if ((url != NULL) && (expect_http_status != NULL)) {
	    
	    monitor_url(url, expect_http_status, &r);
	    update_monitor_entry(&m, &r);
	    
	    if (current_status != r.status) {
	      send_notification(&m, &r);
	    }

	    free_monitor_result(&r, 0);
	  } else {
	    syslog(LOG_NOTICE, "Missing data required to monitor: %s %s", 
		   m.table_name, m.id);
	  }
	} else {
	  syslog(LOG_ALERT, "Unknown monitor type: %s", m.table_name);
	}
	syslog(LOG_DEBUG, "finished %s", m.table_name);
      } else {
	syslog(LOG_ALERT, "Unable to allocate result");
      }
    } else {
      /* nothing to monitor, sleep for a minute and check again */
      syslog(LOG_DEBUG, "nothing to check");
      sleep(30);
    }

    free_monitor_entry(&m, 0);

    /* decrement active thread count */

    if ((rc = pthread_mutex_lock(&working_lock)) != 0) {
      strerror_r(errno, errbuf, 1024);
      syslog(LOG_ALERT, "pthread_mutex_lock: %s", errbuf);
    }

    working_count--;

    if (working_count == 0) {
      /* wake up shutdown thread if it's waiting */
      pthread_cond_broadcast(&working);
    }

    /* unlock working lock */
    if ((rc = pthread_mutex_unlock(&working_lock)) != 0) {
      strerror_r(errno, errbuf, 1024);
      syslog(LOG_ALERT, "pthread_mutex_unlock: %s", errbuf);
    }

    /* see if shutting down */
    if (stop_threads) {
      syslog(LOG_DEBUG, "exiting");
      pthread_exit(NULL);
    }
  }
}
