
LIBS =
lib_LTLIBRARIES = libmysqldisc.la
libmysqldisc_la_SOURCES = mysql_database.c
libmysqldisc_la_LDFLAGS = -version-info 3:12:1 -module @LDFLAGS@
libmysqldisc_la_LIBS = -lmysqlclient_r

CPPFLAGS = @CPPFLAGS@ -I../include 
AUTOMAKE_OPTIONS = no-dependencies
EXTRA_DIST = mysql_database.h
