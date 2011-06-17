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
#include "panoptes/configuration.h"
#include <signal.h>
#include <pthread.h>
#include <errno.h>
#include <sys/time.h>
#include <string.h>
#include <time.h>
#include "panoptes/monitor_core.h"
#include <curl/curl.h>
#include <curl/types.h>
#include <curl/easy.h>

/* function to ignore web page content */
size_t wrfu(void *ptr, size_t size, size_t nmemb, void *stream)
{
  return size * nmemb;
}

/* monitor_certificate
 *
 * parameters: char * url to retrieve certificate for
 *             monitor_result_t information about the most recent monitoring output
 *
 * return: monitor_result_t *
 *
 * Poll url via libcurl and see if the web server certificate expiration date is 
 * within the configured minimum number of days of expiration
 */
monitor_result_t *monitor_certificate(char *url, monitor_result_t *r)
{

  CURL                 *curl_handle;
  CURLcode             res;
  struct curl_certinfo *certs = NULL;
  struct curl_slist    *sl;
  struct tm            t;
  int                  i, yr, mo, day, rem_days, warn_days, crit_days;
  char                 *p, *q, *tkn, *to_str, errbuf[CURL_ERROR_SIZE];
  time_t               now, exp;

  r->status = MONITOR_RESULT_OK;

  to_str = get_config_value("certificate.warndays");

  if (to_str != NULL) {
    sscanf(to_str, "%d", &warn_days); 
    free(to_str);
  } else {
    warn_days = PANOPTES_DEFAULT_CERT_WARN_DAYS;
  }
  
  to_str = get_config_value("certificate.criticaldays");
  
  if (to_str != NULL) {
    sscanf(to_str, "%d", &crit_days); 
    free(to_str);
  } else {
    crit_days = PANOPTES_DEFAULT_CERT_CRITICAL_DAYS;
  }

  curl_global_init(CURL_GLOBAL_ALL);

  curl_handle = curl_easy_init();

  if (curl_handle) {
    curl_easy_setopt(curl_handle, CURLOPT_URL, url);
    curl_easy_setopt(curl_handle, CURLOPT_WRITEFUNCTION, wrfu);
    curl_easy_setopt(curl_handle, CURLOPT_SSL_VERIFYPEER, 0L);
    curl_easy_setopt(curl_handle, CURLOPT_SSL_VERIFYHOST, 0L);
    curl_easy_setopt(curl_handle, CURLOPT_CERTINFO, 1L);
    curl_easy_setopt(curl_handle, CURLOPT_ERRORBUFFER, errbuf);

    res = curl_easy_perform(curl_handle);

    /* get cert info */
    if (!res) {
      res = curl_easy_getinfo(curl_handle, CURLINFO_CERTINFO, &certs);

      now = time(NULL);

      if (!res && certs) {
	r->monitor_msg = (char *)malloc(sizeof(char) * 36 * certs->num_of_certs);
	q = r->monitor_msg;
	for (i = 0; i < certs->num_of_certs; i++) {
	  for (sl = certs->certinfo[i]; sl != NULL; sl = sl->next) {
	    /* Expire date:2028-08-01 23:59:59 GMT */
	    p = strtok_r(sl->data, "\n", &tkn);
	    while(p != NULL) {
	      if (!strncmp(p, "Expire date:", strlen("Expire date:"))) {
		/* append to status string */
		snprintf(q, strlen(p) + 1, "%s", p);
		q += strlen(p);
		if (i < (certs->num_of_certs - 1)) {
		  sprintf(q, ";");
		  q++;
		}

		p += strlen("Expire date:");
		sscanf(p, "%4d-%2d-%2d %*d:%*d:%*d GMT", &yr, &mo, &day);
		t.tm_sec = 0;
		t.tm_min = 0;
		t.tm_hour = 0;
		t.tm_mday = day;
		t.tm_mon = mo;
		t.tm_year = yr - 1900;
		t.tm_isdst = -1;
		exp = mktime(&t);

		/* calculate number of days remaining */
		rem_days = ((exp - now) / 3600) / 24;

		if (rem_days < crit_days) {
		  r->status = MONITOR_RESULT_ERR;
		} else if ((rem_days < warn_days) && 
			   r->status != MONITOR_RESULT_ERR) {
		  r->status = MONITOR_RESULT_WARN;
		}

	      }
	      p = strtok_r(NULL, "\n", &tkn);
	    }
	  }
	}
      } else {
	r->status = MONITOR_RESULT_ERR;
	r->monitor_msg = strdup(errbuf);
      }
    } else {
      r->status = MONITOR_RESULT_ERR;
      r->monitor_msg = strdup(errbuf);
    }

    curl_easy_cleanup(curl_handle);
    curl_global_cleanup();

  } else {
    r->status = MONITOR_RESULT_ERR;
    r->monitor_msg = strdup(errbuf);
  }

  return(r);
}
