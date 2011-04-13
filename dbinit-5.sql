/* drop everything */
DROP TABLE IF EXISTS dashboard_widgets;
DROP TABLE IF EXISTS user_dashboard_widgets;
DROP PROCEDURE IF EXISTS get_monitor_notification;

/* tables */

--
-- Table structure for table dashboard_widgets
--

CREATE TABLE dashboard_widgets (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  php_class VARCHAR(128) NOT NULL,
  php_file VARCHAR(128) NOT NULL,
  description VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table user_dashboard_widgets
--

CREATE TABLE user_dashboard_widgets (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  widget_id bigint(20) NOT NULL,
  user_id bigint(20) NOT NULL,
  params VARCHAR(255) NOT NULL,
  position smallint(6) NOT NULL,
  PRIMARY KEY (id),
  KEY usr_idx (user_id),
  UNIQUE KEY pos_idx (user_id, position),
  UNIQUE KEY idx (widget_id, user_id, params),
  CONSTRAINT user_dashboard_widgets_ibfk_1 FOREIGN KEY (widget_id) REFERENCES dashboard_widgets (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT user_dashboard_widgets_ibfk_2 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO dashboard_widgets VALUES(0,'group status summary','groupStatusWidget','groupStatus.php','Display Summary Status of a Device Group');
INSERT INTO dashboard_widgets VALUES(0,'performance history graph','performanceHistoryWidget','performanceHistory.php','Display Performance History Graph');

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
DECLARE V_notification_attr VARCHAR(50);

IF (in_table = 'port_monitors') THEN
   SET V_notification_table = 'port_notifications';
ELSEIF (in_table = 'certificate_monitors') THEN
   SET V_notification_table = 'certificate_notifications';
ELSEIF (in_table = 'snmp_monitors') THEN
   SET V_notification_table = 'snmp_notifications';
ELSEIF (in_table = 'shell_monitors') THEN
   SET V_notification_table = 'shell_notifications';
ELSEIF (in_table = 'url_monitors') THEN
   SET V_notification_table = 'url_notifications';
END IF;

IF (in_type = 'email') THEN
   SET V_notification_attr = 'notification_prefs_addr';
ELSEIF (in_type = 'xmpp') THEN
   SET V_notification_attr = 'notification_prefs_xmpp_addr';
END IF;

-- read from approprate table
SET @s = CONCAT('SELECT p.pref_value AS address FROM ', V_notification_table, 
                ' n, user_prefs p WHERE n.monitor_id=', in_id,
                ' AND n.user_id=p.user_id and p.pref_scope="notifications" AND pref_name="',
		V_notification_attr, '"');

PREPARE stmt FROM @s;
EXECUTE stmt;

END;
//
DELIMITER ;
