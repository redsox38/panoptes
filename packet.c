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
#include "discover.h"
#include <getopt.h>
#include <string.h>
#ifdef HAVE_PCAP_H
#include <pcap.h>
#endif
#include <errno.h>
#include <sys/types.h>
#include "packet.h"
#ifdef WITH_P0F
#include "p0f-query.h"
#include <sys/un.h>
#include <sys/socket.h>
#endif
#include <errno.h>

pcap_t *pcap_handle;
char   errbuf[PCAP_ERRBUF_SIZE];

extern disc_port_list_t *auto_port_list;

#ifdef WITH_P0F
extern char *p0f_sock_path;

int run_p0f_query(struct p0f_query *qry, struct p0f_response *resp)
{
  int                p0f_sock, rc = 0;
  struct sockaddr_un x;

  if (p0f_sock_path != NULL) {
    if ((p0f_sock = socket(PF_UNIX, SOCK_STREAM, 0)) < 0) {
      syslog(LOG_NOTICE, "socket: %s", strerror(errno));
      return(rc);
    } else {
      memset(&x, 0, sizeof(x));
      x.sun_family = AF_UNIX;
      strncpy(x.sun_path, p0f_sock_path, strlen(p0f_sock_path));
      syslog(LOG_DEBUG, "Got p0f socket path: %s", x.sun_path);
      if (connect(p0f_sock, (struct sockaddr*)&x, sizeof(x)) < 0) {
	syslog(LOG_NOTICE, "connect: %s", strerror(errno));
	close(p0f_sock);
	return(rc);
      }
    }
  }

  if (write(p0f_sock, qry, sizeof(struct p0f_query)) < 0) {
    syslog(LOG_NOTICE, "p0f write: magic: %d %d bytes %s", qry->magic, sizeof(struct p0f_query), strerror(errno));
  } else {
    if (read(p0f_sock, resp, sizeof(struct p0f_response)) < 0) {
      syslog(LOG_NOTICE, "p0f read: %s", strerror(errno));
    } else {
      if (resp->magic != QUERY_MAGIC) {
	syslog(LOG_DEBUG, "invalid magic %d", resp->magic);
      } else {
	if (resp->type == RESP_BADQUERY) {
	  syslog(LOG_DEBUG, "bad query");
	} else {
	  if (resp->type == RESP_NOMATCH) {
	    syslog(LOG_DEBUG, "no match in cache");
	  } else {	  
	    if (!resp->genre[0]) {
	      syslog(LOG_DEBUG, "genre is null");
	    } else {
	      syslog(LOG_DEBUG, "genre is %s", resp->genre);
	      rc = 1;
	    }
	  }
	}
      }
    }
  }

  shutdown(p0f_sock, 2);
  close(p0f_sock);

  return(rc);
}
#endif

/* 
   function passed to pcap_loop to read processed packets
   that match the filter.
   sends matched packets to database for later interactive
   processing.
 */
