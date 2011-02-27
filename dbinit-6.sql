/* drop tables */

DROP TABLE IF EXISTS port_notification_blackouts;
DROP TABLE IF EXISTS shell_notification_blackouts;
DROP TABLE IF EXISTS snmp_notification_blackouts;
DROP TABLE IF EXISTS url_notification_blackouts;
DROP TABLE IF EXISTS certificate_notification_blackouts;
DROP PROCEDURE IF EXISTS get_monitor_notification;
DROP PROCEDURE IF EXISTS reset_pending_monitors;
/* tables */

--
-- Table structure for port_notification_blackouts
--

CREATE TABLE port_notification_blackouts (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  monitor_id bigint(20) NOT NULL,
  start time NOT NULL,
  stop time NOT NULL,
  PRIMARY KEY (id),
  KEY port_notification_blackouts_ibfk_1 (monitor_id),
  CONSTRAINT port_notification_blackouts_ibfk_1 FOREIGN KEY (monitor_id) REFERENCES port_monitors (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for shell_notification_blackouts
--

CREATE TABLE shell_notification_blackouts (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  monitor_id bigint(20) NOT NULL,
  start time NOT NULL,
  stop time NOT NULL,
  PRIMARY KEY (id),
  KEY shell_notification_blackouts_ibfk_1 (monitor_id),
  CONSTRAINT shell_notification_blackouts_ibfk_1 FOREIGN KEY (monitor_id) REFERENCES shell_monitors (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for snmp_notification_blackouts
--

CREATE TABLE snmp_notification_blackouts (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  monitor_id bigint(20) NOT NULL,
  start time NOT NULL,
  stop time NOT NULL,
  PRIMARY KEY (id),
  KEY snmp_notification_blackouts_ibfk_1 (monitor_id),
  CONSTRAINT snmp_notification_blackouts_ibfk_1 FOREIGN KEY (monitor_id) REFERENCES snmp_monitors (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for url_notification_blackouts
--

CREATE TABLE url_notification_blackouts (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  monitor_id bigint(20) NOT NULL,
  start time NOT NULL,
  stop time NOT NULL,
  PRIMARY KEY (id),
  KEY url_notification_blackouts_ibfk_1 (monitor_id),
  CONSTRAINT url_notification_blackouts_ibfk_1 FOREIGN KEY (monitor_id) REFERENCES url_monitors (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for certificate_notification_blackouts
--

CREATE TABLE certificate_notification_blackouts (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  monitor_id bigint(20) NOT NULL,
  start time NOT NULL,
  stop time NOT NULL,
  PRIMARY KEY (id),
  KEY certificate_notification_blackouts_ibfk_1 (monitor_id),
  CONSTRAINT certificate_notification_blackouts_ibfk_1 FOREIGN KEY (monitor_id) REFERENCES certificate_monitors (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/* stored procedures */

DELIMITER //
CREATE PROCEDURE get_monitor_notification(IN in_id BIGINT,
                                          IN in_table VARCHAR(50),
                                          IN in_type VARCHAR(32))
READS SQL DATA
SQL SECURITY INVOKER
COMMENT 'Retrieve list of addresses to notify for this monitor'
BEGIN

DECLARE V_notification_table VARCHAR(50);
DECLARE V_notification_bo_table VARCHAR(50);
DECLARE V_notification_attr VARCHAR(50);

IF (in_table = 'port_monitors') THEN
   SET V_notification_table = 'port_notifications';
   SET V_notification_bo_table = 'port_notification_blackouts';
ELSEIF (in_table = 'certificate_monitors') THEN
   SET V_notification_table = 'certificate_notifications';
   SET V_notification_bo_table = 'certificate_notification_blackouts';
ELSEIF (in_table = 'snmp_monitors') THEN
   SET V_notification_table = 'snmp_notifications';
   SET V_notification_bo_table = 'snmp_notification_blackouts';
ELSEIF (in_table = 'shell_monitors') THEN
   SET V_notification_table = 'shell_notifications';
   SET V_notification_bo_table = 'shell_notification_blackouts';
ELSEIF (in_table = 'url_monitors') THEN
   SET V_notification_table = 'url_notifications';
   SET V_notification_bo_table = 'url_notification_blackouts';
END IF;

IF (in_type = 'email') THEN
   SET V_notification_attr = 'notification_prefs_addr';
ELSEIF (in_type = 'xmpp') THEN
   SET V_notification_attr = 'notification_prefs_xmpp_addr';
END IF;

-- read from approprate table
SET @s = CONCAT('SELECT p.pref_value AS address FROM user_prefs p, ', V_notification_table, 
                ' n LEFT OUTER JOIN ', V_notification_bo_table, ' b ON n.monitor_id=b.monitor_id WHERE n.monitor_id=', in_id,
                ' AND n.user_id=p.user_id and p.pref_scope="notifications" AND pref_name="',
                V_notification_attr, '"  and (b.start is null or (current_timestamp < start or current_timestamp > stop))');

PREPARE stmt FROM @s;
EXECUTE stmt;

END;
//
DELIMITER ;

DELIMITER //
CREATE PROCEDURE reset_pending_monitors()

MODIFIES SQL DATA	
SQL SECURITY INVOKER
COMMENT 'reset any pending monitors'
BEGIN
UPDATE port_monitors SET status='warn' WHERE status='pending' AND next_check < DATE_ADD(NOW(), INTERVAL 15 MINUTE);
UPDATE ping_monitors SET status='warn' WHERE status='pending' AND next_check < DATE_ADD(NOW(), INTERVAL 15 MINUTE);
UPDATE snmp_monitors SET status='warn' WHERE status='pending' AND next_check < DATE_ADD(NOW(), INTERVAL 15 MINUTE);
UPDATE shell_monitors SET status='warn' WHERE status='pending' AND next_check < DATE_ADD(NOW(), INTERVAL 15 MINUTE);
UPDATE certificate_monitors SET status='warn' WHERE status='pending' AND next_check < DATE_ADD(NOW(), INTERVAL 15 MINUTE);
UPDATE url_monitors SET status='warn' WHERE status='pending' AND next_check < DATE_ADD(NOW(), INTERVAL 15 MINUTE);
END;
//
DELIMITER ;
