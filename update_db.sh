#!/bin/sh

echo -n "Enter admin user id: "
read mysql_user
echo -n "Enter admin password: "
stty -echo
read mysql_password
stty echo

cat dbinit-3.sql | mysql -u $mysql_user -p $mysql_password panoptes

