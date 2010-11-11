#include "panoptes.h"
#include "utils/configuration.h"
#include <signal.h>
#include <pthread.h>
#include <errno.h>
#include <sys/time.h>
#include <string.h>
#include "monitor_core.h"
#include <curl/curl.h>
#include <curl/types.h>
#include <curl/easy.h>

/* function to ignore web page content */
size_t wrfu(void *ptr, size_t size, size_t nmemb, void *stream)
{
  return size * nmemb;
}

monitor_result_t *monitor_certificate(char *url, monitor_result_t *r)
{

  CURL                 *curl_handle;
  CURLcode             res;
  struct curl_certinfo *certs = NULL;
  struct curl_slist    *sl;
  int                  i;
  char                 *p, *tkn;

  curl_global_init(CURL_GLOBAL_ALL);

  curl_handle = curl_easy_init();

  if (curl_handle) {
    curl_easy_setopt(curl_handle, CURLOPT_URL, url);
    curl_easy_setopt(curl_handle, CURLOPT_WRITEFUNCTION, wrfu);
    curl_easy_setopt(curl_handle, CURLOPT_SSL_VERIFYPEER, 0L);
    curl_easy_setopt(curl_handle, CURLOPT_SSL_VERIFYHOST, 0L);
    curl_easy_setopt(curl_handle, CURLOPT_CERTINFO, 1L);

    res = curl_easy_perform(curl_handle);

    /* get cert info */
    if (!res) {
      res = curl_easy_getinfo(curl_handle, CURLINFO_CERTINFO, &certs);

      if (!res && certs) {
	for (sl = certs->certinfo[0]; sl != NULL; sl = sl->next) {
	  /* Expire date:2028-08-01 23:59:59 GMT */
	  p = strtok_r(sl->data, "\n", &tkn);
	  while(p != NULL) {
	    if (!strncmp(p, "Expire date:", strlen("Expire date:"))) {
	      p += strlen("Expire date:");
	      printf("%s\n", p);
	    }
	    p = strtok_r(NULL, "\n", &tkn);
	  }
	}
      }
    }

    curl_easy_cleanup(curl_handle);
    curl_global_cleanup();

  } else {
  }

  return(r);
}
