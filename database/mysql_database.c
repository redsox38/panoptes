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

#include "../config.h"
#undef VERSION
#undef PACKAGE
#undef PACKAGE_NAME
#undef PACKAGE_STRING
#undef PACKAGE_VERSION
#undef PACKAGE_TARNAME
#undef PACKAGE_BUGREPORT
#ifdef HAVE_LIBMYSQLCLIENT_R
#include "panoptes/configuration.h"
#include "mysql_database.h"
#include <my_global.h>
#include <mysql.h>
#include <pwd.h>
#include <string.h>
#include "panoptes/monitor_core.h"
#include <pthread.h>
#include <syslog.h>

pthread_mutex_t sql_mutex = PTHREAD_MUTEX_INITIALIZER;
MYSQL *mysql = NULL;

/* 
   register atfork handler to close database connections in
   forked processes 
*/
#ifdef GNUC
__init__(_database_onload);
#endif

void _database_child_fork_cleanup(void) 
{
  if (mysql)
    mysql_close(mysql);  
}

void _database_onload(void)
{
  pthread_atfork(NULL, NULL, _database_child_fork_cleanup);
}

/* function called by discover on termination */
void _term_handler()
{
  if (mysql)
    mysql_close(mysql);
}

/* function called to open database at discover startup */
int _database_open(int initialize)
{
  char          *db, *host, *pass, *user, *loader;
  char          qry[MAX_MYSQL_DISC_QRY_LEN];
  struct passwd *pw;

  /* make sure we have the necessary config values */
  db = get_config_value("db.name");

  if (!db) {
    fprintf(stderr, "MySQL: No db attribute listed.\n");
    return(-1);
  }

  host = get_config_value("db.host");
  pass = get_config_value("db.password");
  user = get_config_value("db.user");
  
  if (!host) 
    host = strdup("localhost");

  if (!user) {
    pw = getpwuid(getuid());
    user = strdup(pw->pw_name);
  }

  mysql = mysql_init(NULL);

  if (mysql == NULL) {
    fprintf(stderr, "MySQL Err: %s\n", mysql_error(mysql));
    free(db);
    free(host);
    free(user);
    if (pass)
      free(pass);

    return(-1);
  }

  /* connect allowing multi statements for stored procedure calls */
  if (mysql_real_connect(mysql, host, user, pass, db, 0, NULL, CLIENT_MULTI_STATEMENTS) == NULL) {
    fprintf(stderr, "MySQL: %s\n", mysql_error(mysql));

    free(db);
    free(host);
    free(user);
    if (pass)
      free(pass);
    return(-1);
  }

  if (initialize) {
    loader = get_config_value("db.sqlinit");
    snprintf(qry, MAX_MYSQL_DISC_QRY_LEN, "SOURCE %s", loader);
    mysql_query(mysql, qry);
    syslog(LOG_DEBUG, "Error: %s\n", mysql_error(mysql));
    free(loader);
  }

  return(0);
}

/* append pcap entry to database as a monitor object*/
void _add_monitor_port(char *src, int src_port, char *prot, char *os_genre, char *os_detail)
{
  char        *qry;
  int         len, rc, i, num_rows;
  MYSQL_RES   *result;
  MYSQL_ROW   row;
  MYSQL_FIELD *fields;
  long        *lengths;

  qry = (char *)malloc(sizeof(char) * MAX_MYSQL_DISC_QRY_LEN);

  len = (strlen("CALL add_port_monitor(") +
	 20 +
	 strlen(",'") +
	 strlen(src) +
	 strlen("','") +
	 strlen(prot) +
	 strlen("','") +
	 strlen(os_genre) +
	 strlen("','") +
	 strlen(os_detail) +	 
	 strlen("')"));
  
  qry = (char *)malloc(len * sizeof(char));
  snprintf(qry, len, "CALL add_port_monitor(%d,'%s','%s','%s','%s')",
	   src_port, src, prot, os_genre, os_detail);

  syslog(LOG_DEBUG, "query: %s", qry);

  pthread_mutex_lock(&sql_mutex);

  rc = mysql_query(mysql, qry);

  do {
    result = mysql_store_result(mysql);
    if (result) {
      mysql_free_result(result);
    } else {
      /* an error occurred or no results */
      if (mysql_field_count(mysql) != 0)
	syslog(LOG_DEBUG, "Error: %s\n", mysql_error(mysql));
    }
    rc = mysql_next_result(mysql);
  } while (rc == 0);

  pthread_mutex_unlock(&sql_mutex);

  free(qry);
}

