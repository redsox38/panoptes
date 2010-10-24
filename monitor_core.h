#ifndef _MONITOR_CORE_H
#define _MONITOR_CORE_H

#define MONITOR_RESULT_OK 0
#define MONITOR_RESULT_WARN 1
#define MONITOR_RESULT_ERR 2

struct monitor_entry {
  char *table_name;
  char *id;
  char **attrs;
  char **vals;
};

typedef struct monitor_entry monitor_entry_t;

struct monitor_result {
  unsigned short rst;
  char           *perf_data;
};

typedef struct monitor_result monitor_result_t;

#endif
