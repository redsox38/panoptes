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
#include <stdlib.h>
#include <sys/time.h>
#include <string.h>
#include <time.h>
#include <syslog.h>
#include "monitor_core.h"
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
  char                 *perf_str = NULL;
  size_t               this_oid_size;

  r->status = MONITOR_RESULT_OK;

  /* initialize snmp lib */
  init_snmp("panoptes");
  snmp_sess_init(&sess);
  sess.peername = addr;
  sess.version = SNMP_VERSION_2c;
  sess.community = comm;
  sess.community_len = strlen(sess.community);
 
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
      for (vars = resp->variables; vars; vars = vars->next_variable) {
	print_variable(vars->name, vars->name_length, vars);
	syslog(LOG_DEBUG, "var_name: %s", vars->name);
	switch (vars->type) {
        case ASN_OCTET_STR:
          syslog(LOG_DEBUG, "var_val: %s", vars->val.string);
          perf_str = (char *)malloc(sizeof(char) * 
                                    (vars->name_length + 1 + vars->val_len));
          sprintf(perf_str, "%s|", vars->name);
	  q = perf_str[strlen(perf_str)];
	  memcpy(q, vars->val.string, vars->val_len);
	  
          break;
        case ASN_COUNTER:
          syslog(LOG_DEBUG, "var_val: %d", vars->val.integer);
          perf_str = (char *)malloc(sizeof(char) * 
                                    (vars->name_length + 25));
          sprintf(perf_str, "%s|%d", vars->name, vars->val.integer);
	  break;
        default:
          syslog(LOG_DEBUG, "uncaught type: %d", vars->type);
	}

	if (perf_str != NULL) {
	  free(perf_str);
	  perf_str = NULL;
	}
      }
    } else {
      snmp_sess_error(ss, &snmp_err, &sys_err, &errstr);

      len = strlen("snmp_synch_response: ") + strlen(errstr);
      r->monitor_msg = (char *)malloc(len * sizeof(char));
      snprintf(r->monitor_msg, len, "snmp_synch_response: %s", errstr);    
      free(errstr);
      r->status = MONITOR_RESULT_ERR;
      p = NULL;
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
