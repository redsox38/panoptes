DEFS = @DEFS@

sbin_PROGRAMS = panoptes_discover panoptes_monitor

panoptes_discover_SOURCES = discover_core.c discover_lists.c packet.c database.c panoptes_utils.c
panoptes_monitor_SOURCES = monitor_core.c database.c monitor_thread.c shutdown_thread.c monitor_entry.c monitor_port.c monitor_icmp.c monitor_certificate.c monitor_snmp.c monitor_shell.c perf_core.c panoptes_utils.c monitor_status.c notification.c monitor_url.c

CPPFLAGS = @CPPFLAGS@ -I./include -DCONFIG_FILE="\"@sysconfdir@/panoptes_config.xml\""
LDFLAGS = @LDFLAGS@ -Lutils/.libs -lpanoptes_utils
SUBDIRS = database utils include
AUTOMAKE_OPTIONS = no-dependencies
panoptes_monitor_LDFLAGS = @LDFLAGS@ 
panoptes_monitor_CPPFLAGS = @CPPFLAGS@ -D_REENTRANT -DPIDFILE="\"@localstatedir@/run/panoptes_monitor.pid\""
panoptes_discover_CPPFLAGS = @CPPFLAGS@ -D_REENTRANT -DPIDFILE="\"@localstatedir@/run/panoptes_discover.pid\""
EXTRA_DIST = install-sh dbinit.sql dbinit-3.sql dbinit-4.sql web panoptes_config.xml.in panoptes_httpd.conf.in p0f-query.h discover.h database.h packet.h panoptes.h README.p0f README.shell_monitors install_db.sh update_db.sh panoptes_discover.init.in panoptes_monitor.init.in

install-data-hook:
	sed -e "s:LIBDIR:$(libdir):" \
	    -e "s:DATAROOTDIR:$(datarootdir):" \
	    -e "s:LIBEXECDIR:$(libexecdir):" \
	    -e "s^DOJOURL^$(dojourl)^" \
	panoptes_config.xml.in > panoptes_config.xml
	sed -e "s:LIBDIR:$(libdir):" \
	    -e "s:DATAROOTDIR:$(datarootdir):" \
	    -e "s:LIBEXECDIR:$(libexecdir):" \
	panoptes_httpd.conf.in > panoptes_httpd.conf

	if test -e $(DESTDIR)$(sysconfdir)/panoptes_config.xml; then \
		$(INSTALL_DATA) $(srcdir)/panoptes_config.xml $(DESTDIR)$(sysconfdir)/panoptes_config.xml.new; \
	else \
		$(INSTALL_DATA) $(srcdir)/panoptes_config.xml $(DESTDIR)$(sysconfdir)/panoptes_config.xml; \
	fi

	$(MKDIR_P) $(DESTDIR)$(libexecdir)/panoptes_scripts
	$(MKDIR_P) $(DESTDIR)$(datarootdir)/panoptes
	$(MKDIR_P) $(DESTDIR)$(datarootdir)/panoptes_rrds

	/bin/cp -r web $(DESTDIR)$(datarootdir)/panoptes
	$(INSTALL) dbinit.sql $(DESTDIR)$(datarootdir)/panoptes
	$(INSTALL) dbinit-3.sql $(DESTDIR)$(datarootdir)/panoptes
	$(INSTALL) dbinit-4.sql $(DESTDIR)$(datarootdir)/panoptes
	/bin/chown apache $(DESTDIR)$(libexecdir)/panoptes_scripts
	htpasswd -b -c $(DESTDIR)$(datarootdir)/panoptes/htpasswd admin admin

	sed -e "s:SBINDIR:$(sbindir):" panoptes_discover.init.in > /etc/init.d/panoptes_discover
	chmod a+rx /etc/init.d/panoptes_discover
	sed -e "s:SBINDIR:$(sbindir):" panoptes_monitor.init.in > /etc/init.d/panoptes_monitor
	chmod a+rx /etc/init.d/panoptes_monitor
