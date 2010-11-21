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
  struct snmp_pud      *pdu, *resp = NULL;
  oid                  oid[MAX_OID_LEN];
  struct variable_list *vars;
  int                  status;
  char                 *p;
  /* 1024 is the max errrstr len in glibc */
  char                 errbuf[1024]; 

  /* initialize snmp lib */
  init_snmp("panoptes");
  snmp_sess_init(&sess);
  session.peername = addr;
  session.version = SNMP_VERSION_2C;
  session.community = comm;
  session.community_len = strlen(session.community);
 
  /* noop on linux, required for win 32 if this is ever ported there */
  SOCK_STARTUP;

  ss = snmp_open(&sess);
  if (!ss) {
    len = strlen("snmp_open: fail")  + 1;
    r->monitor_msg = (char *)malloc(len * sizeof(char));
    snprintf(r->monitor_msg, len, "snmp_open: fail");    
    r->status = MONITOR_RESULT_ERR;
    return(r);
  }

  r->status = MONITOR_RESULT_OK;

  if (resp)
    snmp_free_pdu(resp);
  
  snmp_close(ss);

  /* win32, linux noop */
  SOCK_CLEANUP;

  return(r);
}
