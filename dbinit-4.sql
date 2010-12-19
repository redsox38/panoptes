/* drop everything */
DROP TABLE IF EXISTS device_relationships;
DROP PROCEDURE IF EXISTS get_max_status;
DROP PROCEDURE IF EXISTS add_port_monitor;

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

