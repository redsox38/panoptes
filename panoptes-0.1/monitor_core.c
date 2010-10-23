#include "config.h"
#include "utils/configuration.h"
#include <getopt.h>
#include <signal.h>
#include <stdlib.h>
#include <pthread.h>
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
pthread_mutex_t mysql_mutex;

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

  if (configfile == NULL)
    configfile = strdup(CONFIG_FILE);

  if (load_config(configfile) < 0) {
    exit(-1);
  }

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
  (void *)sscanf(p, "%d", &num_threads);
  free(p);

  if ((threads = (pthread_t *)malloc(sizeof(pthread_t *) * 
				     num_threads)) == NULL) {
    perror("malloc");
    exit(-1);
  }

  /* block signals that will be handled by other threads */
  (void *)sigemptyset(&sigmask);
  (void *)sigaddset(&sigmask, SIGINT);
  (void *)sigaddset(&sigmask, SIGPIPE);
  (void *)sigaddset(&sigmask, SIGTERM);
  (void *)sigaddset(&sigmask, SIGSEGV);
  (void *)sigaddset(&sigmask, SIGBUS);
  (void *)pthread_sigmask(SIG_BLOCK, &sigmask, NULL);


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
