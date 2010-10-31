#include "panoptes.h"
#include <pthread.h>
#include "monitor_core.h"

monitor_entry_t *allocate_monitor_entry(monitor_entry_t *m)
{
  monitor_entry_t *r;

  if (m == NULL) {
    r = (monitor_entry_t *)malloc(sizeof(monitor_entry_t));
    r->table_name = NULL;
    r->id = NULL;
    r->attrs = NULL;
    r->vals = NULL;
    
    return(r);
  } else {
    m->table_name = NULL;
    m->id = NULL;
    m->attrs = NULL;
    m->vals = NULL;
    
    return(m);
  }
}

monitor_result_t *allocate_monitor_result(monitor_result_t *m)
{
  monitor_result_t *r;

  if (m == NULL) {
    r = (monitor_result_t *)malloc(sizeof(monitor_result_t));
    r->perf_data = NULL;
    r->monitor_msg = NULL;
    return(r);
  } else {
    m->perf_data = NULL;
    m->monitor_msg = NULL;    
    return(m);
  }
}

char *get_attr_val(monitor_entry_t *m, char *attr_name) {
  char **p, **q;
  char *r = NULL;

  p = m->attrs;
  q = m->vals;
  while (*p != NULL) {
    if (!strcmp(*p, attr_name)) {
      r = *q;
      break;
    }
    *p++;
    *q++;
  }

  return(r);
}

void free_monitor_entry(monitor_entry_t *m, int free_struct)
{
  char **p;

  if (m->table_name != NULL)
    free(m->table_name);
  if (m->id != NULL)
    free(m->id);

  if (m->attrs != NULL) {
    p = m->attrs;
    while (*m->attrs != NULL){
      free(*m->attrs);
      *m->attrs = NULL;
      *m->attrs++;
    }
    free(p);
  }

  if (m->vals != NULL) {
    p = m->vals;
    while (*m->vals != NULL){
      free(*m->vals);
      *m->vals = NULL;
      *m->vals++;
    }
    free(p);
  }

  if (free_struct == 1)
    free(m);
}

void free_monitor_result(monitor_result_t *r, int free_struct)
{

  if (r->perf_data != NULL)
    free(r->perf_data);

  if (r->monitor_msg != NULL)
    free(r->monitor_msg);

  if (free_struct)
    free(r);
}
