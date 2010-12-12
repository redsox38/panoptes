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
#include <stdlib.h>
#include <sys/time.h>
#include <string.h>
#include <time.h>
#include "panoptes/monitor_core.h"
#include <net-snmp/net-snmp-config.h>
#include <net-snmp/net-snmp-includes.h>

monitor_result_t *monitor_snmp(char *addr, char *nm, char *comm, 
			       char *oids, monitor_result_t *r)
{
  struct snmp_session  sess, *ss;
  struct snmp_pdu      *pdu, *resp = NULL;
  oid                  this_oid[MAX_OID_LEN];
  struct variable_list *vars;
  int                  status, snmp_err, sys_err, len;
  char                 *errstr, *p, *q, *tkn;
  /* 1024 is the max errrstr len in glibc */
  char                 *perf_str = NULL, *val_buf, *name_buf;
  size_t               this_oid_size;

  r->status = MONITOR_RESULT_OK;
  r->perf_data = NULL;

  /* initialize snmp lib */
  init_snmp("panoptes");
  snmp_sess_init(&sess);
  sess.peername = addr;
  sess.version = SNMP_VERSION_2c;
  sess.community = comm;
  sess.community_len = strlen(sess.community);

  /* only print values */
  netsnmp_ds_set_boolean(NETSNMP_DS_LIBRARY_ID, 
			 NETSNMP_DS_LIB_QUICK_PRINT, 1);

  /* noop on linux, required for win 32 if this is ever ported there */
  SOCK_STARTUP;

  ss = snmp_open(&sess);
  if (!ss) {
    len = strlen("snmp_open: fail") + 1;
    r->monitor_msg = (char *)malloc(len * sizeof(char));
    snprintf(r->monitor_msg, len, "snmp_open: fail");    
    r->status = MONITOR_RESULT_ERR;
    return(r);
  }

  pdu = snmp_pdu_create(SNMP_MSG_GET);

  p = oids;
  p = strtok_r(p, ",", &tkn);

  while(p != NULL) {
    syslog(LOG_DEBUG, "pdu: %s", p);
    this_oid_size = MAX_OID_LEN;
    if (!snmp_parse_oid(p, this_oid, &this_oid_size)) {
      snmp_sess_error(ss, &snmp_err, &sys_err, &errstr);

      len = strlen("snmp_parse_oid: ") + strlen(errstr);
      r->monitor_msg = (char *)malloc(len * sizeof(char));
      snprintf(r->monitor_msg, len, "snmp_parse_oid: %s", errstr);    
      free(errstr);
      r->status = MONITOR_RESULT_ERR;
      p = NULL;
    } else {
      snmp_add_null_var(pdu, this_oid, this_oid_size);
      p = strtok_r(NULL, ",", &tkn);
    }
  }

  if (r->status == MONITOR_RESULT_OK) {
    status = snmp_synch_response(ss, pdu, &resp);
    
    syslog(LOG_DEBUG, "snmp:status: %d", status);
    if (status == STAT_SUCCESS && resp->errstat == SNMP_ERR_NOERROR) {
      for (vars = resp->variables; vars != NULL; vars = vars->next_variable) {
	syslog(LOG_DEBUG, "checking variable...");
    
	val_buf = (char *)malloc(sizeof(char) * MAX_OID_LEN);
	name_buf = (char *)malloc(sizeof(char) * MAX_OID_LEN);
	snprint_objid(name_buf, MAX_OID_LEN, vars->name, vars->name_length);
	snprint_value(val_buf, MAX_OID_LEN, vars->name, vars->name_length,
		      vars);

	perf_str = (char *)malloc(sizeof(char) * (strlen(val_buf) + 
						  strlen(name_buf) + 1));

	sprintf(perf_str, "%s|%s", name_buf, val_buf);

	syslog(LOG_DEBUG, "perf_str: %s", perf_str);

	if (r->perf_data == NULL) {
	  r->perf_data = strdup(perf_str);
	  syslog(LOG_DEBUG, "perf_data is null");
	} else {
	  syslog(LOG_DEBUG, "appending to perf data...");
	  if ((r->perf_data = realloc(r->perf_data, 
				      (sizeof(char) * (strlen(perf_str) + 
						       strlen(r->perf_data) + 1)))) != NULL) {
	    syslog(LOG_DEBUG, "len: %d %s", strlen(r->perf_data),
		   r->perf_data);
	    sprintf(r->perf_data, "%s;%s", r->perf_data, perf_str);
	    syslog(LOG_DEBUG, "perf_data is %s", r->perf_data);
	  } else {
	    syslog(LOG_DEBUG, "realloc failed...");
	  }
	}

	syslog(LOG_DEBUG, "freeing vars...");
	free(perf_str);
	free(val_buf);
	free(name_buf);
      }
    } else {
      snmp_sess_error(ss, &snmp_err, &sys_err, &errstr);

      len = strlen("snmp_synch_response: ") + strlen(errstr);
      r->monitor_msg = (char *)malloc(len * sizeof(char));
      snprintf(r->monitor_msg, len, "snmp_synch_response: %s", errstr);    
      free(errstr);
      r->status = MONITOR_RESULT_ERR;
    }
  }

  if (r->status != MONITOR_RESULT_ERR) {
    r->monitor_msg = strdup("OK");
    r->status = MONITOR_RESULT_OK;
  }

  if (resp)
    snmp_free_pdu(resp);
  
  snmp_close(ss);

  /* win32, linux noop */
  SOCK_CLEANUP;

  return(r);
}
