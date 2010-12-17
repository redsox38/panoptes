#!/bin/sh

echo -n "Enter current pannoptes version: "
read vers
echo -n "Enter admin user id: "
read mysql_user
echo -n "Enter admin password: "
stty -echo
read mysql_password
stty echo

case $vers in
    1.2)
    1.1)
    1.0)
        cat dbinit-3.sql | mysql -u $mysql_user -p $mysql_password panoptes
        ;;
    *)
        echo "Unknown version: $vers"
        ;;
esac

