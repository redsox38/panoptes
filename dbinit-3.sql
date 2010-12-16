/* drop everything */
DROP PROCEDURE IF EXISTS add_port_monitor;

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