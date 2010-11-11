#include "panoptes.h"
#include "utils/configuration.h"
#include <signal.h>
#include <pthread.h>
#include <errno.h>
#include <sys/time.h>
#include "monitor_core.h"
#include <curl/curl.h>
#include <curl/types.h>
#include <curl/easy.h>

monitor_result_t *monitor_certificate(char *addr, int port, monitor_result_t *r)
{

  CURL                 *curl_handle;
  CURLcode             res;
  struct curl_certinfo *certs = NULL;
  struct curl_slist    *sl;
  char                 *url;
  int                  i;
  
  curl_global_init(CURL_GLOBAL_ALL);

  curl_handle = curl_easy_init();

  if (curl_handle) {
    url = (char *)malloc(strlen(addr) + 15);
    snprintf(url, (strlen(addr) + 15), "https://%s:%d", addr, port);
    curl_easy_setopt(curl_handle, CURL_OPT_URL, url);
    curl_easy_setopt(curl_handle, CURL_OPT_SSL_VERIFYPEER, 0L);
    curl_easy_setopt(curl_handle, CURL_OPT_SSL_VERIFYHOST, 0L);
    curl_easy_setopt(curl_handle, CURL_CERTINFO, 1L);

    res = curl_easy_perform(curl_handle);

    /* get cert info */
    if (!res) {
      res = curl_easy_getingo(curl_handle, CURL_CERTINFO, &certs);

      if (!res && certs) {
	for (i = 0; i < certs->num_of_certs; i++) {
	  for (sl = certs->certinfo[i]; sl != NULL; sl = sl->next) {
	    printf("%s\n", sl->data);
	  }
	}
      }

    }

    curl_easy_cleanup(curl_handle);
    curl_global_cleanup();

    free(url);
  } else {
  }

  return(r);
}
