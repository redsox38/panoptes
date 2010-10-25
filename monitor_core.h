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
  unsigned short status;
  char           *perf_data;
  char           *monitor_msg;
};

typedef struct monitor_result monitor_result_t;

#define max(x,y) ((x) > (y) ? (x) : (y))

/* prototypes */
monitor_entry_t *allocate_monitor_entry(monitor_entry_t *);
monitor_result_t *allocate_monitor_result(monitor_result_t *);
void free_monitor_entry(monitor_entry_t *, int);
void free_monitor_result(monitor_result_t *, int);
char *get_attr_val(monitor_entry_t *, char *);
monitor_result_t *monitor_port(char *, char *, int);
#endif
