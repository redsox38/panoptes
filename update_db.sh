#!/bin/sh

echo -n "Enter current pannoptes version: "
read vers
echo -n "Enter admin user id: "
read mysql_user
echo -n "Enter admin password: "
stty -echo
read mysql_password
stty echo
echo

case $vers in
    1.6 )
        cat dbinit-7.sql | mysql -u $mysql_user -p$mysql_password panoptes
        echo "Database updated."
        ;;
    1.5 )
        cat dbinit-6.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-7.sql | mysql -u $mysql_user -p$mysql_password panoptes
        echo "Database updated."
        ;;
    1.4 )
        cat dbinit-5.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-6.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-7.sql | mysql -u $mysql_user -p$mysql_password panoptes
        echo "Database updated."
        ;;
    1.3 )
        cat dbinit-4.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-5.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-6.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-7.sql | mysql -u $mysql_user -p$mysql_password panoptes
        echo "Database updated."
        ;;
    1.2 )
        cat dbinit-3.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-4.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-5.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-6.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-7.sql | mysql -u $mysql_user -p$mysql_password panoptes
        echo "Database updated."
        ;;
    1.1 )
        cat dbinit-3.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-4.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-5.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-6.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-7.sql | mysql -u $mysql_user -p$mysql_password panoptes
        echo "Database updated."
        ;;
    1.0 )
        cat dbinit-3.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-4.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-5.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-6.sql | mysql -u $mysql_user -p$mysql_password panoptes
        cat dbinit-7.sql | mysql -u $mysql_user -p$mysql_password panoptes
        echo "Database updated."
        ;;
    * )
        echo "Unknown version: $vers"
        ;;
esac

