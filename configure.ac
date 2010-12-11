#                                               -*- Autoconf -*-
# Process this file with autoconf to produce a configure script.

AC_PREREQ([2.63])
AC_INIT([panoptes], [1.1], [redsox38@gmail.com])
AC_CONFIG_SRCDIR([discover_core.c])
AM_INIT_AUTOMAKE([foreign])
AC_CONFIG_MACRO_DIR([m4])

#libtool 
LT_INIT

AC_ARG_WITH([dojo-url], [AS_HELP_STRING([-with-dojo-url],[top level url of dojo install default is to use Google's CDN])], AC_SUBST([dojourl], [${withval}]), AC_SUBST([dojourl],[http://ajax.googleapis.com/ajax/libs/dojo/1.5]))

AC_CONFIG_HEADERS([config.h])

# Checks for programs.
AC_PROG_CC

# Checks for libraries.

# Checks for header files.
AC_CHECK_HEADERS([arpa/inet.h netinet/in.h stdlib.h string.h sys/socket.h pcap.h libxml/parser.h mysql.h syslog.h curl/curl.h net-snmp/net-snmp-config.h])

# Checks for typedefs, structures, and compiler characteristics.

# Checks for library functions.
AC_CHECK_FUNCS([inet_ntoa strcspn strdup])

AC_CHECK_LIB([pcap], [pcap_open_live], ,AC_MSG_ERROR(Cannot find libpcap))
AC_CHECK_LIB([xml2], [xmlReadFile], , AC_MSG_ERROR(Cannot find libxml2))
AC_CHECK_LIB([pthread], [pthread_create])
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
