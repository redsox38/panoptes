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
extern disc_port_list_t *auto_port_list;

/* search auto_port_list for port */
int is_auto_port(int port) 
{
  int r = 0;
  disc_port_list_t *p;
  
  p = auto_port_list;

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

int seen_entry (long addr, int port)
{
  seen_list_t *p;
  disc_port_list_t *q;

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

/* convert port string into list */
disc_port_list_t *build_port_list(char *port_str)
{
  char *p;
  disc_port_list_t *r, *last = NULL, *rtn = NULL;

  p = strtok(port_str, ",");
  while (p != NULL) {
    r = (disc_port_list_t *)malloc(sizeof(disc_port_list_t));
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
void free_port_list (disc_port_list_t *head)
{
  disc_port_list_t *p, *q;
  
  if (head) {
    p = head;
    while(p != NULL) { 
      q = p->next;
      free(p);
      p = q;
    }
  }
}

void insert_seen_node(long addr, int port)
{
  seen_list_t      *p, *q, *t;
  disc_port_list_t *prt, *s;
  int              append = 1;

  if (seen_list == NULL) {
    seen_list = (seen_list_t *)malloc(sizeof(seen_list_t));
    seen_list->addr = addr;
    seen_list->next = NULL;
    prt = (disc_port_list_t *)malloc(sizeof(disc_port_list_t));    
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
	t->addr = addr;
	prt = (disc_port_list_t *)malloc(sizeof(disc_port_list_t));    
	prt->port = port;
	prt->next = NULL;
	t->ports = prt;
	t->next = p;
	q->next = t;
	append = 0;
	p = NULL;
      } else if (addr == p->addr) {
	/* append to port list */
	s = p->ports;
	while(s->next != NULL)
	  s = s->next;

	s->next = (disc_port_list_t *)malloc(sizeof(disc_port_list_t));
	s->next->port = port;
	s->next->next = NULL;
      } else if (addr > p->addr) {
	q = p;
	p = p->next;
      }
    }

    if (append) {
      t = (seen_list_t *)malloc(sizeof(seen_list_t));
      t->addr = addr;
      prt = (disc_port_list_t *)malloc(sizeof(disc_port_list_t));    
      prt->port = port;
      prt->next = NULL;
      t->ports = prt;
      t->next = NULL;
      q->next = t;
    }
  }
}
