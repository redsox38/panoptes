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
  char                 *perf_str;

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

  p = oids;
  p = strtok_r(p, ",", &tkn);
  while(p != NULL) {
    pdu = snmp_pdu_create(SNMP_MSG_GET);
    get_node(p, this_oid, (size_t *)MAX_OID_LEN);
    snmp_add_null_var(pdu, this_oid, MAX_OID_LEN);
    status = snmp_synch_response(ss, pdu, &resp);

    if (status == STAT_SUCCESS && resp->errstat == SNMP_ERR_NOERROR) {
      for (vars = resp->variables; vars; vars = vars->next_variable) {
	switch (vars->type) {
	case ASN_OCTET_STR:
	  perf_str = (char *)malloc(sizeof(char) * 
				    (vars->name_length + 1 + vars->val_len));
	  sprintf(perf_str, "%s|%s", vars->name, vars->val.string);
	  break;
	}
      }
      
      if (r->perf_data == NULL) {
	r->perf_data = strdup(perf_str);
      } else {
	r->perf_data = realloc(r->perf_data, 
                               sizeof(char) * (strlen(r->perf_data) +
	  		                       strlen(perf_str) + 1));
	q = r->perf_data[strlen(r->perf_data) + 1];
	sprintf(q, ";%s", perf_str);
      }

      free(perf_str);
      p = strtok_r(NULL, ",", &tkn);
    } else {
      if (status == STAT_SUCCESS) {
	snmp_error(&sess, &snmp_err, &sys_err, &errstr);
      } else {
	snmp_sess_error(ss, &snmp_err, &sys_err, &errstr);
      }

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
