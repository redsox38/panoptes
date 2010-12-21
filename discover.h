#ifndef _DISCOVER_H
#define _DISCOVER_H

#include "config.h"
#include <stdlib.h>
#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

/* seconds to cache seen entries in discovery */
#define SEEN_LIST_PURGE_TIME 21600

struct port_list {
  int port;
  struct port_list *next;
};

typedef struct port_list port_list_t;

struct seen_list {
  in_addr_t        addr;
  port_list_t      *ports;
  time_t           last_visited;
  struct seen_list *next;
};

typedef struct seen_list seen_list_t;

port_list_t *build_port_list(char *);
void free_port_list(port_list_t *);
void free_seen_list(seen_list_t *);
void insert_seen_node(struct in_addr, int);
int seen_entry(struct in_addr, int);

#endif
