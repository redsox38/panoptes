#ifndef _PANOPTES_H
#define _PANOPTES_H

#include "config.h"
#include <stdlib.h>
#include <stdio.h>

#ifdef HAVE_SYSLOG_H
#include <syslog.h>
#endif

struct disc_port_list {
  int port;
  struct disc_port_list *next;
};

typedef struct disc_port_list disc_port_list_t;
 
#endif
