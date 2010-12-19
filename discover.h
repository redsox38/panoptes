#ifndef _DISCOVER_H
#define _DISCOVER_H

#include "config.h"
#include <stdlib.h>
#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

struct disc_port_list {
  int port;
  struct disc_port_list *next;
};

typedef struct disc_port_list disc_port_list_t;

struct seen_list {
  in_addr_t        addr;
  disc_port_list_t *ports;
  struct seen_list *next;
};

typedef struct seen_list seen_list_t;

void free_port_list(disc_port_list_t *);
void free_seen_list(seen_list_t *);
void insert_seen_node(struct in_addr, int);
int seen_entry(struct in_addr, int);

#endif
