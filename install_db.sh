#!/bin/sh

echo -n "Enter admin user id: "
read mysql_user
echo -n "Enter admin password: "
stty -echo
read mysql_password
stty echo

echo

echo -n "Enter panoptes db user id: "
read panoptes_user
echo -n "Enter panoptes db password: "
stty -echo
read panoptes_password
stty echo

echo "CREATE DATABASE panoptes" | mysql -u $mysql_user -p$mysql_password
cat dbinit.sql | mysql -u $mysql_user -p$mysql_password panoptes
cat dbinit-3.sql | mysql -u $mysql_user -p$mysql_password panoptes
cat dbinit-4.sql | mysql -u $mysql_user -p$mysql_password panoptes
echo "grant all privileges on panoptes.* to \"${panoptes_user}\"@\"localhost\" identified by \"${panoptes_password}\"" | mysql -u $mysql_user -p$mysql_password panoptes

echo "Completed!"
echo "Update the user name and password in panoptes_config.xml"
