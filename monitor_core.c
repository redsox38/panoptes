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

#include "panoptes.h"
#include "panoptes/configuration.h"
#include <getopt.h>
#include <signal.h>
#include <pthread.h>
#include <sys/resource.h>
#include <stdio.h>

extern void *monitor_thread(void *);
extern void *shutdown_thread(void *);

/* array of command line options */
static struct option long_options[] = {
  {"configfile", 1, 0, 'c'},
  {0,0,0,0}
};

char            *configfile = NULL;
pthread_t       *threads, shutdown_thr;
int             stop_threads = 0;
int             working_count = 0;
pthread_cond_t  working = PTHREAD_COND_INITIALIZER;
pthread_mutex_t working_lock = PTHREAD_MUTEX_INITIALIZER;

/* display help message */
void usage() 
{
  fprintf(stderr, "Usage:\n");
  fprintf(stderr, "\t-c, --configfile <configuration file>\n");
}

int main(int argc, char *argv[]) {
  extern char        *optarg;
  extern int         optind, optopt, opterr;
  int                rc, i, c, option_index, num_threads;
  char               *p = NULL;
  sigset_t           sigmask;
  struct rlimit      lim;
  char               *facil_str;
  int                facil = -1;
  CODE               *cs;

  /* process command line */

  while ((c = getopt_long(argc, argv, "c:", long_options, 
                          &option_index)) != -1) {
    switch (c) {
    case 'c':
      configfile = strdup(optarg);
      break;
    case '?':
      usage();
      exit(-1);
      break;
    }
  }

  /* set pertinent resource limits as high as we can */
  if (getrlimit(RLIMIT_NOFILE, &lim) < 0) {
    perror("getrlimit");
  }
  lim.rlim_cur = lim.rlim_max;

  if (setrlimit(RLIMIT_NOFILE, &lim) < 0) {
    perror("setrlimit");
  }

  if (configfile == NULL)
    configfile = strdup(CONFIG_FILE);

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
  
  openlog("panoptes_monitor", LOG_PID, facil);

  disconnect_from_tty();
  
  syslog(LOG_NOTICE, "monitor starting");

  /* parent terminates */
  if (fork()){
    exit(0);
  }

  set_pidfile(PIDFILE);

  if (database_module_init() < 0) {
    exit(-1);
  }

  /* initialize backed database connection */

  if (database_open(0) < 0) {
    exit(-1);
  }

  /* start monitoring ... */
  /* initialize monitor threads */ 
  p = get_config_value("monitor.threads");
  sscanf(p, "%d", &num_threads);
  free(p);

  if ((threads = (pthread_t *)malloc(sizeof(pthread_t *) * 
				     num_threads)) == NULL) {
    perror("malloc");
    exit(-1);
  }

  /* block signals that will be handled by other threads */
  sigemptyset(&sigmask);
  sigaddset(&sigmask, SIGINT);
  sigaddset(&sigmask, SIGPIPE);
  sigaddset(&sigmask, SIGTERM);
  sigaddset(&sigmask, SIGSEGV);
  sigaddset(&sigmask, SIGBUS);
  pthread_sigmask(SIG_BLOCK, &sigmask, NULL);

  /* start termination signal handler thread */
  if ((rc = pthread_create(&shutdown_thr, NULL, 
			   shutdown_thread, (void *)NULL)) != 0)  {
    perror("pthread_create");
    exit(-1);
  }
  pthread_detach(shutdown_thr);

  for (i = 0; i < num_threads; i++) {
    if ((rc = pthread_create(&(threads[i]), NULL, 
			     monitor_thread, (void *)NULL)) != 0)  {
      perror("pthread_create");
      exit(-1);
    }
  }

  /* wait for threads to finish */
  for (i = 0; i < num_threads; i++) {
    if ((rc = pthread_join(threads[i], NULL)) != 0) {
      perror("pthread_join");
      exit(-1);
    }
  }

}