void read_packet(u_char *args, const struct pcap_pkthdr *hdr,
		 const u_char *packet)
{
  const struct sniff_ethernet *eth;
  const struct sniff_ip       *ip;
  const struct sniff_tcp      *tcp;
  const struct sniff_udp      *udp;
  const char                  *payload;
  char                        os_genre[20];
  char                        os_detail[40];
  int                         size_ip, size_tcp, size_udp, size_payload;
  char                        *src, *dst;
#ifdef WITH_P0F
  struct p0f_query            p0f_query;
  struct p0f_response         p0f_response;
#endif

  eth      = (struct sniff_ethernet*)(packet);
  ip       = (struct sniff_ip *)(packet + SIZE_ETHER);
  size_ip  = IP_HL(ip)*4;
  
  src = strdup(inet_ntoa(ip->ip_src));
  dst = strdup(inet_ntoa(ip->ip_dst));

  if (ip->ip_p == IPPROTO_TCP) {
    tcp = (struct sniff_tcp*)(packet + SIZE_ETHER + size_ip);
    size_tcp = TH_OFF(tcp)*4;

    /* see if we've already seen this addr/port */
    if (!seen_entry(ip->ip_src, ntohs(tcp->th_sport))) {
      insert_seen_node(ip->ip_src, ntohs(tcp->th_sport));

      snprintf(os_genre, strlen("unknown") + 1, "%s", "unknown");
      snprintf(os_detail, strlen("unknown") + 1, "%s", "unknown");
#ifdef WITH_P0F
      if (p0f_sock_path != NULL) {
	/* get OS from p0f if needed and a socket is defined */
	memset(&p0f_query, 0, sizeof(struct p0f_query));
	memset(&p0f_response, 0, sizeof(struct p0f_response));
	p0f_query.magic    = QUERY_MAGIC;
	p0f_query.id       = 0x12345678;
	p0f_query.type     = QTYPE_FINGERPRINT;
	p0f_query.src_ad   = ip->ip_src.s_addr;
	p0f_query.dst_ad   = ip->ip_dst.s_addr;
	p0f_query.src_port = ntohs(tcp->th_sport);
	p0f_query.dst_port = ntohs(tcp->th_dport);
	
	if (run_p0f_query(&p0f_query, &p0f_response)) {
	  snprintf(os_genre, strlen(p0f_response.genre), "%s", p0f_response.genre);
	  snprintf(os_detail, strlen(p0f_response.detail), "%s", p0f_response.detail);
	}
      } 
#endif      

      syslog(LOG_DEBUG, "TCP From %s:%d To %s:%d\n", src, 
	     ntohs(tcp->th_sport), dst, ntohs(tcp->th_dport));
      /* flip src and dst since our src is the host sending the SYN/ACK */
      /* AKA the host being connected to */
      if (is_auto_port(ntohs(tcp->th_sport))) {
	syslog(LOG_DEBUG, "auto accepting %d", ntohs(tcp->th_sport)); 
	add_monitor_port(src, ntohs(tcp->th_sport), "tcp", os_genre, os_detail);
      } else {
	add_discovered_connection(dst, ntohs(tcp->th_dport), 
				  src, ntohs(tcp->th_sport), 
				  "tcp", os_genre, os_detail);
      }
    }
    /*
  } else if (ip->ip_p == IPPROTO_UDP) {
    udp = (struct sniff_udp*)(packet + SIZE_ETHER + size_ip);
    size_udp = udp->uh_len;

    syslog(LOG_DEBUG, "UDP From %s:%d To %s:%d\n", src, 
	   ntohs(udp->uh_sport), dst, ntohs(udp->uh_dport));
    if (ntohs(udp->uh_sport < IPPORT_RESERVED)) {
      add_discovered_connection(src, ntohs(udp->uh_sport), 
				dst, ntohs(udp->uh_dport), 
				"udp");
    } else {
      add_discovered_connection(dst, ntohs(udp->uh_dport), 
				src, ntohs(udp->uh_sport), 
				"udp");
    }
    */
  }

  free(src);
  free(dst);

  return;
}

/* function called by discover on sig term */
void packet_term_handler()
{
  if (pcap_handle)
    pcap_close;
}

/* 
   function to read packets if we were given a device
   to read from.  Also the default if no pcap file
   was given
*/

int init_packet_capture_live(char *dev) 
{  
  if (dev) {
    pcap_handle = pcap_open_live(dev, 1500, 1, 1000, errbuf);
  }

  if (!pcap_handle) {
    syslog(LOG_ALERT, "Unable to open device %s: %s", dev, errbuf);
    return(-1);
  }

  return(0);
}

/* 
   function called to read packets if we were given a previous pcap file 
   to read from
*/
int init_packet_capture_from_file(char *file)
{
  if (file) {
    pcap_handle = pcap_open_offline(file, errbuf);
  }

  if (!pcap_handle) {
    syslog(LOG_ALERT, "Unable to open device %s: %s", file, errbuf);
    return(-1);
  }

  return(0);
}

/* 
   set up filter and start capture
   if reading from device,
   function will not return
*/
void run_packet_capture() 
{
  struct bpf_program filter;
  char               filter_ex[] = "tcp[13] = 18 or udp";

  if (pcap_handle) {
    /* compile filter */
    if (pcap_compile(pcap_handle, &filter, filter_ex, 0, 0) < 0) {
      syslog(LOG_ALERT, "Couldn't parse filter %s: %s\n", filter_ex,
	     pcap_geterr(pcap_handle));
    } else {
      if (pcap_setfilter(pcap_handle, &filter) < 0) {
	syslog(LOG_ALERT, "Couldn't parse filter %s: %s\n", filter_ex,
	       pcap_geterr(pcap_handle));
      }
    }
  }

  /* device ready, filter compiled.  Here we go... */
  if (pcap_handle) {
    pcap_loop(pcap_handle, -1, read_packet, NULL);
  }
}
