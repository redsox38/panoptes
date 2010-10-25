#include "config.h"
#include "utils/configuration.h"
#include <signal.h>
#include <stdlib.h>
#include <pthread.h>
#include <stdio.h>
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

monitor_result_t *monitor_port(char *addr, char *proto, 
			       int port, monitor_result_t *r)
{
  int                sock, len, rc;
  int                nfds = 0;
  struct sockaddr_in serv_addr;
  char               *to_str;
  char               errbuf[1024]; /* 1024 is the max errrstr len in glibc */ 
  struct timeval     to, start, stop;
  fd_set             rd_set, wr_set;
  double             elapsed;

  to_str = get_config_value("port_monitor.timeout");

  if (to_str != NULL) {
    sscanf(to_str, "%ld", &to.tv_sec); 
    free(to_str);
 } else {
    /* default to 30 seconds */
    to.tv_sec = 30;
  }
  to.tv_usec = 0;


  serv_addr.sin_family = AF_INET;
  serv_addr.sin_port = htons(port);
  serv_addr.sin_addr.s_addr = inet_addr(addr);
  
  if (!strcmp(proto, "tcp")) {
    if ((sock = socket(AF_INET, SOCK_STREAM, 0)) < 0) {
      /* error */
      r->status = MONITOR_RESULT_ERR;
      strerror_r(errno, &errbuf, 1024);
      len = strlen("create: ") + strlen(errbuf)) + 1;
      r->monitor_msg = (char *)malloc(len * sizeof(char));
      snprintf(r->monitor_msg, len, "create: %s", errbuf);
    } else {
      /* connect socket */

      /* 
	 set socket to non-blocking
	 so we can set a timeout on the connect 
      */
      fcntl(sock, F_SETFL, O_NONBLOCK);
      
      gettimeofday(&start, NULL);

      rc = connect(sock, (struct sockaddr *)&serv_addr, 
		   sizeof(struct sockaddr_in));

      if ((rc < 0) && 
	  (errno != EALREADY) &&
	  (errno != EINPROGRESS)) {

	/* error not related to the fact that the connection is non-blocking */
	r->status = MONITOR_RESULT_ERR;
	strerror_r(errno, &errbuf, 1024);
	len = strlen("connect: ") + strlen(errbuf) + 1;
	r->monitor_msg = (char *)malloc(len * sizeof(char));
	snprintf(r->monitor_msg, len, "connect: %s", errbuf);
      } else {
	/* select on socket to see if it connected up until t/o */
	FD_ZERO(&rd_set);
	FD_ZERO(&wr_set);
	FD_SET(sock, &rd_set);
	FD_SET(sock, &wr_set);

	nfds = max(nfds, sock);
	rc = select(++nfds, &rd_set, &wr_set, NULL, &to);
	close(sock);

	if (rc == 1) {
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
	} else if (rc == 0) {
	  /* timed out */
	  r->status = MONITOR_RESULT_ERR;
	  r->monitor_msg = strdup("timed out");
	} else {
	  /* select err */
	  r->status = MONITOR_RESULT_ERR;
	  strerror_r(errno, &errbuf, 1024);
	  len = strlen("select: ") + strlen(errbuf) + 1;
	  r->monitor_msg = (char *)malloc(len * sizeof(char));
	  snprintf(r->monitor_msg, len, "select: %s", errbuf);
	}
      }
    }
  } else {
    /* error */
    r->status = MONITOR_RESULT_ERR;
    len = strlen("Unknown protocol: ") + strlen(proto) + 1;
    r->monitor_msg = (char *)malloc(len * sizeof(char));
    snprintf(r->monitor_msg, len, "Unknown protocol: %s", proto);
  }

  return(r);
}