/* append pcap entry to database */
void _add_discovered_connection(char *src, int src_port, char *dst, 
				int dst_port, char *prot, char *os_genre, char *os_detail)
{
  char *qry;

  qry = (char *)malloc(sizeof(char) * MAX_MYSQL_DISC_QRY_LEN);

  snprintf(qry, MAX_MYSQL_DISC_QRY_LEN,
	   "INSERT INTO discovered VALUES(0, '%s', %d, '%s', %d, '%s', NOW(), 0, '%s','%s')",
	   src, src_port, dst, dst_port, prot, os_genre, os_detail);

  mysql_query(mysql, qry);

  free(qry);
}

void _reset_pending_monitors()
{
  MYSQL_RES *result;
  int       rc;

  pthread_mutex_lock(&sql_mutex);

  rc = mysql_query(mysql, "CALL reset_pending_monitors()");

  do {
    result = mysql_store_result(mysql);
    if (result) {
      mysql_free_result(result);
    } else {
      /* an error occurred or no results */
      if (mysql_field_count(mysql) != 0)
	syslog(LOG_DEBUG, "Error: %s\n", mysql_error(mysql));
    }
    rc = mysql_next_result(mysql);
  } while (rc == 0);

  pthread_mutex_unlock(&sql_mutex);
}

void _get_next_monitor_entry(monitor_entry_t *m)
{
  MYSQL_RES   *result;
  MYSQL_ROW   row;
  MYSQL_FIELD *fields;
  int         i, j, rc, num_fields;
  long        *lengths;

  pthread_mutex_lock(&sql_mutex);

  rc = mysql_query(mysql, "CALL get_next_monitor_entry()");

  do {
    result = mysql_store_result(mysql);
    if (result) {
      row = mysql_fetch_row(result);
      fields = mysql_fetch_fields(result);
      lengths = mysql_fetch_lengths(result);

      num_fields = mysql_num_fields(result);
      j = 0;

      if (num_fields) {
	/* space for null terminator plus number of fields
	   minus the id and table_name which are separated out */
	m->attrs = (char **)malloc(sizeof(char *) * (num_fields - 1));
	m->vals  = (char **)malloc(sizeof(char *) * (num_fields - 1));
      }


      for (i = 0; i < num_fields; i++) {
	if (!strcmp(fields[i].name, "id")) {
	  m->id = strdup((char *)row[i]);
	} else if (!strcmp(fields[i].name, "table_name")) {
	  m->table_name = strdup((char *)row[i]);
	} else {
	  m->attrs[j] = strdup(fields[i].name);
	  if (row[i] != NULL) {
	    if (fields[i].type == MYSQL_TYPE_BLOB) {
	      m->vals[j] = (char *)malloc(sizeof(char) * (lengths[i] + 1));
	      snprintf(m->vals[j], lengths[i], row[i]);
	    } else {
	      m->vals[j] = strdup((char *)row[i]);	       
	    }
	  } else {
	    m->vals[j] = NULL;
	  }
	  j++;	    
	}
      }

      m->attrs[j] = NULL;
      m->vals[j] = NULL;

      mysql_free_result(result);
    } else {
      /* an error occurred or no results */
      if (mysql_field_count(mysql) != 0)
	syslog(LOG_DEBUG, "Error: %s\n", mysql_error(mysql));
    }
    rc = mysql_next_result(mysql);
  } while (rc == 0);

  pthread_mutex_unlock(&sql_mutex);
}

