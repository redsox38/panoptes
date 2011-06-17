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
#include <pthread.h>
#include "panoptes/monitor_core.h"

/* allocate_monitor_entry
 *
 * parameters: monitor_entry_t NULL or pointer address
 *
 * return: monitor_entry_t *
 *
 * if input is null, allocate a new monitor_entry and initialize it to null, otherwise just initialize the
 * entry that was passed in to null
 */
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

/* allocate_monitor_result
 *
 * parameters: monitor_result_t NULL or pointer address
 *
 * return: monitor_result_t *
 *
 * if input is null, allocate a new monitor_result and initialize it to null, otherwise just initialize the
 * entry that was passed in to null
 */
monitor_result_t *allocate_monitor_result(monitor_result_t *m)
{
  monitor_result_t *r;

  if (m == NULL) {
    r = (monitor_result_t *)malloc(sizeof(monitor_result_t));
    r->perf_title = NULL;
    r->perf_data = NULL;
    r->monitor_msg = NULL;
    return(r);
  } else {
    m->perf_title = NULL;
    m->perf_data = NULL;
    m->monitor_msg = NULL;    
    return(m);
  }
}

/* get_attr_val
 *
 * parameters: monitor_entry_t entry to search for attributes in
 *             char * attribute name to search for in the monitor entry
 *
 * return: char *
 *
 * Iterate over attributes within a monitor entry looking for the given atribute.  Returns the value of the attribute if found,
 * otherwise returns null.
 */
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

/* free_monitor_entry
 *
 * parameters: monitor_entry_t entry to free
 *             int flag indicating whether or not ot free structure as well
 *
 * return: none
 *
 * Free all of the fields and attributes from the given monitor entry.  If flag is true, also
 * free the underlying data structure.
 */
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

/* free_monitor_result
 *
 * parameters: monitor_result_t entry to free
 *             int flag indicating whether or not ot free structure as well
 *
 * return: none
 *
 * Free all of the fields from the given monitor result.  If flag is true, also
 * free the underlying data structure.
 */
void free_monitor_result(monitor_result_t *r, int free_struct)
{

  if (r->perf_title != NULL)
    free(r->perf_title);

  if (r->perf_data != NULL)
    free(r->perf_data);

  if (r->monitor_msg != NULL)
    free(r->monitor_msg);

  if (free_struct)
    free(r);
}
