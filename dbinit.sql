/* drop everything */

DROP TABLE IF EXISTS discovered;
DROP TABLE IF EXISTS device_outages;
DROP TABLE IF EXISTS device_group_membership;
DROP TABLE IF EXISTS port_acknowledgments;
DROP TABLE IF EXISTS ping_acknowledgments;
DROP TABLE IF EXISTS snmp_acknowledgments;
DROP TABLE IF EXISTS certificate_acknowledgments;
DROP TABLE IF EXISTS port_monitors;
DROP TABLE IF EXISTS ping_monitors;
DROP TABLE IF EXISTS certificate_monitors;
DROP TABLE IF EXISTS snmp_monitors;
DROP TABLE IF EXISTS device_groups;
DROP TABLE IF EXISTS devices;
DROP VIEW monitor_tasks;
DROP PROCEDURE IF EXISTS get_next_monitor_entry;
DROP PROCEDURE IF EXISTS update_monitor_entry;

/* tables */

--
-- Table structure for table device_groups
--

CREATE TABLE device_groups (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  group_name varchar(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY name (group_name)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table devices
--

CREATE TABLE devices (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  address varchar(15) NOT NULL,
  name varchar(255) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY addr (address)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table discovered
--

CREATE TABLE discovered (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  srcaddr varchar(15) NOT NULL,
  srcport smallint(5) unsigned NOT NULL,
  dstaddr varchar(15) NOT NULL,
  dstport smallint(5) unsigned NOT NULL,
  proto varchar(5) NOT NULL,
  modified timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ignored tinyint(4) DEFAULT '0',
  PRIMARY KEY (id),
  UNIQUE KEY idx (srcaddr,srcport,dstaddr,dstport,proto)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table device_group_membership
--

CREATE TABLE device_group_membership (
  group_id bigint(20) NOT NULL,
  device_id bigint(20) NOT NULL,
  KEY group_id (group_id),
  KEY device_id (device_id),
  CONSTRAINT device_group_membership_ibfk_1 FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT device_group_membership_ibfk_2 FOREIGN KEY (group_id) REFERENCES device_groups (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table device_outages
--

CREATE TABLE device_outages (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  device_id bigint(20) NOT NULL,
  start_date DATETIME,
  stop_date DATETIME,
  PRIMARY KEY(id),
  KEY device_id (device_id),
  CONSTRAINT device_outages_ibfk_1 FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table port_monitors
--

CREATE TABLE port_monitors (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  device_id bigint(20) NOT NULL,
  port smallint(5) unsigned NOT NULL,
  proto varchar(5) NOT NULL,
  check_interval smallint(6) NOT NULL DEFAULT '15',
  last_check datetime DEFAULT NULL,
  next_check datetime DEFAULT NULL,
  status enum('new','ok','pending','warn','critical') DEFAULT NULL,
  status_string VARCHAR(255) DEFAULT NULL,
  disabled smallint(5) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY idx (device_id,port,proto),
  KEY device_id (device_id),
  KEY port (port),
  KEY disabled (disabled),
  CONSTRAINT port_monitors_ibfk_1 FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table ping_monitors
--

CREATE TABLE ping_monitors (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  device_id bigint(20) NOT NULL,
  check_interval smallint(6) NOT NULL DEFAULT '15',
  last_check datetime DEFAULT NULL,
  next_check datetime DEFAULT NULL,
  status enum('new','ok','pending','warn','critical') DEFAULT NULL,
  status_string VARCHAR(255) DEFAULT NULL,
  disabled smallint(5) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY device_id (device_id),
  KEY disabled (disabled),
  CONSTRAINT ping_monitors_ibfk_1 FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table certificate_monitors
--

CREATE TABLE certificate_monitors (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  device_id bigint(20) NOT NULL,
  url varchar(255) NOT NULL,
  check_interval smallint(6) NOT NULL DEFAULT '1440',
  last_check datetime DEFAULT NULL,
  next_check datetime DEFAULT NULL,
  status enum('new', 'ok','pending','warn','critical') DEFAULT NULL,
  status_string varchar(255) DEFAULT NULL,
  disabled smallint(5) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY device_id (device_id),
  UNIQUE KEY url (url),
  KEY disabled (disabled),
  CONSTRAINT certificate_monitors_ibfk_1 FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table snmp_monitors
--

CREATE TABLE snmp_monitors (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  device_id bigint(20) NOT NULL,
  name varchar(255) NOT NULL,
  community varchar(255) NOT NULL,
  oid BLOB NOT NULL,
  check_interval smallint(6) NOT NULL DEFAULT '15',
  last_check datetime DEFAULT NULL,
  next_check datetime DEFAULT NULL,
  status enum('new', 'ok','pending','warn','critical') DEFAULT NULL,
  status_string varchar(255) DEFAULT NULL,
  disabled smallint(5) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY device_id (device_id),
  KEY oid (oid(256)),
  UNIQUE KEY oid_pr (device_id, oid(256)),
  UNIQUE KEY nm_pr (device_id, name),
  KEY disabled (disabled),
  CONSTRAINT snmp_monitors_ibfk_1 FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table port_acknowlegments
--

CREATE TABLE port_acknowledgments (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  monitor_id bigint(20) NOT NULL,
  ack_user varchar(64) DEFAULT NULL,
  ack_time datetime DEFAULT NULL,
  ack_msg varchar(255) DEFAULT NULL,
  PRIMARY KEY (id),
  CONSTRAINT port_acknowledgments_ibfk_1 FOREIGN KEY (monitor_id) REFERENCES port_monitors (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table ping_acknowlegments
--

CREATE TABLE ping_acknowledgments (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  monitor_id bigint(20) NOT NULL,
  ack_user varchar(64) DEFAULT NULL,
  ack_time datetime DEFAULT NULL,
  ack_msg varchar(255) DEFAULT NULL,
  PRIMARY KEY (id),
  CONSTRAINT ping_acknowledgments_ibfk_1 FOREIGN KEY (monitor_id) REFERENCES ping_monitors (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table certificate_acknowlegments
--

CREATE TABLE certificate_acknowledgments (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  monitor_id bigint(20) NOT NULL,
  ack_user varchar(64) DEFAULT NULL,
  ack_time datetime DEFAULT NULL,
  ack_msg varchar(255) DEFAULT NULL,
  PRIMARY KEY (id),
  CONSTRAINT certificate_acknowledgments_ibfk_1 FOREIGN KEY (monitor_id) REFERENCES certificate_monitors (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table snmp_acknowlegments
--

CREATE TABLE snmp_acknowledgments (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  monitor_id bigint(20) NOT NULL,
  ack_user varchar(64) DEFAULT NULL,
  ack_time datetime DEFAULT NULL,
  ack_msg varchar(255) DEFAULT NULL,
  PRIMARY KEY (id),
  CONSTRAINT snmp_acknowledgments_ibfk_1 FOREIGN KEY (monitor_id) REFERENCES snmp_monitors (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/* views */

CREATE ALGORITHM=UNDEFINED SQL SECURITY INVOKER VIEW monitor_tasks
    AS (SELECT 'port_monitors' AS table_name, po.id AS id,
        po.device_id AS device_id,
        po.last_check AS last_check, 
        po.next_check AS next_check FROM
        port_monitors po WHERE po.disabled=0) 
        UNION (SELECT 'ping_monitors' AS table_name, pi.id AS id, 
        pi.device_id AS device_id,
        pi.last_check AS last_check, 
        pi.next_check AS next_check FROM ping_monitors pi
        WHERE pi.disabled=0) 
	UNION(SELECT 'certificate_monitors' AS table_name, ce.id AS id,
        ce.device_id AS device_id,
        ce.last_check AS last_check, 
        ce.next_check AS next_check FROM certificate_monitors ce
        WHERE ce.disabled=0)          	
	UNION(SELECT 'snmp_monitors' AS table_name, sn.id AS id,
        sn.device_id AS device_id,
        sn.last_check AS last_check, 
        sn.next_check AS next_check FROM snmp_monitors sn
        WHERE sn.disabled=0)          	
        ORDER BY next_check;

/* stored procedures */

DELIMITER //
CREATE PROCEDURE get_next_monitor_entry()
MODIFIES SQL DATA
COMMENT 'Retrieves the next monitor entry'
BEGIN

DECLARE V_id BIGINT;
DECLARE V_device_id BIGINT;
DECLARE V_table_name VARCHAR(50);
DECLARE V_dev_ip VARCHAR(15);

SET V_device_id=0;
SET @_ignore_ids = '';
SET @_outage_id = 0;

WHILE V_device_id = 0 DO
    -- Get next task and type of task
    SELECT id, device_id, table_name INTO V_id, V_device_id, V_table_name 
      FROM monitor_tasks 
      WHERE next_check < DATE_ADD(NOW(), INTERVAL 1 MINUTE) AND 
            device_id NOT IN (@_ignore_ids)
      LIMIT 1;

    IF V_device_id > 0 THEN
        -- see if this device is in maintenance mode
        SELECT id INTO @_outage_id FROM device_outages WHERE device_id=V_device_id AND start_date < NOW() AND stop_date > NOW();
        IF @_outage_id > 0 THEN
            -- in maint mode, ignore this entry
            if @_ignore_ids = '' THEN
                SET @_ignore_ids = V_device_id;
            ELSE 
                SET @_ignore_ids = CONCAT(@_ignore_ids, ',', V_device_id);
            END IF;
            SET V_device_id = 0;
            SET @_outage_id = 0;
        END IF;
    ELSE
        -- nothing to check...
        SET V_device_id = -1;
        SET V_table_name = '';
    END IF;
END WHILE;

IF (V_table_name='port_monitors') THEN
  -- if it is a port monitor type, look in port_monitors table

  -- get row with lock to prevent another monitor
  -- thread from picking up the same row
  SET @s = CONCAT('SELECT device_id, check_interval, port, proto, status INTO @_dev_id, @_interval, @_port, @_proto, @_status FROM ', V_table_name, ' WHERE id=', V_id, ' FOR UPDATE');

  SET autocommit=0;
  START TRANSACTION;

  PREPARE stmt FROM @s;
  EXECUTE stmt;

  -- set update last_check and next_check
  SET @s = CONCAT('UPDATE port_monitors SET last_check=NOW(), ',
                  'next_check=DATE_ADD(NOW(), INTERVAL ', @_interval,
                  ' MINUTE), status="pending" WHERE id=', V_id);

  PREPARE stmt FROM @s;
  EXECUTE stmt;

  COMMIT;
  SET autocommit=1;

  -- get ip address of device id
  SELECT address INTO V_dev_ip FROM devices WHERE id=@_dev_id;

  SELECT V_id AS id, @_dev_id AS device_id, 'port_monitors' AS table_name, 
  	 V_dev_ip AS address, @_port AS port, @_proto AS proto, 
	 @_status AS status;

ELSEIF (V_table_name='ping_monitors') THEN
  -- get row with lock to prevent another monitor
  -- thread from picking up the same row
  SET @s = CONCAT('SELECT device_id, check_interval, status INTO @_dev_id, @_interval, @_status FROM ', V_table_name, ' WHERE id=', V_id, ' FOR UPDATE');

  SET autocommit=0;
  START TRANSACTION;

  PREPARE stmt FROM @s;
  EXECUTE stmt;

  -- set update last_check and next_check
  SET @s = CONCAT('UPDATE ping_monitors SET last_check=NOW(), ',
                  'next_check=DATE_ADD(NOW(), INTERVAL ', @_interval,
                  ' MINUTE), status="pending" WHERE id=', V_id);

  PREPARE stmt FROM @s;
  EXECUTE stmt;

  COMMIT;
  SET autocommit=1;

  -- get ip address of device id
  SELECT address INTO V_dev_ip FROM devices WHERE id=@_dev_id;

  SELECT V_id AS id, @_dev_id AS device_id, 'ping_monitors' AS table_name, 
  	 V_dev_ip AS address, @_status AS status;

ELSEIF (V_table_name='certificate_monitors') THEN
  -- get row with lock to prevent another monitor
  -- thread from picking up the same row
  SET @s = CONCAT('SELECT device_id, check_interval, url, status INTO @_dev_id, @_interval, @_url, @_status FROM ', V_table_name, ' WHERE id=', V_id, ' FOR UPDATE');

  SET autocommit=0;
  START TRANSACTION;

  PREPARE stmt FROM @s;
  EXECUTE stmt;

  -- set update last_check and next_check
  SET @s = CONCAT('UPDATE certificate_monitors SET last_check=NOW(), ',
                  'next_check=DATE_ADD(NOW(), INTERVAL ', @_interval,
                  ' MINUTE), status="pending" WHERE id=', V_id);

  PREPARE stmt FROM @s;
  EXECUTE stmt;

  COMMIT;
  SET autocommit=1;

  SELECT V_id AS id, @_dev_id AS device_id, 
  	 'certificate_monitors' AS table_name,  
	 @_url AS url, @_status AS status;
ELSEIF (V_table_name='snmp_monitors') THEN
  -- get row with lock to prevent another monitor
  -- thread from picking up the same row
  SET @s = CONCAT('SELECT device_id, check_interval, name, community, oid, status INTO @_dev_id, @_interval, @_name, @_comm, @_oid, @_status FROM ', V_table_name, ' WHERE id=', V_id, ' FOR UPDATE');

  SET autocommit=0;
  START TRANSACTION;

  PREPARE stmt FROM @s;
  EXECUTE stmt;

  -- set update last_check and next_check
  SET @s = CONCAT('UPDATE snmp_monitors SET last_check=NOW(), ',
                  'next_check=DATE_ADD(NOW(), INTERVAL ', @_interval,
                  ' MINUTE), status="pending" WHERE id=', V_id);

  PREPARE stmt FROM @s;
  EXECUTE stmt;

  COMMIT;
  SET autocommit=1;

  -- get ip address of device id
  SELECT address INTO V_dev_ip FROM devices WHERE id=@_dev_id;

  SELECT V_id AS id, @_dev_id AS device_id, 
  	 'snmp_monitors' AS table_name,  
         V_dev_ip AS address,
	 @_name AS name, @_comm AS community, 
         @_oid AS oid, @_status AS status;
END IF;

END;
//
DELIMITER ;

DELIMITER //
CREATE PROCEDURE update_monitor_entry(IN in_id BIGINT,
                                      IN in_status VARCHAR(10),
                                      IN in_status_string VARCHAR(255),
                                      IN in_table VARCHAR(50))
MODIFIES SQL DATA
SQL SECURITY INVOKER
COMMENT 'Updates monitor entry with monitoring results'
BEGIN

-- update approprate table
IF (in_table='port_monitors') THEN
  UPDATE port_monitors SET status=in_status, status_string=in_status_string
      WHERE id=in_id;
ELSEIF (in_table='ping_monitors') THEN
  UPDATE ping_monitors SET status=in_status, status_string=in_status_string
      WHERE id=in_id;
ELSEIF (in_table='certificate_monitors') THEN
  UPDATE certificate_monitors SET status=in_status, 
  	 status_string=in_status_string
      WHERE id=in_id;
ELSEIF (in_table='snmp_monitors') THEN
  UPDATE snmp_monitors SET status=in_status, 
  	 status_string=in_status_string
      WHERE id=in_id;
END IF;

END;
//
DELIMITER ;