int _update_monitor_entry(monitor_entry_t *m, monitor_result_t *r)
{
  MYSQL_RES   *result;
  int         len, rc, num_fields;
  char        *qry, *status_str;

  switch(r->status) {
  case MONITOR_RESULT_OK:
    status_str = strdup("ok");
    break;
  case MONITOR_RESULT_WARN:
    status_str = strdup("warn");
    break;
  default:
    status_str = strdup("critical");
    break;
  }

  /* 
     space for query string, 20 digit id (max BIGINT value)     
   */
  len = (strlen("CALL update_monitior_entry(") +
	 20 +
	 strlen(",'") +
	 strlen(status_str) +
	 strlen("','") +
	 (r-> monitor_msg == NULL ? 0 : strlen(r->monitor_msg)) +
	 strlen("','") +
	 strlen(m->table_name) +
	 strlen("')"));
  
  qry = (char *)malloc(len * sizeof(char));
  snprintf(qry, len, "CALL update_monitor_entry(%s,'%s','%s','%s')",
	   m->id, status_str, 
	   (r->monitor_msg == NULL ? "" : r->monitor_msg),
	   m->table_name);

  syslog(LOG_DEBUG, "update: %s", qry);

  free(status_str);

  pthread_mutex_lock(&sql_mutex);

  rc = mysql_query(mysql, qry);

  do {
    result = mysql_store_result(mysql);
    if (result) {
      mysql_free_result(result);
    } else {
      /* an error occurred or no results */
      if (mysql_field_count(mysql) != 0)
	syslog(LOG_DEBUG, "Error: %s\n", mysql_error(mysql));
    }
    rc = mysql_next_result(mysql);
  } while (rc == 0);

  pthread_mutex_unlock(&sql_mutex);

  free(qry);
  
  return(1);
}

char **_get_notify_user_list(monitor_entry_t *m, char *type)
{
  char        **rtn = NULL, *qry;
  int         len, rc, i, num_rows;
  MYSQL_RES   *result;
  MYSQL_ROW   row;
  MYSQL_FIELD *fields;
  long        *lengths;

  /* 
     space for query string, 20 digit id (max BIGINT value)     
   */
  len = (strlen("CALL get_monitor_notification(") +
	 20 +
	 strlen(",'") +
	 strlen(m->table_name) +
	 strlen("','") +
	 strlen(type) +
	 strlen("')"));
  
  qry = (char *)malloc(len * sizeof(char));
  snprintf(qry, len, "CALL get_monitor_notification(%s,'%s','%s')",
	   m->id, m->table_name, type);

  pthread_mutex_lock(&sql_mutex);

  rc = mysql_query(mysql, qry);

  do {
    result = mysql_store_result(mysql);
    if (result) {
      num_rows = mysql_num_rows(result);
      if (num_rows) {
	rtn = (char **)malloc(sizeof(char *) * (num_rows + 1));
	i = 0;
	while((row = mysql_fetch_row(result)) != NULL) {
	  rtn[i] = strdup((char *)row[0]);	       
	  i++;
	}
	rtn[i] = NULL;
      }
      mysql_free_result(result);
    } else {
      /* an error occurred or no results */
      if (mysql_field_count(mysql) != 0)
	syslog(LOG_DEBUG, "Error: %s\n", mysql_error(mysql));
    }
    rc = mysql_next_result(mysql);
  } while (rc == 0);

  pthread_mutex_unlock(&sql_mutex);

  free(qry);

  return(rtn);
}

void _add_ssl_monitor(char *dev_id, char *addr, int port)
{
  char *qry, *url;

  url = (char *)malloc(sizeof(char) * MAX_MYSQL_DISC_QRY_LEN);
  snprintf(url, MAX_MYSQL_DISC_QRY_LEN, "https://%s:%d", addr, port);

  qry = (char *)malloc(sizeof(char) * 2 * MAX_MYSQL_DISC_QRY_LEN);

  snprintf(qry, 2 * MAX_MYSQL_DISC_QRY_LEN,
	   "INSERT INTO certificate_monitors VALUES(0, '%s', '%s', 1440, NOW(), NOW(), 'new', '', 0)",
	   dev_id, url);

  mysql_query(mysql, qry);

  free(url);
  free(qry);
}

#endif
