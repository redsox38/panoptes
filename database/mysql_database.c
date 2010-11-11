#include "../config.h"
#undef VERSION
#undef PACKAGE
#undef PACKAGE_NAME
#undef PACKAGE_STRING
#undef PACKAGE_VERSION
#undef PACKAGE_TARNAME
#undef PACKAGE_BUGREPORT
#ifdef HAVE_LIBMYSQLCLIENT_R
#include "../utils/configuration.h"
#include "mysql_database.h"
#include <my_global.h>
#include <mysql.h>
#include <pwd.h>
#include <string.h>
#include "monitor_core.h"
#include <pthread.h>

pthread_mutex_t sql_mutex = PTHREAD_MUTEX_INITIALIZER;
MYSQL *mysql = NULL;

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
    free(loader);
  }

  return(0);
}

/* append pcap entry to database */
void _add_discovered_connection(char *src, int src_port, char *dst, 
				int dst_port, char *prot)
{
  char *qry;

  qry = (char *)malloc(sizeof(char) * MAX_MYSQL_DISC_QRY_LEN);

  snprintf(qry, MAX_MYSQL_DISC_QRY_LEN,
	   "INSERT INTO discovered VALUES(0, '%s', %d, '%s', %d, '%s', NOW(), 0)",
	   src, src_port, dst, dst_port, prot);

  mysql_query(mysql, qry);

  free(qry);
}

void _get_next_monitor_entry(monitor_entry_t *m)
{
  MYSQL_RES   *result;
  MYSQL_ROW   row;
  MYSQL_FIELD *fields;
  int         i, j, rc, num_fields;

  pthread_mutex_lock(&sql_mutex);

  rc = mysql_query(mysql, "CALL get_next_monitor_entry()");

  do {
    result = mysql_store_result(mysql);
    if (result) {
      row = mysql_fetch_row(result);
      fields = mysql_fetch_fields(result);

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
	  m->vals[j] = strdup((char *)row[i]);	       
	  j++;
	}
      }

      m->attrs[j] = NULL;
      m->vals[j] = NULL;

      mysql_free_result(result);
    } else {
      /* an error occurred or no results */
      if (mysql_field_count(mysql) != 0)
	printf("Error: %s\n", mysql_error(mysql));
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
    status_str = strdup("error");
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
	printf("Error: %s\n", mysql_error(mysql));
    }
    rc = mysql_next_result(mysql);
  } while (rc == 0);

  pthread_mutex_unlock(&sql_mutex);

  free(qry);
}

void _add_ssl_monitor(char *dev_id, char *addr, int port)
{
  char *qry, *url;

  url = (char *)malloc(sizeof(char) * MAX_MYSQL_DISC_QRY_LEN);
  snprintf(url, MAX_MYSQL_DISC_QRY_LEN, "https://%s:%d", addr, port);

  qry = (char *)malloc(sizeof(char) * 2 * MAX_MYSQL_DISC_QRY_LEN);

  snprintf(qry, 2 * MAX_MYSQL_DISC_QRY_LEN,
	   "INSERT INTO certificate_monitors VALUES(0, '%s', '%s', 1440, NOW(), NOW(), 'new', '')",
	   dev_id, url);

  mysql_query(mysql, qry);

  free(url);
  free(qry);
}

#endif
