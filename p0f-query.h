/*

   p0f - daemon query interface
   ----------------------------

   This is an interface to be used on the local socket created with
   -Q. 

   Copyright (C) 2003-2006 by Michal Zalewski <lcamtuf@coredump.cx>

*/

#ifndef _HAVE_P0FQUERY_H
#define _HAVE_P0FQUERY_H

#define QUERY_MAGIC		0x0defaced

#define NO_SCORE		-100

/* Masquerade detection flags: */
#define D_GENRE   0x0001
#define D_DETAIL  0x0002
#define D_LINK    0x0004
#define D_DIST    0x0008
#define D_NAT     0x0010
#define D_FW      0x0020
#define D_NAT2_1  0x0040
#define D_FW2_1   0x0080
#define D_NAT2_2  0x0100
#define D_FW2_2   0x0200
#define D_FAST    0x0400
#define D_TNEG    0x0800

#define D_TIME    0x4000
#define D_FAR     0x8000

#define QTYPE_FINGERPRINT	1
#define QTYPE_STATUS		2

struct p0f_query {
  unsigned int   magic;			/* must be set to QUERY_MAGIC */
  unsigned char  type;			/* QTYPE_* */
  unsigned int   id;			/* Unique query ID */
  unsigned int   src_ad,dst_ad;		/* src address, local dst addr */
  unsigned short src_port,dst_port;	/* src and dst ports */
};

#define RESP_OK		0	/* Response OK */
#define RESP_BADQUERY	1	/* Query malformed */
#define RESP_NOMATCH	2	/* No match for src-dst data */
#define RESP_STATUS     255     /* Status information */

struct p0f_response {
  unsigned int   magic;			/* QUERY_MAGIC */
  unsigned int   id;			/* Query ID (copied from p0f_query) */
  unsigned char  type;			/* RESP_* */
  
  unsigned char  genre[20];		/* OS genre (empty if no match) */
  unsigned char  detail[40];		/* OS version (empty if no match) */
  char           dist;			/* Distance (-1 if unknown ) */
  unsigned char  link[30];		/* Link type (empty if unknown) */
  unsigned char  tos[30];			/* Traffic type (empty if unknown) */
  unsigned char  fw,nat;			/* firewall and NAT flags flags */
  unsigned char  real;			/* A real operating system? */
  short          score;			/* Masquerade score (or NO_SCORE) */
  unsigned short mflags;			/* Masquerade flags (D_*) */
  int            uptime;			/* Uptime in hours (-1 = unknown) */
};

#endif /* ! _HAVE_P0FQUERY_H */
