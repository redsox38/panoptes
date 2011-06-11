Summary: Network Monitor tool
Name: panoptes
Version: 1.6rc1
Release: 1
License: GPL
Group: Applications/Network
Source: https://github.com/downloads/redsox38/panoptes/panoptes-1.6rc1.tar.gz
Packager: Todd Merritt <redsox38@gmail.com>
Requires: mysql-libs >= 5.0, libxml2, net-snmp-libs, libcurl, php >= 5.0, php-pdo, php-gd, php-snmp, php-xml, rrdtool-php, rrdtool
BuildRequires: mysql-devel, libxml2-devel, net-snmp-devel, libcurl-devel, rrdtool-devel

%description
Network monitoring tool

%prep
%setup

%build
CPPFLAGS="-I/usr/include/mysql -I/usr/include/libxml2" LDFLAGS="-L/usr/lib64/mysql" \
./configure --prefix=/usr \
            --sysconfdir=/etc \
            --localstatedir=/var \
            --with-p0f \
            --with-dojo-url=/js
make

%install
make DESTDIR=%buildroot install
mkdir -p %buildroot/etc/httpd/conf.d
mkdir -p %buildroot/etc/init.d
mkdir -p %buildroot/usr/bin
cp panoptes_httpd.conf %buildroot/etc/httpd/conf.d/panoptes_httpd.conf
cp -p panoptes_monitor.init %buildroot/etc/init.d/panoptes_monitor
cp -p panoptes_discover.init %buildroot/etc/init.d/panoptes_discover
cp -p install_db.sh %buildroot/usr/bin/panoptes_install_db.sh
cp -p update_db.sh %buildroot/usr/bin/panoptes_update_db.sh
cp -p xmpp_msg %buildroot/usr/bin/xmpp_msg

%files
%defattr(-,root,root)
%config /etc/panoptes_config.xml
%config /etc/httpd/conf.d/panoptes_httpd.conf
%attr(0755,root,root)/etc/init.d/panoptes_discover
%attr(0755,root,root)/etc/init.d/panoptes_monitor
%attr(0755,root,root)/usr/bin/panoptes_install_db.sh
%attr(0755,root,root)/usr/bin/panoptes_update_db.sh
%attr(0755,root,root)/usr/bin/xmpp_msg
/usr/sbin/panoptes_monitor
/usr/sbin/panoptes_discover
%dir /usr/share/panoptes_rrds
%attr(0755,apache,root) /usr/libexec/panoptes_scripts
/usr/lib/libmysqldisc.a
/usr/lib/libmysqldisc.so
/usr/lib/libmysqldisc.so.2.1.12
/usr/lib/libpanoptes_utils.la
/usr/lib/libpanoptes_utils.so.2
/usr/lib/libmysqldisc.la
/usr/lib/libmysqldisc.so.2
/usr/lib/libpanoptes_utils.a
/usr/lib/libpanoptes_utils.so
/usr/lib/libpanoptes_utils.so.2.1.12
/usr/share/panoptes/dbinit.sql
/usr/share/panoptes/dbinit-3.sql
/usr/share/panoptes/dbinit-4.sql
/usr/share/panoptes/dbinit-5.sql
/usr/share/panoptes/htpasswd
/usr/share/panoptes/web/*
/usr/share/panoptes/web/.htaccess
%dir /usr/include/panoptes
/usr/include/panoptes/*

%post
ldconfig
/sbin/chkconfig panoptes_monitor on
/sbin/chkconfig panoptes_discover on
/sbin/service httpd reload
echo "run /usr/bin/panoptes_install_db.sh or /usr/bin/panoptes_update_db.sh"
