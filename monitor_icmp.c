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

/*
 * Checksum routine for Internet Protocol
 * family headers 
 */
unsigned short cksum(unsigned short *buffer, int size)
{
  unsigned long cksum=0;

  while (size > 1) {
    cksum += *buffer++;
    size  -= sizeof(unsigned short);
  }

  if (size) {
    cksum += *(unsigned char*)buffer;
  }

  cksum = (cksum >> 16) + (cksum & 0xffff);
  cksum += (cksum >>16);

  return (unsigned short)(~cksum);
}

monitor_result_t *monitor_icmp(char *addr, monitor_result_t *r)
{
  struct timeval     to, start, stop;
  fd_set             rd_set, wr_set;
  double             elapsed;
  int                addrlen, len, rc, sock, optval, nfds = 0;
  struct iphdr       ip;
  struct icmphdr     icmp;
  char               *packet, *to_str, errbuf[1024];
  struct sockaddr_in conn;
  
  to_str = get_config_value("ping_monitor.timeout");

  if (to_str != NULL) {
    sscanf(to_str, "%ld", &to.tv_sec); 
    free(to_str);
 } else {
    /* default to 30 seconds */
    to.tv_sec = PANOPTES_DEFAULT_PING_TIMEOUT_SECS;
  }
  to.tv_usec = 0;

  /*
   * allocate memory
   */
  packet = malloc(sizeof(struct iphdr) + sizeof(struct icmphdr));
    
  /*  
   *   Set up IP packet
   */
  ip.ihl = 5;
  ip.version = 4;
  ip.tos = 0;
  ip.tot_len = sizeof(struct iphdr) + sizeof(struct icmphdr);
  ip.id = htons(random());
  ip.ttl = 255;
  ip.protocol = IPPROTO_ICMP;
  ip.saddr = htonl(INADDR_ANY);
  ip.daddr = inet_addr(addr);

  /*
   * Set up ICMP packet
   */
  icmp.type = ICMP_ECHO;
  icmp.code = 0;
  icmp.un.echo.id = 0;
  icmp.un.echo.sequence = 0;
  icmp.checksum = 0;
  icmp.checksum = cksum((unsigned short *)&icmp, sizeof(struct icmphdr));
  ip.check = cksum((unsigned short *)&ip, sizeof(struct iphdr));

  conn.sin_family = AF_INET;
  conn.sin_addr.s_addr = inet_addr(addr);

  memcpy((void *)packet, (void*)&ip, sizeof(struct iphdr));
  memcpy((void *)(packet + sizeof(struct iphdr)), (void*)&icmp, sizeof(struct icmphdr));

  gettimeofday(&start, NULL);

  /* open socket, send packet, wait for response */
  if ((sock = socket(AF_INET, SOCK_RAW, IPPROTO_ICMP)) < 0) {
    /* error */
    r->status = MONITOR_RESULT_ERR;
    strerror_r(errno, errbuf, 1024);
    len = strlen("socket: ") + strlen(errbuf) + 1;
    r->monitor_msg = (char *)malloc(len * sizeof(char));
    snprintf(r->monitor_msg, len, "socket: %s", errbuf);
  } else {
    /* 
       set socket to non-blocking
       so we can set a timeout on the connect 
    */
    fcntl(sock, F_SETFL, O_NONBLOCK);

    /* keep kernel from touching the packet */
    setsockopt(sock, IPPROTO_IP, IP_HDRINCL, &optval, sizeof(int));

    sendto(sock, packet, ip.tot_len, 0, 
	   (struct sockaddr *)&conn, sizeof(struct sockaddr));
    
    /* select on socket to see if it connected up until t/o */
    FD_ZERO(&rd_set);
    FD_ZERO(&wr_set);
    FD_SET(sock, &rd_set);
    FD_SET(sock, &wr_set);
    
    nfds = max(nfds, sock);
    rc = select(++nfds, &rd_set, &wr_set, NULL, &to);

    if (rc > 0) {
      gettimeofday(&stop, NULL);
      r->status = MONITOR_RESULT_OK;

      /* get elapsed time in milliseconds */
      elapsed = (stop.tv_sec - start.tv_sec) * 1000;
      elapsed += (stop.tv_usec - start.tv_usec) / 1000;

      r->monitor_msg = (char *)malloc(sizeof(char) * 11);
      snprintf(r->monitor_msg, 10, "%.4f", elapsed);
  
      /* space for string and a 10 digit number */
      len = strlen("elapsed time|") + 10;
      r->perf_data = (char *)malloc(len * sizeof(char));
      snprintf(r->perf_data, len, "elapsed time|%.4f", 
	       elapsed);
    } else if (rc == 0) {
      /* timed out */
      r->status = MONITOR_RESULT_ERR;
      len = strlen("timed out") + 1;
      r->monitor_msg = (char *)malloc(len * sizeof(char));
      snprintf(r->monitor_msg, len, "timed out");
    } else {
      /* select err */
      r->status = MONITOR_RESULT_ERR;
      strerror_r(errno, errbuf, 1024);
      len = strlen("select: ") + strlen(errbuf) + 1;
      r->monitor_msg = (char *)malloc(len * sizeof(char));
      snprintf(r->monitor_msg, len, "select: %s", errbuf);
    }
  }

  free(packet);

  return(r);
}
