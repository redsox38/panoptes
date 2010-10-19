#                                               -*- Autoconf -*-
# Process this file with autoconf to produce a configure script.

AC_PREREQ([2.65])
AC_INIT([panoptes], [0.1], [redsox38@gmail.com])
AC_CONFIG_SRCDIR([discover_core.c])
AM_INIT_AUTOMAKE([foreign])
AC_CONFIG_MACRO_DIR([m4])

LT_INIT

AC_CONFIG_HEADERS([config.h])

# Checks for programs.
AC_PROG_CC

# Checks for libraries.

# Checks for header files.
AC_CHECK_HEADERS([arpa/inet.h netinet/in.h stdlib.h string.h sys/socket.h pcap.h libxml/parser.h mysql.h])

# Checks for typedefs, structures, and compiler characteristics.

# Checks for library functions.
AC_CHECK_FUNCS([inet_ntoa strcspn strdup])

AC_CHECK_LIB([pcap], [pcap_open_live])
AC_CHECK_LIB([xml2], [xmlReadFile])
AC_CHECK_LIB([mysqlclient], [mysql_init])

AC_OUTPUT(Makefile database/Makefile utils/Makefile)
