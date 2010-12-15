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
#include "database.h"
#include <dlfcn.h>
#include "panoptes/monitor_core.h"

/*
  database container that passes calls off to shared library particular to
  database backend
*/

/* global variable holding pointed to database library */
void *lib_handle;

/* function called by discover on sig term */
void database_term_handler()
{
  void (*close_ptr)();
  
  /* load term handler function if there is one */
  if ((close_ptr = (void (*)())dlsym(lib_handle, "_term_handler")) != NULL) {
    (*close_ptr)();
  }
  
  dlclose(lib_handle);
}

/* load database shared library */
int database_module_init()
{
  char *mod_file = NULL;

  mod_file = get_config_value("lib.database");
  if (mod_file != NULL) {
    lib_handle = dlopen(mod_file, RTLD_LAZY|RTLD_GLOBAL);
    
    free(mod_file);

    if (lib_handle == NULL) {
      syslog(LOG_ALERT, "dlopen: %s", dlerror());
      return(-1);
    }
  } else {
    syslog(LOG_ALERT, "lib entry has no database attribute");
    return(-1);
  }

  return(0);

}

/* call library's _database_open function */
int database_open(int initialize)
{
  int  r = -1;

  int (*open_ptr)();
  
  /* load open function */
  if ((open_ptr = (int (*)(int))dlsym(lib_handle, "_database_open")) != NULL) {
    r = (*open_ptr)(initialize);
  } else {
    syslog(LOG_ALERT, "_database_open not defined");
  }

  return(r);
}

/* call library's _get_next_monitor_entry function */
void get_next_monitor_entry(monitor_entry_t *m)
{

  void (*get_ptr)(monitor_entry_t *);

  /* load get function */
  if ((get_ptr = (void (*)(monitor_entry_t *))dlsym(lib_handle, "_get_next_monitor_entry")) != NULL) {
    (*get_ptr)(m);
  } else {
    syslog(LOG_ALERT, "_get_next_monitor_entry not defined");
  }
}

/* call library's _add_discovered_connection function */
void add_discovered_connection(char *src, int src_port, char *dst, 
			       int dst_port, char *prot)
{

  void (*insert_ptr)(char *, int, char *, int, char *);

  /* load add function */
  if ((insert_ptr = (void (*)(char *, int, char *, int, char *))dlsym(lib_handle, "_add_discovered_connection")) != NULL) {
    (*insert_ptr)(src, src_port, dst, dst_port, prot);
  } else {
    syslog(LOG_ALERT, "_add_discovered_connection not defined");
  }
}

/* call library's _add_monitor_port function */
void add_monitor_port(char *src, int src_port, char *prot)
{

  void (*insert_ptr)(char *, int, char *);

  /* load add function */
  if ((insert_ptr = (void (*)(char *, int, char *))dlsym(lib_handle, "_add_monitor_port")) != NULL) {
    (*insert_ptr)(src, src_port, prot);
  } else {
    syslog(LOG_ALERT, "_add_monitor_port not defined");
  }
}

/* call library's _update_monitor_entry function */
int update_monitor_entry(monitor_entry_t *m, monitor_result_t *r)
{

  int rc = -1;
  int (*update_ptr)(monitor_entry_t *, monitor_result_t *);

  /* load update function */
  if ((update_ptr = (int (*)(monitor_entry_t *, monitor_result_t *))dlsym(lib_handle, "_update_monitor_entry")) != NULL) {
    rc = (*update_ptr)(m, r);
  } else {
    syslog(LOG_ALERT, "_update_monitor_entry not defined");
  }

  return(rc);
}

/* call library's _get_notify_users function */
char **get_notify_user_list(monitor_entry_t *m)
{
  char **r = NULL;
  char **(*notify_list_ptr)(monitor_entry_t *);

  if ((notify_list_ptr = (char ** (*)(monitor_entry_t *))dlsym(lib_handle, "_get_notify_user_list")) != NULL) {
    r = (*notify_list_ptr)(m);
  } else {
    syslog(LOG_ALERT, "_get_notify_user_list not defined");
  }
  
  return(r);
}

/* call library's _add_ssl_monitor routine */
void add_ssl_monitor(char *dev_id, char *addr, int port)
{
  
  int rc = -1;
  void (*add_ptr)(char *, char *, int);

  /* load add function */
  if ((add_ptr = (void (*)(char *, char *, int))dlsym(lib_handle, "_add_ssl_monitor")) != NULL) {
    (*add_ptr)(dev_id, addr, port);
  } else {
    syslog(LOG_ALERT, "_add_ssl_monitor not defined");
  }

}

