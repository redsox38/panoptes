Summary: Network Monitor tool
Name: panoptes
Version: 1.3
Release: 1
Copyright: GPL
Group: Applications/Network
Source: https://github.com/downloads/redsox38/panoptes/panoptes-1.3.tar.gz
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
cp panoptes_httpd.conf /etc/http/config.d/panoptes_httpd.conf

%files
%defattr(-,root,root)
%config /etc/panoptes_config.xml
%config /etc/httpd/config.d/panoptes_httpd.conf
%attr(0755,root,root)/etc/init.d/panoptes_discover
%attr(0755,root,root)/etc/init.d/panoptes_monitor
/usr/sbin/panoptes_momnitor
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
/usr/share/panoptes/htpasswd
/usr/share/panoptes/web/*

%post
ldconfig
