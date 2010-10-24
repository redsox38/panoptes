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
#include "monitor_core.h"

monitor_result_t *monitor_port(char *addr, char *proto, int port)
{
  int                sock, len, rc;
  struct sockaddr_in serv_addr;
  monitor_result_t   *r;
  char               *to_str;
  struct timeval     to;
  fd_set             rd_set;

  r = allocate_monitor_result(NULL);

  if (r == NULL)
    return(r);


  to_str = get_config_value("port_monitor.timeout");

  if (to_str != NULL) {
    sscanf(to_str, "%ld", &to.tv_sec);
  } else {
    /* default to 30 seconds */
    to.tv_sec = 30;
  }
  to.tv_usec = 0;

  free(to_str);

  serv_addr.sin_family = AF_INET;
  serv_addr.sin_port = htons(port);
  serv_addr.sin_addr.s_addr = inet_addr(addr);
  
  if (!strcmp(proto, "tcp")) {
    if ((sock = socket(AF_INET, SOCK_STREAM, 0)) < 0) {
      /* error */
      r->status = MONITOR_RESULT_ERR;
      len = strlen("create: ") + strlen(strerror(errno)) + 1;
      r->monitor_msg = (char *)malloc(len * sizeof(char));
      snprintf(r->monitor_msg, len, "create: %s", strerror(errno));
    } else {
      /* connect socket */

      /* 
	 set socket to non-blocking
	 so we can set a timeout on the connect 
      */
      fcntl(sock, F_SETFL, O_NONBLOCK);

      rc = connect(sock, (struct sockaddr *)&serv_addr, 
		   sizeof(struct sockaddr_in));

      if ((rc < 0) && 
	  (errno != EALREADY) &&
	  (errno != EINPROGRESS)) {
	/* error not related to the fact that the connection is non-blocking */
	r->status = MONITOR_RESULT_ERR;
	len = strlen("connect: ") + strlen(strerror(errno)) + 1;
	r->monitor_msg = (char *)malloc(len * sizeof(char));
	snprintf(r->monitor_msg, len, "connect: %s", strerror(errno));
	printf("err %s\n", r->monitor_msg);
      } else {
	/* select on socket to see if it connected up until t/o */
	FD_ZERO(&rd_set);
	FD_SET(sock, &rd_set);

	rc = select(1, &rd_set, NULL, NULL, &to);
	close(sock);

	if (rc == 1) {
	  r->status = MONITOR_RESULT_OK;
	  r->monitor_msg = strdup("success");
	} else if (rc == 0) {
	  /* timed out */
	  r->status = MONITOR_RESULT_ERR;
	  r->monitor_msg = strdup("timed out");
	} else {
	  /* select err */
	  r->status = MONITOR_RESULT_ERR;
	  len = strlen("select: ") + strlen(strerror(errno)) + 1;
	  r->monitor_msg = (char *)malloc(len * sizeof(char));
	  snprintf(r->monitor_msg, len, "select: %s", strerror(errno));
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
