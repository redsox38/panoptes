/* tables */

DROP TABLE IF EXISTS discovered;
DROP TABLE IF EXISTS group_membership;
DROP TABLE IF EXISTS port_monitors;
DROP TABLE IF EXISTS device_groups;
DROP TABLE IF EXISTS devices;
DROP VIEW monitor_tasks;

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
-- Table structure for table group_membership
--

CREATE TABLE group_membership (
  group_id bigint(20) NOT NULL,
  device_id bigint(20) NOT NULL,
  KEY group_id (group_id),
  KEY device_id (device_id),
  CONSTRAINT group_membership_ibfk_1 FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT group_membership_ibfk_2 FOREIGN KEY (group_id) REFERENCES device_groups (id) ON DELETE CASCADE ON UPDATE CASCADE
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
  status enum('ok','warn','error') DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY idx (device_id,port,proto),
  KEY device_id (device_id),
  KEY port (port),
  CONSTRAINT port_monitors_ibfk_1 FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/* views */

CREATE ALGORITHM=UNDEFINED SQL  SECURITY INVOKER VIEW monitor_tasks
    AS SELECT 'port_monitors' AS table_name, port_monitors.id AS id,
        port_monitors.last_check AS last_check, 
        port_monitors.next_check AS next_check FROM
        port_monitors ORDER BY port_monitors.next_check;

/* stored procedures */

DELIMITER //
DROP PROCEDURE IF EXISTS get_next_monitor_entry//
CREATE PROCEDURE get_next_monitor_entry()
READS SQL DATA
COMMENT 'Retrieves the next monitor entry'
BEGIN

DECLARE _id BIGINT;
DECLARE _table_name VARCHAR(50);

-- Get next task and type of task
SELECT id, table_name INTO _id, _table_name 
  FROM monitor_tasks 
  LIMIT 1;

IF (_table_name='port_monitors') THEN
  -- if it is a port monitor type, look in port_monitors table
  SET @s = CONCAT('SELECT device_id, port, proto INTO @_dev_id, @_port, @_proto FROM ', _table_name, ' WHERE id=', _id);

  SET autocommit=0;
  START TRANSACTION;

  PREPARE stmt FROM @s;
  EXECUTE stmt;

  -- get check interval
  SELECT check_interval INTO @_interval FROM port_monitors WHERE id=_id;
  
  -- set update last_check and next_check
  SET @s = CONCAT('UPDATE port_monitors SET last_check=NOW(), ',
                  'next_check=DATE_ADD(NOW(), INTERVAL ', @_interval,
                  ' MINUTE) WHERE id=', _id);

  PREPARE stmt FROM @s;
  EXECUTE stmt;

  COMMIT;
  SET autocommit=1;

  SELECT _id AS id, 'port_monitors' AS table_name, @_dev_id AS device_id, 
         @_port AS port, @_proto AS proto;
END IF;

END;
//
DELIMITER ;

