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

/* database_term_handler
 *
 * parameters: none
 * return: void
 *
 * called by main program to allow database library to perform and necessary cleanup at
 * shutdown.  The call is passed to a function in the database library.
 */
void database_term_handler()
{
  void (*close_ptr)();
  
  /* load term handler function if there is one */
  if ((close_ptr = (void (*)())dlsym(lib_handle, "_term_handler")) != NULL) {
    (*close_ptr)();
  }
  
  dlclose(lib_handle);
}

/*
 * database_monule_init
 *
 * parameters: none
 * return: int - 0 on success, -1 on failure
 *
 * reads the shared library path from the config file and opens it.
 *
 */
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

/* database_open
 * 
 * parameters: int - flag indicating whether or not to initialize the database
 * return: int - 0 on success, -1 on failure
 *
 * Looks for a function named _database_open inside the shared library and passes the call off
 * to it.  The library should do any preliminary actions that it needs to such as 
 * connecting to the database.  Returns the result from that call.
 *
 */
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

/* reset_pending_monitors
 *
 * parameters: none
 * return: void
 *
 * Looks for a function named _reset_pending_monitors inside the shared library and passes the call off
 * to it.  
 * The function in the library is expected to reset the status of any monitors that are in a pending 
 * state that have not been updated in over 15 minutes.
 *
 */
void reset_pending_monitors()
{
  void (*get_ptr)();

  /* load get function */
  if ((get_ptr = (void (*)())dlsym(lib_handle, "_reset_pending_monitors")) != NULL) {
    (*get_ptr)();
  } else {
    syslog(LOG_ALERT, "_reset_pending_monitors not defined");
  }
}

/* get_next_monitor_entry
 * 
 * parameters: monitor_entry_t * pointer to monitor entry structure to fill in 
 *                               with data from database for the next entry
 *                               memory will be allocated by the library if the result is not
 *                               null, it must be freed with free_monitor_entry.
 * return: void
 *
 * Looks for a function named _get_next_monitor_entry inside the shared library and passes the call off
 * to it.  Returns the result from that call.
 * The function in the library is expected to fill param 1 with the next entry to be polled by the monitor daemon
 * if there is no entry ready to poll it should leave the value as NULL
 *
 */
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

/* add_discovered_connection
 * 
 * parameters: char * source ip address as a string
 *             int    source port
 *             char * destination ip address as a string
 *             int    destination port
 *             char * protocol as a string.  One of tcp or udp
 *             char * os genre as returned by p0f or "unknown"
 *             char * os detail as returned by p0f or "unknown"
 * return: void
 *
 * Looks for a function named _add_discovered_connection inside the shared library and passes the call off
 * to it.  The library function is expected to insert that entry into a database table to be
 * managed later by a user via the web interface.  Returns the result from that call.
 *
 */
void add_discovered_connection(char *src, int src_port, char *dst, 
			       int dst_port, char *prot, char *os_genre, char *os_detail)
{

  void (*insert_ptr)(char *, int, char *, int, char *, char *, char *);

  /* load add function */
  if ((insert_ptr = (void (*)(char *, int, char *, int, char *, char *, char *))dlsym(lib_handle, "_add_discovered_connection")) != NULL) {
    (*insert_ptr)(src, src_port, dst, dst_port, prot, os_genre, os_detail);
  } else {
    syslog(LOG_ALERT, "_add_discovered_connection not defined");
  }
}

/* add_monitor_port
 * 
 * parameters: char * source ip address as a string
 *             int    source port
 *             char * protocol as a string.  One of tcp or udp
 *             char * os genre as returned by p0f or "unknown"
 *             char * os detail as returned by p0f or "unknown"
 * return: void
 *
 * Looks for a function named _add_monitor_port inside the shared library and passes the call off
 * to it.  The library function is expected to add the device to the device table if it is not already
 * present and add the port to the port monitors table.  Returns the result from that call.
 *
 */
void add_monitor_port(char *src, int src_port, char *prot, char *os_genre, char *os_detail)
{

  void (*insert_ptr)(char *, int, char *, char *, char *);

  /* load add function */
  if ((insert_ptr = (void (*)(char *, int, char *, char *, char *))dlsym(lib_handle, "_add_monitor_port")) != NULL) {
    (*insert_ptr)(src, src_port, prot, os_genre, os_detail);
  } else {
    syslog(LOG_ALERT, "_add_monitor_port not defined");
  }
}

/* update_monitor_entry
 * 
 * parameters: monitor_entry_t * monitor entry struct holding information on the entry that was monitored
 *             monitor_result_t * monitor result struct holding information regarding the entry status
 * return: int 0 on success, -1 on failure
 *
 * Looks for a function named _update_monitor_entry inside the shared library and passes the call off
 * to it.  The library function is expected to update the entry's status and status string from the
 * result structure if present and update the next check time for the entry.  The value returned by the
 * library call is passed to the calling program.
 *
 */
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

/* get_notify_user_list
 * 
 * parameters: monitor_entry_t * monitor entry struct holding information on the entry that was monitored
 *             char * type of notification list to retrieve (email, xmpp, ...)
 * return: char ** an array of character strings containing the email addresses for the users that 
 *                 want to get notified about status changes for this monitor.
 *
 * Looks for a function named _get_email_notify_user_list inside the shared library and passes the call off
 * to it.  The library function is expected to see which user ids are set to get notifications for the given
 * monitor entry and then check the preferences table to get their email addresses.  The return value from 
 * the library is passed back to the calling program.
 *
 */
char **get_notify_user_list(monitor_entry_t *m, char *notify_type)
{
  char **r = NULL;
  char **(*notify_list_ptr)(monitor_entry_t *, char *);

  if ((notify_list_ptr = (char ** (*)(monitor_entry_t *, char *))dlsym(lib_handle, "_get_notify_user_list")) != NULL) {
    r = (*notify_list_ptr)(m, notify_type);
  } else {
    syslog(LOG_ALERT, "_get_notify_user_list not defined");
  }
  
  return(r);
}

/* add_ssl_monitor
 * 
 * parameters: char * device id from devices table
 *             char * ip address as a string
 *             int    port
 * return: void
 *
 * Looks for a function named _add_ssl_monitor inside the shared library and passes the call off
 * to it.  The library function is expected to formulate a url from the address and port and insert it into
 * the certificate monitors table.  This function is called by the discovery tool if it finds a server
 * listening on port 443
 *
 */
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

