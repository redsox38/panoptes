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

typedef struct mem_chunk {
  char   *mem;
  size_t size;
} mem_chunk_t;

static size_t write_mem_callback(void *ptr, size_t size, size_t nmemb, void *data)
{
  size_t realsize = size * nmemb;
  mem_chunk_t *mem = (mem_chunk_t *)data;
 
  mem->mem = realloc(mem->mem, mem->size + realsize + 1);
  if (mem->mem == NULL) {
    /* out of memory! */ 
    syslog(LOG_ALERT, "realloc failed: Out of memory");
    return(0);
  }
 
  memcpy(&(mem->mem[mem->size]), ptr, realsize);
  mem->size += realsize;
  mem->mem[mem->size] = 0;
 
  return(realsize);
}
 
monitor_result_t *monitor_url(char *url, 
			      char *expect_code, 
			      char *expect_content, 
			      char *request_method,
			      char *http_post_vars,
			      monitor_result_t *r)
{

  CURL                 *curl_handle;
  CURLcode             res;
  char                 errbuf[CURL_ERROR_SIZE], *p, *a, *tkn;
  long                 http_code, expect_http_code;
  double               elapsed;
  struct timeval       start, stop;
  int                  len;
  mem_chunk_t          web_content;
  struct curl_httppost *form_data = NULL;
  struct curl_httppost *last_data = NULL;

  sscanf(expect_code, "%d", &expect_http_code);

  r->status = MONITOR_RESULT_OK;

  syslog(LOG_DEBUG, "init curl handle for %s", url);

  curl_global_init(CURL_GLOBAL_ALL);

  curl_handle = curl_easy_init();

  if (curl_handle) {
    curl_easy_setopt(curl_handle, CURLOPT_URL, url);
    curl_easy_setopt(curl_handle, CURLOPT_SSL_VERIFYPEER, 0L);
    curl_easy_setopt(curl_handle, CURLOPT_SSL_VERIFYHOST, 0L);
    curl_easy_setopt(curl_handle, CURLOPT_CERTINFO, 1L);
    curl_easy_setopt(curl_handle, CURLOPT_ERRORBUFFER, errbuf);

    /* set head only if head request */
    if (!strcmp(request_method, "HEAD")) {
      curl_easy_setopt(curl_handle, CURLOPT_NOBODY, 1L);
    } else if (!strcmp(request_method, "POST")) {
      curl_easy_setopt(curl_handle, CURLOPT_POST, 1L);

      /* add post vars */
      if (http_post_vars != NULL) {
	p = strtok_r(http_post_vars, ",", &tkn);
	
	while(p != NULL) {
	  len = strcspn(p, "=") + 1;
	  a = (char *)malloc((len + 1) * sizeof(char));
	  snprintf(a, len, "%s", p);
	  
	  curl_formadd(&form_data, &last_data, CURLFORM_COPYNAME,
		       a, CURLFORM_COPYCONTENTS, *(p + len),
		       CURLFORM_END);
	  
	  free(a);
	  p = strtok_r(NULL, ",", &tkn);
	}
      }
    }

    if (expect_content != NULL) {
      syslog(LOG_DEBUG, "looking for url content: %s", expect_content);
      web_content.mem = malloc(1);
      web_content.size = 0;
      curl_easy_setopt(curl_handle, CURLOPT_WRITEFUNCTION, write_mem_callback);
      curl_easy_setopt(curl_handle, CURLOPT_WRITEDATA, &web_content);
    }

    syslog(LOG_DEBUG, "starting timer for %s", url);

    gettimeofday(&start, NULL);
    res = curl_easy_perform(curl_handle);
    gettimeofday(&stop, NULL);

    syslog(LOG_DEBUG, "stopping timer for %s", url);

    /* get elapsed time in milliseconds */
    elapsed = (stop.tv_sec - start.tv_sec) * 1000;
    elapsed += ((stop.tv_usec - start.tv_usec) / 1000);

    if (!res) {
      syslog(LOG_DEBUG, "getting response code: %s", url);
      curl_easy_getinfo(curl_handle, CURLINFO_RESPONSE_CODE, &http_code);
      r->monitor_msg = (char *)malloc((strlen("Response code: ") + 4) * sizeof(char));
      sprintf(r->monitor_msg, "Response code: %d", http_code);

      syslog(LOG_DEBUG, "got response code: %s %d", url, http_code);

      if (http_code == expect_http_code) {
	/* space for string and a 10 digit number */
	len = strlen("elapsed time|") + 10;
	r->perf_data = (char *)malloc(len * sizeof(char));
	snprintf(r->perf_data, len, "elapsed time|%.4f", 
		 elapsed);
	r->status = MONITOR_RESULT_OK;

	/* check content if requested */
	if (expect_content != NULL) {
	  if (strstr((char *)web_content.mem, expect_content) != NULL) {
	    r->status = MONITOR_RESULT_OK;
	  } else {
	    r->status = MONITOR_RESULT_ERR;
	  }
	  free(web_content.mem);
	}
      } else {
	r->status = MONITOR_RESULT_ERR;
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
