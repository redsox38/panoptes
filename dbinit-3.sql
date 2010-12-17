/* drop everything */
DROP PROCEDURE IF EXISTS add_port_monitor;
DROP TABLE IF EXISTS url_notifications;
DROP TABLE IF EXISTS url_acknowledgments;
DROP TABLE IF EXISTS url_monitors;
DROP VIEW monitor_tasks;
DROP PROCEDURE IF EXISTS get_next_monitor_entry;
DROP PROCEDURE IF EXISTS get_monitor_notification;

/* tables */

--
-- Table structure for table url_monitors
--

CREATE TABLE url_monitors (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  device_id bigint(20) NOT NULL,
  url VARCHAR(255) NOT NULL,
  expect_http_status smallint(6) NOT NULL DEFAULT '200',
  check_interval smallint(6) NOT NULL DEFAULT '15',
  last_check datetime DEFAULT NULL,
  next_check datetime DEFAULT NULL,
  status ENUM('new','ok','pending','warn','critical') DEFAULT NULL,
  status_string VARCHAR(255) DEFAULT NULL,
  disabled smallint(5) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY idx (url),
  KEY device_id (device_id),
  KEY disabled (disabled),
  CONSTRAINT url_monitors_ibfk_1 FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table url_acknowlegments
--

CREATE TABLE url_acknowledgments (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  monitor_id bigint(20) NOT NULL,
  ack_user varchar(64) DEFAULT NULL,
  ack_time datetime DEFAULT NULL,  ack_msg varchar(255) DEFAULT NULL,
  PRIMARY KEY (id),
  CONSTRAINT url_acknowledgments_ibfk_1 FOREIGN KEY (monitor_id) REFERENCES url_monitors (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table url_notifications
--

CREATE TABLE url_notifications (
  monitor_id bigint(20) NOT NULL,
  user_id bigint(20) NOT NULL,
  KEY monitor_id (monitor_id),  KEY user_id (monitor_id),
  UNIQUE KEY idx (monitor_id, user_id),
  CONSTRAINT url_notifications_ibfk_1 FOREIGN KEY (monitor_id) REFERENCES url_monitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT url_notifications_ibfk_2 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/* views */

CREATE ALGORITHM=UNDEFINED SQL SECURITY INVOKER VIEW monitor_tasks
    AS (SELECT 'port_monitors' AS table_name, po.id AS id,
        po.device_id AS device_id,
        po.last_check AS last_check, 
        po.next_check AS next_check FROM
        port_monitors po WHERE po.disabled=0 AND po.status <> 'pending') 
        UNION (SELECT 'ping_monitors' AS table_name, pi.id AS id, 
        pi.device_id AS device_id,
        pi.last_check AS last_check, 
        pi.next_check AS next_check FROM ping_monitors pi
        WHERE pi.disabled=0 AND pi.status <> 'pending') 
        UNION(SELECT 'certificate_monitors' AS table_name, ce.id AS id,
        ce.device_id AS device_id,
        ce.last_check AS last_check, 
        ce.next_check AS next_check FROM certificate_monitors ce
        WHERE ce.disabled=0 AND ce.status <> 'pending')                 
        UNION(SELECT 'snmp_monitors' AS table_name, sn.id AS id,
        sn.device_id AS device_id,
        sn.last_check AS last_check, 
        sn.next_check AS next_check FROM snmp_monitors sn
        WHERE sn.disabled=0 AND sn.status <> 'pending')                 
        UNION(SELECT 'shell_monitors' AS table_name, sh.id AS id,
        sh.device_id AS device_id,
        sh.last_check AS last_check, 
        sh.next_check AS next_check FROM shell_monitors sh
        WHERE sh.disabled=0 AND sh.status <> 'pending')                 
        UNION(SELECT 'url_monitors' AS table_name, url.id AS id,
        url.device_id AS device_id,
        url.last_check AS last_check, 
        url.next_check AS next_check FROM url_monitors url
        WHERE url.disabled=0 AND url.status <> 'pending')                 
        ORDER BY next_check;

/* stored procedures */

DELIMITER //
CREATE PROCEDURE add_port_monitor(IN in_port BIGINT,
       		 		  IN in_addr VARCHAR(16),
				  IN in_proto VARCHAR(4))
MODIFIES SQL DATA
COMMENT 'Add new port monitor'
BEGIN

DECLARE V_id BIGINT;
DECLARE V_device_id BIGINT;

SELECT id INTO V_device_id FROM devices WHERE address=in_addr;

IF V_device_id IS NULL THEN
    INSERT INTO devices VALUES(0, in_addr, in_addr);
    SELECT LAST_INSERT_ID() INTO V_device_id;
END IF;

INSERT INTO port_monitors VALUES(0, V_device_id, in_port, in_proto, 15, NOW(), NOW(), 'new', '', 0);
SELECT LAST_INSERT_ID() INTO V_id;

SELECT V_id AS monitor_id, V_device_id AS device_id;

END;
//
DELIMITER ;

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
ELSEIF (V_table_name='shell_monitors') THEN
  -- get row with lock to prevent another monitor
  -- thread from picking up the same row
  SET @s = CONCAT('SELECT device_id, check_interval, script, params, status INTO @_dev_id, @_interval, @_script, @_params, @_status FROM ', V_table_name, ' WHERE id=', V_id, ' FOR UPDATE');

  SET autocommit=0;
  START TRANSACTION;

  PREPARE stmt FROM @s;
  EXECUTE stmt;

  -- set update last_check and next_check
  SET @s = CONCAT('UPDATE shell_monitors SET last_check=NOW(), ',
                  'next_check=DATE_ADD(NOW(), INTERVAL ', @_interval,
                  ' MINUTE), status="pending" WHERE id=', V_id);

  PREPARE stmt FROM @s;
  EXECUTE stmt;

  COMMIT;
  SET autocommit=1;

  -- get ip address of device id
  SELECT address INTO V_dev_ip FROM devices WHERE id=@_dev_id;

  SELECT V_id AS id, @_dev_id AS device_id, 
  	 'shell_monitors' AS table_name,  
         V_dev_ip AS address,
	 @_script AS script, 
	 @_params AS params, 
         @_status AS status;
ELSEIF (V_table_name='url_monitors') THEN
  -- get row with lock to prevent another monitor
  -- thread from picking up the same row
  SET @s = CONCAT('SELECT device_id, check_interval, url, expect_http_status, status INTO @_dev_id, @_interval, @_url, @_expect_htp_status, @_status FROM ', V_table_name, ' WHERE id=', V_id, ' FOR UPDATE');

  SET autocommit=0;
  START TRANSACTION;

  PREPARE stmt FROM @s;
  EXECUTE stmt;

  -- set update last_check and next_check
  SET @s = CONCAT('UPDATE url_monitors SET last_check=NOW(), ',
                  'next_check=DATE_ADD(NOW(), INTERVAL ', @_interval,
                  ' MINUTE), status="pending" WHERE id=', V_id);

  PREPARE stmt FROM @s;
  EXECUTE stmt;

  COMMIT;
  SET autocommit=1;

  -- get ip address of device id
  SELECT address INTO V_dev_ip FROM devices WHERE id=@_dev_id;

  SELECT V_id AS id, @_dev_id AS device_id, 
  	 'url_monitors' AS table_name,  
         V_dev_ip AS address,
	 @_url AS url, 
	 @_expect_http_status AS expect_http_status, 
         @_status AS status;
END IF;

END;
//
DELIMITER ;

DELIMITER //
CREATE PROCEDURE get_monitor_notification(IN in_id BIGINT,
                                          IN in_table VARCHAR(50))
READS SQL DATA
SQL SECURITY INVOKER
COMMENT 'Retrieve list of addresses to notify for this monitor'
BEGIN

DECLARE V_notification_table VARCHAR(50);

IF (in_table='port_monitors') THEN
   SET V_notification_table = 'port_notifications';
ELSEIF (in_table='certificate_monitors') THEN
   SET V_notification_table = 'certificate_notifications';
ELSEIF (in_table='snmp_monitors') THEN
   SET V_notification_table = 'snmp_notifications';
ELSEIF (in_table='shell_monitors') THEN
   SET V_notification_table = 'shell_notifications';
ELSEIF (in_table='url_monitors') THEN
   SET V_notification_table = 'url_notifications';
END IF;

-- read from approprate table
SET @s = CONCAT('SELECT p.pref_value AS address FROM ', V_notification_table, 
                ' n, user_prefs p WHERE n.monitor_id=', in_id,
		' AND n.user_id=p.user_id and p.pref_scope="notifications" AND pref_name="notification_prefs_addr"');

PREPARE stmt FROM @s;
EXECUTE stmt;

END;
//
DELIMITER ;

