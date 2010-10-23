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
#include "monitor_core.h"

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

  if (mysql_real_connect(mysql, host, user, pass, db, 0, NULL, 0) == NULL) {
    fprintf(stderr, "MySQL: %s\n", mysql_error(mysql));

    free(db);
    free(host);
    free(user);
    if (pass)
      free(pass);
    return(-1);
  }

  if (initialize) {
    loader = get_config("db.sqlinit");
    mysql_query(mysql, "SOURCE %s", loader);
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
}

#endif
