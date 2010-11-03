#include "panoptes.h"
#include "utils/configuration.h"
#include <signal.h>
#include <pthread.h>
#include <sys/socket.h>
#include <netdb.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <errno.h>
#include <sys/select.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/time.h>
#include "monitor_core.h"
#include <linux/ip.h>
#include <linux/icmp.h>

monitor_result_t *monitor_icmp(char *addr, monitor_result_t *r)
{
  struct timeval     to, start, stop;
  fd_set             rd_set, wr_set;
  double             elapsed;
  int                len;

  gettimeofday(&start, NULL);

  gettimeofday(&stop, NULL);
  r->status = MONITOR_RESULT_OK;
  r->monitor_msg = strdup("success");

  /* get elapsed time in milliseconds */
  elapsed = (stop.tv_sec - start.tv_sec) * 1000;
  elapsed += (stop.tv_usec - start.tv_usec) / 1000;
  
  /* space for string and a 10 digit number */
  len = strlen("elapsed time|") + 10;
  r->perf_data = (char *)malloc(len * sizeof(char));
  snprintf(r->perf_data, len, "elapsed time|%.4f", 
	   elapsed);

  return(r);
}
