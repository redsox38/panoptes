#include <stdlib.h>
#include <pthread.h>
#include <stdio.h>
#include "monitor_core.h"

monitor_entry_t *allocate_new_monitor_entry(monitor_entry_t *m)
{

  if (m != NULL) {
    m->table_name = NULL;
    m->id = NULL;
    m->attrs = NULL;
    m->vals = NULL;
  }

  return(m);
}

void free_monitor_entry(monitor_entry_t *m, int free_struct)
{
  char *p;

  if (m->table_name != NULL)
    free(m->table_name);
  if (m->id != NULL)
    free(m->id);

  if (m->attrs != NULL) {
    p = m->attrs;
    while (p != NULL){
      free(p);
      *p++;
    }
  }

  if (m->vals) {
    p = m->vals;
    while (p != NULL){
      free(p);
      *p++;
    }
  }

  if (free_struct == 1)
    free(m);
}
