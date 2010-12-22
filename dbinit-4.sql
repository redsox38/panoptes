/* drop everything */
DROP TABLE IF EXISTS device_relationships;
DROP PROCEDURE IF EXISTS get_max_status;
DROP PROCEDURE IF EXISTS add_port_monitor;
DROP PROCEDURE IF EXISTS get_next_monitor_entry;

/* tables */

--
-- Table structure for table device_relationships
--

CREATE TABLE device_relationships (
  parent_id bigint(20) NOT NULL,
  child_id bigint(20) NOT NULL,
  CONSTRAINT device_relationships_ibfk_1 FOREIGN KEY (parent_id) REFERENCES devices (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT device_relationships_ibfk_2 FOREIGN KEY (child_id) REFERENCES devices (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Add OS column(s) to device table
--
ALTER TABLE devices ADD COLUMN os_genre VARCHAR(255) NOT NULL DEFAULT 'unknown' AFTER name;
ALTER TABLE devices ADD COLUMN os_detail VARCHAR(255) NOT NULL DEFAULT 'unknown' AFTER os_genre;
ALTER TABLE discovered ADD COLUMN os_genre VARCHAR(255) NOT NULL DEFAULT 'unknown' AFTER ignored;
ALTER TABLE discovered ADD COLUMN os_detail VARCHAR(255) NOT NULL DEFAULT 'unknown' AFTER os_genre;

--
-- Add expected content column to url_monitors table
--
ALTER TABLE url_monitors ADD COLUMN expect_http_content VARCHAR(255) DEFAULT NULL AFTER expect_http_status;

/* stored procedures */

DELIMITER //
CREATE PROCEDURE add_port_monitor(IN in_port BIGINT,
                                  IN in_addr VARCHAR(16),
                                  IN in_proto VARCHAR(4),
				  IN in_genre VARCHAR(20),
				  IN in_detail VARCHAR(40))
MODIFIES SQL DATA
COMMENT 'Add new port monitor'
BEGIN

DECLARE V_id BIGINT;
DECLARE V_device_id BIGINT;

SELECT id INTO V_device_id FROM devices WHERE address=in_addr;

IF V_device_id IS NULL THEN
    INSERT INTO devices VALUES(0, in_addr, in_addr, in_genre, in_detail);
    SELECT LAST_INSERT_ID() INTO V_device_id;
END IF;

INSERT INTO port_monitors VALUES(0, V_device_id, in_port, in_proto, 15, NOW(), NOW(), 'new', '', 0);
SELECT LAST_INSERT_ID() INTO V_id;

SELECT V_id AS monitor_id, V_device_id AS device_id;

END;
//
DELIMITER ;

DELIMITER //
CREATE PROCEDURE get_max_status(IN in_id BIGINT)
                                  
READS SQL DATA
SQL SECURITY INVOKER
COMMENT 'Get most relevant status from given device id'
BEGIN

DECLARE max_stat VARCHAR(10);
DECLARE st VARCHAR(10);
DECLARE no_more_rows BOOLEAN;
DECLARE stat_cursor CURSOR FOR 
                    SELECT t1.status FROM 
                   (SELECT status FROM port_monitors WHERE device_id=in_id
                    UNION
                    SELECT status FROM certificate_monitors WHERE device_id=in_id
                    UNION
                    SELECT status FROM snmp_monitors WHERE device_id=in_id
                    UNION
                    SELECT status FROM shell_monitors WHERE device_id=in_id
                    UNION
                    SELECT status FROM url_monitors WHERE device_id=in_id) t1;
DECLARE CONTINUE HANDLER FOR NOT FOUND SET no_more_rows = 'true';
SET max_stat = 'ok';

OPEN stat_cursor;

REPEAT
FETCH stat_cursor INTO st;

IF (st='critical') THEN
    SET max_stat='critical';
ELSEIF (st='warn' AND max_stat <> 'critical') THEN
    SET max_stat='warn';
END IF;

UNTIL no_more_rows = 'true'
END REPEAT;

CLOSE stat_cursor;

SELECT max_stat AS max;
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
  SET @s = CONCAT('SELECT device_id, check_interval, url, expect_http_status, expect_http_content, status INTO @_dev_id, @_interval, @_url, @_expect_http_status, @_expect_http_content, @_status FROM ', V_table_name, ' WHERE id=', V_id, ' FOR UPDATE');

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
	 @_expect_http_content AS expect_http_content, 
         @_status AS status;
END IF;

END;
//
DELIMITER ;