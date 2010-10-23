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

#ifdef _REENTRANT
#include <pthread.h>

pthread_mutex_t sql_mutex;
#endif

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
  char qry[MAX_MYSQL_DISC_QRY_LEN];

  snprintf(qry, MAX_MYSQL_DISC_QRY_LEN,
	   "INSERT INTO discovered VALUES(0, '%s', %d, '%s', %d, '%s', NOW(), 0)",
	   src, src_port, dst, dst_port, prot);

  mysql_query(mysql, qry);
}

void _get_next_monitor_entry(monitor_entry_t *m)
{
  MYSQL_RES   *result;
  MYSQL_ROW   row;
  MYSQL_FIELD *fields;
  int         i, j, rc, num_fields;

#ifdef _REENTRANT
  pthread_mutex_lock(&sql_mutex);
#endif

  rc = mysql_query(mysql, "CALL get_next_monitor_entry()");

  if (rc == 0) {
    result = mysql_store_result(mysql);
  } else {
    /* an error occurred */
    printf("Error: %s\n", mysql_error(mysql));
  }

#ifdef _REENTRANT
  pthread_mutex_unlock(&sql_mutex);
#endif

  if (rc == 0) {
    /* function only returns one row */
    if (result != NULL) {
      row = mysql_fetch_row(result); 
      fields = mysql_fetch_fields(result);

      /* fill in monitor entry */
      num_fields = mysql_num_fields(result);
      j = 0;

      m->attrs = (char **)malloc(sizeof(char *) * (num_fields - 1));
      m->vals  = (char **)malloc(sizeof(char *) * (num_fields - 1));

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

      /* terminate attr and val lists */
      m->attrs[j] = NULL;
      m->vals[j] = NULL;

      mysql_free_result(result);
    }
  }
}

#endif
