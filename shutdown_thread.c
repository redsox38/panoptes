#include "panoptes.h"
#include "utils/configuration.h"
#include <signal.h>
#include <pthread.h>

extern char *configfile;

void *shutdown_thread(void *arg) 
{
  sigset_t     sigs_to_catch;
  int          caught;
  
  (void *)sigemptyset(&sigs_to_catch);
  (void *)sigaddset(&sigs_to_catch, SIGINT);
  (void *)sigaddset(&sigs_to_catch, SIGTERM);
  (void *)sigaddset(&sigs_to_catch, SIGSEGV);
  (void *)sigaddset(&sigs_to_catch, SIGBUS);
  
  (void *)sigwait(&sigs_to_catch, &caught);

  
  config_term_handler();
  database_term_handler();

  if (configfile)
    free(configfile);

  
  /* terminate monitor threads */

  closelog();

  fprintf(stderr, "Terminated.\n");
}
