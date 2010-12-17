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

monitor_result_t *monitor_url(char *url, char *expect_code, monitor_result_t *r)
{

  CURL                 *curl_handle;
  CURLcode             res;
  char                 errbuf[CURL_ERROR_SIZE];
  long                 http_code, expect_http_code;


  sscanf(expect_code, "%d", &expect_http_code);

  r->status = MONITOR_RESULT_OK;

  curl_global_init(CURL_GLOBAL_ALL);

  curl_handle = curl_easy_init();

  if (curl_handle) {
    curl_easy_setopt(curl_handle, CURLOPT_URL, url);
    curl_easy_setopt(curl_handle, CURLOPT_SSL_VERIFYPEER, 0L);
    curl_easy_setopt(curl_handle, CURLOPT_SSL_VERIFYHOST, 0L);
    curl_easy_setopt(curl_handle, CURLOPT_CERTINFO, 1L);
    curl_easy_setopt(curl_handle, CURLOPT_ERRORBUFFER, errbuf);

    res = curl_easy_perform(curl_handle);

    if (!res) {
      curl_easy_getinfo(curl_handle, CURLINFO_RESPONSE_CODE, &http_code);
      if (http_code == expect_http_code) {
	r->monitor_msg = strdup("Response code: 200");
      } else {
	r->status = MONITOR_RESULT_ERR;
	r->monitor_msg = (char *)malloc((strlen("Response code: ") + 3) * sizeof(char));
	sprintf(r->monitor_msg, "Response code: %d", http_code);
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
