#ifndef _MONITOR_CORE_H
#define _MONITOR_CORE_H

struct monitor_entry {
  char *table_name;
  char *id;
  char **attrs;
  char **vals;
};

typedef struct monitor_entry monitor_entry_t;

#endif
