#                                               -*- Autoconf -*-
# Process this file with autoconf to produce a configure script.

AC_PREREQ([2.63])
AC_INIT([panoptes], [1.6], [redsox38@gmail.com])
AC_CONFIG_SRCDIR([discover_core.c])
AM_INIT_AUTOMAKE([foreign])
AC_CONFIG_MACRO_DIR([m4])

#libtool 
LT_INIT

AC_DEFINE([WITH_P0F], [], [p0f OS fingerprinting])
AC_SUBST(p0fstring)

AC_ARG_WITH([dojo-url], [AS_HELP_STRING([--with-dojo-url],[top level url of dojo install default is to use Google's CDN])], AC_SUBST([dojourl], [${withval}]), AC_MSG_ERROR(Must supply the local dojo url))
AC_ARG_WITH([p0f], [AS_HELP_STRING([--with-p0f],[Include suport for OS fingerprinting via p0f])], AC_DEFINE(WITH_P0F))

AC_CONFIG_HEADERS([config.h])

# Checks for programs.
AC_PROG_CC
AC_PROG_INSTALL
AC_PROG_MKDIR_P
AC_PROG_SED

# Checks for config programs
AC_ARG_WITH(mysql_config,
        AC_HELP_STRING(
                [--with-mysql_config=PROGRAM],
                [location of the mysql_config program]),
        [mysql_config_prog=$withval])
AC_PATH_PROG(MYSQL_CONFIG, mysql_config, $mysql_config_prog)

AC_ARG_WITH(xml2-configconfig,
        AC_HELP_STRING(
                [--with-xml2-config=PROGRAM],
                [location of the xml2-config program]),
        [xml2-config_prog=$withval])
AC_PATH_PROG(XML2_CONFIG, xml2-config, $xml2-config_prog)

## Determine MySQL library path
MYSQL_LIBS=$($MYSQL_CONFIG --libs)
LIBS="$LIBS $MYSQL_LIBS"

## Determine MySQL include path
MYSQL_INCLUDE=$($MYSQL_CONFIG --cflags)
CPPFLAGS="$CPPFLAGS $MYSQL_INCLUDE"

## Determine xml2 library path
XML2_LIBS=$($XML2_CONFIG --libs)
LIBS="$LIBS $XML2_LIBS"

## Determine xml2 include path
XML2_INCLUDE=$($XML2_CONFIG --cflags)
CPPFLAGS="$CPPFLAGS $XML2_INCLUDE"

# Checks for libraries.

# Checks for header files.
AC_CHECK_HEADERS([arpa/inet.h netinet/in.h stdlib.h string.h sys/socket.h pcap.h libxml/parser.h mysql.h syslog.h curl/curl.h net-snmp/net-snmp-config.h sys/types.h sys/wait.h])

# Checks for typedefs, structures, and compiler characteristics.

# Checks for library functions.
AC_CHECK_FUNCS([inet_ntoa strcspn strdup])

AC_CHECK_LIB([pcap], [pcap_open_live], ,AC_MSG_ERROR(Cannot find libpcap))
AC_CHECK_LIB([xml2], [xmlReadFile], , AC_MSG_ERROR(Cannot find libxml2))
AC_CHECK_LIB([pthread], [pthread_create])
AC_CHECK_LIB([dl], [dlopen])
AC_CHECK_LIB([mysqlclient_r], [mysql_init], , AC_MSG_ERROR(Cannot find libmysqlclient))
AC_CHECK_LIB([rrd_th], [rrd_create_r], , AC_MSG_ERROR(Cannot find librrd_th))
AC_CHECK_LIB([curl], [curl_easy_perform], , AC_MSG_ERROR(Cannot find libcurl))
AC_CHECK_LIB([snmp], [init_snmp], , AC_MSG_ERROR(Cannot find libsnmp))

dnl Checks for typedefs, structures, and compiler characteristics.
AC_C_CONST
AC_TYPE_UID_T
AC_TYPE_OFF_T
AC_TYPE_PID_T
AC_TYPE_MODE_T
AC_TYPE_SIZE_T
AC_HEADER_TIME
AC_STRUCT_TM

AC_OUTPUT(Makefile include/Makefile database/Makefile utils/Makefile)
