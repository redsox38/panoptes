#ifndef _MONITOR_CORE_H
#define _MONITOR_CORE_H

#define MONITOR_RESULT_NEW 0
#define MONITOR_RESULT_OK 1
#define MONITOR_RESULT_PENDING 2
#define MONITOR_RESULT_WARN 3
#define MONITOR_RESULT_ERR 4

struct monitor_entry {
  char *table_name;
  char *id;
  char **attrs;
  char **vals;
};

typedef struct monitor_entry monitor_entry_t;

struct monitor_result {
  unsigned short status;
  char           *perf_title;
  char           *perf_data;
  char           *monitor_msg;
};

typedef struct monitor_result monitor_result_t;

#ifdef max
#undef max
#endif

#define max(x,y) ((x) > (y) ? (x) : (y))

/* default thresholds */
#define PANOPTES_DEFAULT_CERT_WARN_DAYS 30
#define PANOPTES_DEFAULT_CERT_CRITICAL_DAYS 15

#define PANOPTES_DEFAULT_PING_TIMEOUT_SECS 30
#define PANOPTES_DEFAULT_PORT_TIMEOUT_SECS 30

/* prototypes */
monitor_entry_t *allocate_monitor_entry(monitor_entry_t *);
monitor_result_t *allocate_monitor_result(monitor_result_t *);
void free_monitor_entry(monitor_entry_t *, int);
void free_monitor_result(monitor_result_t *, int);
char *get_attr_val(monitor_entry_t *, char *);
monitor_result_t *monitor_port(char *, char *, int, monitor_result_t *);
char **get_notify_user_list(monitor_entry_t *, char *);
#endif
