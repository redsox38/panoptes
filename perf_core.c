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
#include "utils/configuration.h"
#include <getopt.h>
#include <signal.h>
#include <pthread.h>
#include <rrd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <errno.h>

#include "monitor_core.h"

const char *colors[] = { "#00ffff", "#01fa43", "#09aa00",
			 "#ff0000", "#0000ff", "#12ab00",
			 "#022afa", "#220aee", "#0a11ee",
			 NULL };
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
    syslog(LOG_NOTICE, "rrd_update: %s", rrd_get_error());
  }

}

/* create xml template for this rrd to help graphing later */
void panoptes_rrd_xml_create(char *path,
			     monitor_entry_t *m,
			     monitor_result_t *r)
{
  FILE *fh;
  char errbuf[1024];
  char *oids, *q, *tkn;
  int  i = 0;

  if ((fh = fopen(path, "w")) != NULL) {
    fprintf(fh, "<config>\n");
    if (!strcmp(m->table_name, "port_monitors")) {
      fprintf(fh, "\t<title>%s port %s Connect Time</title>\n", 
	      get_attr_val(m, "proto"), get_attr_val(m, "port"));
      fprintf(fh, "\t<vertical_label>Seconds</vertical_label>\n");
      fprintf(fh,"\t<attribute>\n");
      fprintf(fh, "\t\t<name>ds0</name>\n");
      fprintf(fh, "\t\t<display_as>ConnectTime</display_as>\n");
      fprintf(fh, "\t\t<units>Seconds</units>\n");
      fprintf(fh, "\t\t<color>#00ffff</color>\n");
      fprintf(fh, "\t\t<type>LINE1</type>\n");
      fprintf(fh, "\t\t<legend>AVERAGE:Average connect time\\: %%lf %%Ssecs</legend>\n");
      fprintf(fh, "\t</attribute>\n");
    } else if (!strcmp(m->table_name, "ping_monitors")) {
      fprintf(fh, "\t<title>ICMP Response Time</title>\n");
      fprintf(fh, "\t<vertical_label>Seconds</vertical_label>\n");
      fprintf(fh,"\t<attribute>\n");
      fprintf(fh, "\t\t<name>ds0</name>\n");
      fprintf(fh, "\t\t<display_as>ResponseTime</display_as>\n");
      fprintf(fh, "\t\t<units>Seconds</units>\n");
      fprintf(fh, "\t\t<color>#00ffff</color>\n");
      fprintf(fh, "\t\t<type>LINE1</type>\n");
      fprintf(fh, "\t\t<legend>AVERAGE:Average response time\\: %%lf %%Ssecs</legend>\n");
      fprintf(fh, "\t</attribute>\n");
    } else if (!strcmp(m->table_name, "snmp_monitors")) {
      fprintf(fh, "\t<title>%s</title>\n", get_attr_val(m, "name"));
      fprintf(fh, "\t<vertical_label>Value</vertical_label>\n");

      /* go through oid list */
      oids = get_attr_val(m, "oid");
      q = oids;
      q = strtok_r(q, ".", &tkn);
      while (q != NULL) {
	fprintf(fh,"\t<attribute>\n");
	fprintf(fh, "\t\t<name>ds%d</name>\n", i);
	fprintf(fh, "\t\t<display_as>%s</display_as>\n", q);
	fprintf(fh, "\t\t<units>v</units>\n");
	fprintf(fh, "\t\t<color>%s</color>\n", colors[i]);
	fprintf(fh, "\t\t<type>LINE1</type>\n");
	fprintf(fh, "\t\t<legend>AVERAGE:Average \\: %%lf %%S</legend>\n");
	fprintf(fh, "\t</attribute>\n");
	q = strtok_r(NULL, ",", &tkn);
	i++;
      }
    }
    fprintf(fh, "</config>\n");
  } else {
    strerror_r(errno, errbuf, 1024);
    syslog(LOG_NOTICE, "fopen: %s", errbuf);
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
    syslog(LOG_ALERT, "rrd_create: %s", rrd_get_error());
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
  char        *rrd_root, *rrd_path, *rrd_xml_path;
  char        errbuf[1024];
  int         len, err = 0;
  struct stat st;

  /* build rrd path */
  rrd_root = get_config_value("rrd.directory");
  
  if (rrd_root == NULL) {
    syslog(LOG_NOTICE, "rrd root not defined");
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
  rrd_xml_path = (char *)malloc(len * sizeof(char));
  snprintf(rrd_path, len, "%s/%s/%s", rrd_root, address, m->table_name);

  /* create path if it doesn't exist */
  if (stat(rrd_path, &st) < 0) {
    switch (errno) {
    case ENOENT:
      /* make directory world readable/executate for displaying rrds */
      mkdir_p(rrd_path, S_IRUSR|S_IWUSR|S_IXUSR|S_IROTH|S_IXOTH);
      break;
    default:
      strerror_r(errno, errbuf, 1024);
      syslog(LOG_NOTICE, "stat: %s", errbuf);
      err = 1;
      break;
    }
  }

  if (!err) {
    snprintf(rrd_path, len, "%s/%s/%s/%s.rrd", rrd_root, address, 
	     m->table_name, rrd_name);
    snprintf(rrd_xml_path, len, "%s/%s/%s/%s.xml", rrd_root, address, 
	     m->table_name, rrd_name);

    /* see if we need to create rrd file */
    if (stat(rrd_path, &st) < 0) {
      switch (errno) {
      case ENOENT:
	/* create rrd */
	panoptes_rrd_create(rrd_path, m->table_name, r);
	panoptes_rrd_xml_create(rrd_xml_path, m, r);
	break;
      default:
	strerror_r(errno, errbuf, 1024);
	syslog(LOG_NOTICE, "stat: %s", errbuf);
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

