#include "config.h"
#include "utils/configuration.h"
#include <getopt.h>
#include <signal.h>
#include <stdlib.h>
#include <pthread.h>
#include <stdio.h>
#include <rrd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <errno.h>

#include "monitor_core.h"

/* update rrd */
void panoptes_rrd_update(char *path, monitor_result_t *r)
{
  char *args[2], ds_str[256], *p, *q, *tkn;
  int  num_args = 0;

  snprintf(ds_str, 256, "%ld:", time(0));

  p = r->perf_data;  

  p = strtok_r(p, ";", &tkn);
  while(p != NULL) {
    q = index(p, '|');
    q++;
    strncat(ds_str, q, strlen(q));
    strncat(ds_str, ":", 1);      

    p = strtok_r(NULL, ";", &tkn);
  }

  /* remove trailing : */
  ds_str[strlen(ds_str) - 2] = '\0';

  args[num_args++] = ds_str;

  rrd_clear_error();
  rrd_update_r(path, NULL, num_args, (const char **)args);
  if (rrd_test_error()) {
    fprintf(stderr, "rrd_update: %s\n", rrd_get_error());
  }

}

/* create rrd if it doesn't exist */
void panoptes_rrd_create(char *path, 
			 char *table_name, 
			 monitor_result_t *r)
{
  char *args[128];
  char *rrd_config_param, *rrd_tpl, *p;
  /* allow up to 16 data sources in a single rrd */
  char ds[16][64];
  int  num_args = 0, ds_count = 0;
 
  /* get config value for this table with RRD setup params if there is one */
  rrd_config_param = (char *)malloc(strlen(table_name) + 
				    strlen("_rrd.datasource_type") + 
				    1);
  sprintf(rrd_config_param, "%s_rrd.datasource_type", table_name);

  /* take value from param or default to GAUGE if none is provided */
  rrd_tpl = get_config_value(rrd_config_param);
  if (rrd_tpl == NULL) 
    rrd_tpl = strdup("GAUGE");

  /* add a DS for each data source in the perf_data string */
  /* heartbeat hard coded to 8 * step interval */
  p = r->perf_data;  
  sprintf(ds[ds_count],"DS:ds%d:%s:7200:U:U", ds_count, rrd_tpl);
  args[num_args++] = ds[ds_count];
  while((p = index(p, ';')) != NULL) {
    p++;
    ds_count++;
    sprintf(ds[ds_count],"DS:ds%d:%s:7200:U:U", ds_count, rrd_tpl);    
    args[num_args++] = ds[ds_count];
  }

  args[num_args++] = "RRA:AVERAGE:0.5:1:240";
  args[num_args++] = "RRA:AVERAGE:0.5:24:240";
  args[num_args++] = "RRA:AVERAGE:0.5:168:240";
  args[num_args++] = "RRA:AVERAGE:0.5:672:240";
  args[num_args++] = "RRA:AVERAGE:0.5:5760:370";

  rrd_clear_error();
  rrd_create_r(path, 900, time(0), num_args, (const char **)args);
  if (rrd_test_error()) {
    fprintf(stderr, "rrd_create: %s\n", rrd_get_error());
  }

  free(rrd_tpl);
}


/* create a directory recursively, ignoring umask */
int mkdir_p(char *path, mode_t mode)
{
  int         r;
  char        *np, *p, *q, *tkn;
  mode_t      old_umask;
  struct stat sb;

  old_umask = umask(0);
  np = strdup(path);
  
  q = (char *) malloc(strlen(np) + 1);
  sprintf(q, "/");

  p = strtok_r(np, "/", &tkn);
  while(p != NULL) {
    strncat(q, p, strlen(p));

    /* see if directory exists and create it if it doesn't */
    if (stat(q, &sb) < 0) {
      if (errno == ENOENT) {
	r = mkdir(q, mode);
      }
    }

    p = strtok_r(NULL, "/", &tkn);
    strncat(q, "/", sizeof(char));
  }

  umask(old_umask);

  free(np);

  return(r);
}

void update_performance_data(char *address, 
			     char *rrd_name,
			     monitor_entry_t *m, 
			     monitor_result_t *r)
{
  char        *rrd_root, *rrd_path;
  char        errbuf[1024];
  int         len, err = 0;
  struct stat st;

  /* build rrd path */
  rrd_root = get_config_value("rrd.directory");
  
  if (rrd_root == NULL) {
    fprintf(stderr, "rrd root not defined\n");
    return;
  }

  len = strlen(rrd_root) +
    strlen("/") +
    strlen(address) + 
    strlen("/") +
    strlen(m->table_name) +
    strlen("/") +
    strlen(rrd_name) +
    strlen(".rrd") +
    1;

  rrd_path = (char *)malloc(len * sizeof(char));
  snprintf(rrd_path, len, "%s/%s/%s", rrd_root, address, m->table_name);

  /* create path if it doesn't exist */
  if (stat(rrd_path, &st) < 0) {
    switch (errno) {
    case ENOENT:
      mkdir_p(rrd_path, S_IRUSR|S_IWUSR|S_IXUSR);
      break;
    default:
      strerror_r(errno, errbuf, 1024);
      fprintf(stderr, "stat: %s", errbuf);
      err = 1;
      break;
    }
  }

  if (!err) {
    snprintf(rrd_path, len, "%s/%s/%s/%s.rrd", rrd_root, address, 
	     m->table_name, rrd_name);
    

    /* see if we need to create rrd file */
    if (stat(rrd_path, &st) < 0) {
      switch (errno) {
      case ENOENT:
	/* create rrd */
	panoptes_rrd_create(rrd_path, m->table_name, r);
	break;
      default:
	strerror_r(errno, errbuf, 1024);
	fprintf(stderr, "stat: %s", errbuf);
	err = 1;
	break;
      }
    }
  }

  if (!err) {
    /* update rrd with perf data */
    panoptes_rrd_update(rrd_path, r);
  }

  free(rrd_root);
  free(rrd_path);

  return;
}

