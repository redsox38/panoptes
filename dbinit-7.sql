/* drop everything */
DROP PROCEDURE IF EXISTS get_next_monitor_entry;

/* tables */

--
-- Add request method column to url_monitors table
--
ALTER TABLE url_monitors ADD COLUMN request_method VARCHAR(255) DEFAULT 'GET' AFTER expect_http_content;

--
-- Add http post vars column to url_monitors table
--
ALTER TABLE url_monitors ADD COLUMN http_post_vars VARCHAR(255) DEFAULT NULL AFTER request_method;

/* procedures */

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
  SET @s = CONCAT('SELECT device_id, check_interval, url, request_method, http_post_vars, expect_http_status, expect_http_content, status INTO @_dev_id, @_interval, @_url, @_request_method, @_http_post_vars, @_expect_http_status, @_expect_http_content, @_status FROM ', V_table_name, ' WHERE id=', V_id, ' FOR UPDATE');

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
	 @_request_method AS request_method,
	 @_http_post_vars AS http_post_vars,
	 @_expect_http_status AS expect_http_status, 
	 @_expect_http_content AS expect_http_content, 
         @_status AS status;
END IF;

END;
//
DELIMITER ;