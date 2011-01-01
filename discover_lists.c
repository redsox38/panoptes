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
#include "discover.h"
#include "panoptes/configuration.h"

extern seen_list_t *seen_list;
extern port_list_t *auto_port_list;

/* is_in_port_list
 *
 * parameters: int port to look for
 *             port_list * sorted linked list of ports to search through for given port
 *
 * return: int 0 if not found, 1 if found
 *
 * Iterate through the provided list and return true of false if the port appears in the list.  Called
 * by discover to look through auto/ignore port lists or port lists on seen ip entries
 */
int is_in_port_list(int port, port_list_t *list_head) 
{
  int r = 0;
  port_list_t *p;
  
  p = list_head;

  while (p != NULL) {
    syslog(LOG_DEBUG, "port check %d ?= %d", p->port, port);
    if (p->port == port) {
      r = 1;
      p = NULL;
    } else {
      p = p->next;
    }
  }
  
  return(r);
}

/* seen_entry
 *
 * parameters: in_addr ip address of entry to look for
 *             int     port to look for
 *
 * return: int 0 if not found, 1 if found
 *
 * Iterate through the list of seen ip/port entries looking for the given entry and return
 * true or false depending on whether or not it is found.  The list is a list of ip address entries
 * as longs each of which contain a list of port entries.  Both sets of lists are sorted at insertion time.
 */
int seen_entry (struct in_addr i_addr, int port)
{
  seen_list_t      *p;
  port_list_t *q;
  long             addr = i_addr.s_addr;

  p = seen_list;
  
  while (p != NULL) {
    if (p->addr == addr) {
      q = p->ports;
      while (q != NULL) {
	if (q->port == port) {
	  return(1);
	}
	q = q->next;
      }
      return(0);
    } else if (p->addr > addr) {
      return(0);
    }
    p = p->next;
  }

  return(0);
}

/* convert port string from configuration fileinto list
 * called for both the auto port list and the ignore port list configuration parameters
 */
port_list_t *build_port_list(char *port_str)
{
  char *p;
  port_list_t *r, *last = NULL, *rtn = NULL;

  p = strtok(port_str, ",");
  while (p != NULL) {
    r = (port_list_t *)malloc(sizeof(port_list_t));
    sscanf(p, "%d", &(r->port));
    r->next = NULL;

    if (rtn == NULL) {
      rtn = r;
      last = r;
    } else {
      last->next = r;
      last = r;
    }
    p = strtok(NULL, ",");
  }

  return(rtn);
}

/*
  Free seen list
 */
void free_seen_list(seen_list_t *head)
{
  seen_list_t *s, *t;
  
  if (head) {
    s = head;
    while (s != NULL) {
      t = s->next;
      free_port_list(s->ports);
      free(s);
      s = t;
    }
  }

}

/* free port list */
void free_port_list (port_list_t *head)
{
  port_list_t *p, *q;
  
  if (head) {
    p = head;
    while(p != NULL) { 
      q = p->next;
      free(p);
      p = q;
    }
  }
}

/* 
 * insert_seen_node
 *
 * parameters: in_addr ip address of entry to add
 *             int     port of entry to add
 *
 * return: void
 *
 * iterate through seen list and add port entry to that list.  If there is not already a node in the list
 * for the given address then a new one will be allocated.
 *
 */
void insert_seen_node(struct in_addr i_addr, int port)
{
  seen_list_t *p, *q, *t;
  port_list_t *prt, *s;
  int         append = 1;
  long        addr = i_addr.s_addr;
  time_t      now;

  now = time(0);

  if (seen_list == NULL) {
    seen_list = (seen_list_t *)malloc(sizeof(seen_list_t));
    seen_list->addr = addr;
    seen_list->next = NULL;
    seen_list->last_visited = time(0);
    prt = (port_list_t *)malloc(sizeof(port_list_t));    
    prt->port = port;
    prt->next = NULL;
    seen_list->ports = prt;
  } else {
    p = seen_list;
    q = seen_list;
    while (p != NULL) {
      if (addr < p->addr) {
	/* insert here */
	t = (seen_list_t *)malloc(sizeof(seen_list_t));
	t->last_visited = time(0);
	t->addr = addr;
	prt = (port_list_t *)malloc(sizeof(port_list_t));    
	prt->port = port;
	prt->next = NULL;
	t->ports = prt;
	t->next = p;
	q->next = t;
	append = 0;
	p = NULL;
      } else if (addr == p->addr) {
	/* update last touched time for cache clearing */
	p->last_visited = time(0);

	/* append to port list */
	s = p->ports;
	while(s->next != NULL)
	  s = s->next;

	s->next = (port_list_t *)malloc(sizeof(port_list_t));
	s->next->port = port;
	s->next->next = NULL;
      } else if (addr > p->addr) {
	/* see if this node should be purged */
	if (p->last_visited < (now - SEEN_LIST_PURGE_TIME)) {
	  q->next = p->next;
	  free_port_list(p->ports);
	  free(p);
	  p = q->next;
	} else {
	  q = p;
	  p = p->next;
	}
      }
    }

    if (append) {
      t = (seen_list_t *)malloc(sizeof(seen_list_t));
      t->addr = addr;
      t->last_visited = time(0);
      prt = (port_list_t *)malloc(sizeof(port_list_t));    
      prt->port = port;
      prt->next = NULL;
      t->ports = prt;
      t->next = NULL;
      q->next = t;
    }
  }
}
