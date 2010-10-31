#include "panoptes.h"
#include "utils/configuration.h"
#include <getopt.h>
#include <signal.h>

/* array of command line options */
static struct option long_options[] = {
  {"configfile", 1, 0, 'c'},
  {"initdb", 1, 0, 'd'},
  {"interface", 1, 0, 'i'},
  {"readfile", 1, 0, 'r'},
  {0,0,0,0}
};

char *dev = NULL, *readfile = NULL, *configfile = NULL;

/* local termination handler for this file */
void core_term_handler()
{
  if (dev)
    free(dev);
  
  if (readfile)
    free(readfile);

  if (configfile)
    free(configfile);
}

/* 
   registered signal handler
   calls termination handler function for
   all of the other files/libraries
*/
void term_handler(int signum)
{
  packet_term_handler();
  database_term_handler();
  config_term_handler();
  core_term_handler();

  closelog();
}

/* display help message */
void usage() 
{
  fprintf(stderr, "Usage:\n");
  fprintf(stderr, "\t-c, --configfile <configuration file>\n");
  fprintf(stderr, "\t-d, --initdb\n");
  fprintf(stderr, "\t-i, --interface <interface for packet capture>\n");
  fprintf(stderr, "\t-r, --readfile <packet capture file>\n");
}

int main(int argc, char *argv[]) {
  extern char        *optarg;
  extern int         optind, optopt, opterr;
  int                c, option_index;
  int                init_db_flag = 0;
  char               *facil_str;
  int                facil;

  /* process command line */

  while ((c = getopt_long(argc, argv, "di:r:c:", long_options, 
                          &option_index)) != -1) {
    switch (c) {
    case 'c':
      configfile = strdup(optarg);
      break;
    case 'd':
      init_db_flag = 1;
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
  sscanf(facil_str, "%d", &facil);
  free(facil_str);

  openlog("panoptes_discover", LOG_PID, LOG_FAC(facil));

  if (database_module_init() < 0) {
    exit(-1);
  }
  
  /* initialize backed database connection */
  if (database_open(init_db_flag) < 0) {
    exit(-1);
  }

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
