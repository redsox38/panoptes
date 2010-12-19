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

#define SYSLOG_NAMES

#include "config.h"
#include "panoptes.h"
#include "discover.h"
#include "panoptes/configuration.h"
#include <getopt.h>
#include <signal.h>
#ifdef WITH_P0F
#include <sys/un.h>
#include <sys/socket.h>
#endif

/* array of command line options */
static struct option long_options[] = {
  {"configfile", 1, 0, 'c'},
  {"interface", 1, 0, 'i'},
  {"readfile", 1, 0, 'r'},
  {0,0,0,0}
};

char *dev = NULL, *readfile = NULL, *configfile = NULL;
disc_port_list_t *auto_port_list = NULL;
seen_list_t *seen_list = NULL;
#ifdef WITH_P0F
int                p0f_sock;
#endif

/* local termination handler for this file */
void core_term_handler()
{
#ifdef WITH_P0F
  shutdown(p0f_sock, 2);
  close(p0f_sock);
#endif

  free_port_list(auto_port_list);
  free_seen_list(seen_list);

  if (dev)
    free(dev);
  
  if (readfile)
    free(readfile);

  if (configfile)
    free(configfile);

  unlink(PIDFILE);
  closelog();
  exit(0);
}

/* 
   registered signal handler
   calls termination handler function for
   all of the other files/libraries
*/
void term_handler(int signum)
{
  syslog(LOG_DEBUG, "Term handler fired");
  packet_term_handler();
  database_term_handler();
  config_term_handler();
  core_term_handler();
}

/* display help message */
void usage() 
{
  fprintf(stderr, "Usage:\n");
  fprintf(stderr, "\t-c, --configfile <configuration file>\n");
  fprintf(stderr, "\t-i, --interface <interface for packet capture>\n");
  fprintf(stderr, "\t-r, --readfile <packet capture file>\n");
}

int main(int argc, char *argv[]) {
  extern char        *optarg;
  extern int         optind, optopt, opterr;
  int                c, option_index;
  int                init_db_flag = 0;
  char               *facil_str, *auto_ports;
#ifdef WITH_P0F
  char               *p0f_sock_path;
  struct sockaddr_un x;
#endif
  int                facil = -1;
  CODE               *cs;
  
  /* process command line */

  while ((c = getopt_long(argc, argv, "i:r:c:", long_options, 
                          &option_index)) != -1) {
    switch (c) {
    case 'c':
      configfile = strdup(optarg);
      break;
    case 'i':
      dev = strdup(optarg);
      break;
    case 'r':
      readfile = strdup(optarg);
      break;
    case '?':
      usage();
      exit(-1);
      break;
    }
  }

  if (configfile == NULL)
    configfile = strdup(CONFIG_FILE);

  /* install signal handler(s) */
  if (signal(SIGTERM, term_handler) == SIG_IGN)
    signal(SIGTERM, SIG_IGN);

  if (load_config(configfile) < 0) {
    exit(-1);
  }

  /* open syslog */
  facil_str = get_config_value("syslog.facility");
  for(cs = facilitynames; cs->c_name; cs++) {
    if (!(strcmp(facil_str, cs->c_name))) {
      facil = cs->c_val;
      break;
    }
  }
  free(facil_str);

  if (facil < 0) {
    fprintf(stderr, "Invalid syslog facility");
    exit(-1);
  }

  openlog("panoptes_discover", LOG_PID, facil);

  /* check for auto ports */
  auto_ports = get_config_value("discover.auto_accept_ports");
  if (auto_ports != NULL) {
    /* make list */
    syslog(LOG_DEBUG, "Got port list: %s", auto_ports);
    auto_port_list = build_port_list(auto_ports);
    free(auto_ports);
  }

  disconnect_from_tty();

  /* parent terminates */
  if (fork()){
    exit(0);
  }

  set_pidfile(PIDFILE);

  if (database_module_init() < 0) {
    exit(-1);
  }
  
  /* initialize backed database connection */
  if (database_open(init_db_flag) < 0) {
    exit(-1);
  }

#ifdef WITH_P0F
  /* see of socket path is defined and if so open it up */
  p0f_sock_path = get_config_value("discover.p0f_socket");
  if (p0f_sock_path != NULL) {
    p0f_sock = socket(PF_UNIX, SOCK_STREAM, 0);
    memset(&x, 0, sizeof(x));
    x.sun_family = AF_UNIX;
    strcpy(x.sun_path, p0f_sock_path);
    connect(p0f_sock, (struct sockaddr*)&x, sizeof(x));
  }
  free(p0f_sock_path);
#endif

  if (dev) {
    if (init_packet_capture_live(dev) < 0) {
      exit(-1);
    }
  } else  if (readfile) {
    if (init_packet_capture_from_file(readfile) < 0) {
      exit(-1);
    }
  }
  
  run_packet_capture();

  /* invoke term handler */
  kill(0, SIGTERM);
}
