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
#include <getopt.h>
#include <string.h>
#ifdef HAVE_PCAP_H
#include <pcap.h>
#endif
#include <errno.h>
#include <sys/types.h>
#include "packet.h"

pcap_t *pcap_handle;
char   errbuf[PCAP_ERRBUF_SIZE];

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

  int                         size_ip, size_tcp, size_udp, size_payload;
  char                        *src, *dst;

  eth      = (struct sniff_ethernet*)(packet);
  ip       = (struct sniff_ip *)(packet + SIZE_ETHER);
  size_ip  = IP_HL(ip)*4;
  
  src = strdup(inet_ntoa(ip->ip_src));
  dst = strdup(inet_ntoa(ip->ip_dst));

  if (ip->ip_p == IPPROTO_TCP) {
    tcp = (struct sniff_tcp*)(packet + SIZE_ETHER + size_ip);
    size_tcp = TH_OFF(tcp)*4;

    printf("TCP From %s:%d To %s:%d\n", src, 
	   ntohs(tcp->th_sport), dst, ntohs(tcp->th_dport));
    /* flip src and dst since our src is the host sending the SYN/ACK */
    /* AKA the host being connected to */
    add_discovered_connection(dst, ntohs(tcp->th_dport), 
			      src, ntohs(tcp->th_sport), 
			      "tcp");
  } else if (ip->ip_p == IPPROTO_UDP) {
    udp = (struct sniff_udp*)(packet + SIZE_ETHER + size_ip);
    size_udp = udp->uh_len;

    /* guess client/server based on port number */
    printf("UDP From %s:%d To %s:%d\n", src, 
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
