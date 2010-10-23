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
  char          *db, *host, *pass, *user;
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
    mysql_query(mysql, "DROP TABLE IF EXISTS discovered");
    mysql_query(mysql, "DROP TABLE IF EXISTS port_monitors");
    mysql_query(mysql, "DROP TABLE IF EXISTS group_membership");
    mysql_query(mysql, "DROP TABLE IF EXISTS devices");
    mysql_query(mysql, "DROP TABLE IF EXISTS device_groups");
    mysql_query(mysql, "DROP VIEW IF EXISTS monitor_tasks");
    if (mysql_query(mysql, "CREATE TABLE discovered (id bigint NOT NULL AUTO_INCREMENT, srcaddr varchar(15) NOT NULL, srcport smallint unsigned NOT NULL, dstaddr varchar(15) NOT NULL, dstport smallint unsigned NOT NULL, proto varchar(5) NOT NULL, modified timestamp(14), ignored tinyint default 0, PRIMARY KEY (id), UNIQUE INDEX idx (srcaddr, srcport, dstaddr, dstport, proto)) ENGINE=INNODB")) {
      mysql_close(mysql);

      free(db);
      free(host);
      free(user);
      if (pass)
	free(pass);
      return(-1);
    } 

    if (mysql_query(mysql, "CREATE TABLE devices (id bigint NOT NULL AUTO_INCREMENT, address varchar(15) NOT NULL, name varchar(255) DEFAULT NULL, PRIMARY KEY (id), UNIQUE INDEX addr (address)) ENGINE=INNODB")) {
      mysql_close(mysql);
      
      free(db);
      free(host);
      free(user);
      if (pass)
	free(pass);
      return(-1);
    }

    if (mysql_query(mysql, "CREATE TABLE port_monitors (id bigint NOT NULL AUTO_INCREMENT, device_id bigint NOT NULL, port smallint(5) unsigned NOT NULL, proto varchar(5) NOT NULL, check_interval smallint NOT NULL DEFAULT 15, last_check DATETIME DEFAULT NULL, next_check DATETIME DEFAULT NULL, status ENUM('ok','warn','error') DEFAULT NULL, PRIMARY KEY (id), UNIQUE INDEX idx (device_id,port,proto), INDEX device_id (device_id), INDEX port (port), FOREIGN KEY (device_id) REFERENCES devices(id) ON UPDATE CASCADE ON DELETE CASCADE) ENGINE=INNODB")) {
      mysql_close(mysql);
      
      free(db);
      free(host);
      free(user);
      if (pass)
	free(pass);
      return(-1);
    } 

    if (mysql_query(mysql, "CREATE TABLE device_groups (id bigint(20) NOT NULL AUTO_INCREMENT, group_name varchar(50) NOT NULL, PRIMARY KEY (id), UNIQUE KEY name (group_name)) ENGINE=InnoDB")) {
      mysql_close(mysql);
      
      free(db);
      free(host);
      free(user);
      if (pass)
	free(pass);
      return(-1);
    } 

    if (mysql_query(mysql, "CREATE TABLE group_membership (group_id bigint NOT NULL, device_id bigint NOT NULL, INDEX group_id (group_id), INDEX device_id (device_id), FOREIGN KEY (device_id) REFERENCES devices(id) ON UPDATE CASCADE ON DELETE CASCADE, FOREIGN KEY (group_id) REFERENCES device_groups(id) ON UPDATE CASCADE ON DELETE CASCADE) ENGINE=InnoDB")) {
      mysql_close(mysql);
	      
      free(db);
      free(host);
      free(user);
      if (pass)
	free(pass);
      return(-1);
    }

    if (mysql_query(mysql, "CREATE SQL SECURITY INVOKER VIEW monitor_tasks AS select 'port_monitors' AS table_name, port_monitors.id AS id, port_monitors.next_check AS next_check FROM port_monitors ORDER BY port_monitors.next_check DESC")) {
      mysql_close(mysql);
	      
      free(db);
      free(host);
      free(user);
      if (pass)
	free(pass);
      return(-1);
    }
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
