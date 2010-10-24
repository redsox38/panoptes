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
#include "monitor_core.h"

monitor_result_t *monitor_port(char *addr, char *proto, int port)
{
  int                sock;
  struct sockaddr_in serv_addr;
  struct hostent     *h_ent;
 
  serv_addr.sin_family = AF_INET;
  bcopy(addr, (char *)&serv_addr.sin_addr.s_addr, strlen(addr));
  serv_addr.sin_port = htons(port);
}
