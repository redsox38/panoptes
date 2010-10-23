DEFS = @DEFS@

bin_PROGRAMS = panoptes_discover panoptes_monitor
panoptes_discover_SOURCES = discover_core.c  packet.c database.c
panoptes_monitor_SOURCES = monitor_core.c database.c monitor_thread.c shutdown_thread.c monitor_entry.c
#panoptes__LDADD = utils/configuration.o

LDFLAGS = @LDFLAGS@ -Lutils/.libs -lpanoptes_utils
SUBDIRS = database utils
AUTOMAKE_OPTIONS = no-dependencies
panoptes_monitor_LDFLAGS = @LDFLAGS@ 
panoptes_monitor_CPPFLAGS = @CPPFLAGS@ -D_REENTRANT
panoptes_discover_CPPFLAGS = @CPPFLAGS@ -D_REENTRANT
EXTRA_DIST = web
