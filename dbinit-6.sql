/* drop tables */

DROP TABLE IF EXISTS port_notification_blackouts;
DROP TABLE IF EXISTS ping_notification_blackouts;
DROP TABLE IF EXISTS shell_notification_blackouts;
DROP TABLE IF EXISTS snmp_notification_blackouts;
DROP TABLE IF EXISTS url_notification_blackouts;
DROP TABLE IF EXISTS certificate_notification_blackouts;
DROP VIEW monitor_tasks;

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
-- Table structure for ping_notification_blackouts
--

CREATE TABLE ping_notification_blackouts (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  monitor_id bigint(20) NOT NULL,
  start time NOT NULL,
  stop time NOT NULL,
  PRIMARY KEY (id),
  KEY ping_notification_blackouts_ibfk_1 (monitor_id),
  CONSTRAINT ping_notification_blackouts_ibfk_1 FOREIGN KEY (monitor_id) REFERENCES ping_monitors (id) ON DELETE CASCADE ON UPDATE CASCADE
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

/* views */

CREATE ALGORITHM=UNDEFINED SQL SECURITY INVOKER VIEW monitor_tasks
    AS (SELECT 'port_monitors' AS table_name, po.id AS id,
        po.device_id AS device_id,
        po.last_check AS last_check, 
        po.next_check AS next_check FROM
        port_monitors po LEFT OUTER JOIN port_notification_blackouts pn ON po.id=pn.monitor_id 
	WHERE po.disabled=0 AND po.status <> 'pending'
	AND (start IS NULL OR current_timestamp < start OR current_timestamp > stop)) 
        UNION (SELECT 'ping_monitors' AS table_name, pi.id AS id, 
        pi.device_id AS device_id,
        pi.last_check AS last_check, 
        pi.next_check AS next_check FROM 
	ping_monitors pi LEFT OUTER JOIN ping_notification_blackouts pn ON pi.id=pn.monitor_id
        WHERE pi.disabled=0 AND pi.status <> 'pending'
	AND (start IS NULL OR current_timestamp < start OR current_timestamp > stop)) 
        UNION(SELECT 'certificate_monitors' AS table_name, ce.id AS id,
        ce.device_id AS device_id,
        ce.last_check AS last_check, 
        ce.next_check AS next_check FROM certificate_monitors ce
	LEFT OUTER JOIN certificate_notification_blackouts cn ON ce.id=cn.monitor_id
        WHERE ce.disabled=0 AND ce.status <> 'pending'
	AND (start IS NULL OR current_timestamp < start OR current_timestamp > stop))                 
        UNION(SELECT 'snmp_monitors' AS table_name, sn.id AS id,
        sn.device_id AS device_id,
        sn.last_check AS last_check, 
        sn.next_check AS next_check FROM snmp_monitors sn
	LEFT OUTER JOIN snmp_notification_blackouts sb ON sn.id=sb.monitor_id
        WHERE sn.disabled=0 AND sn.status <> 'pending'
	AND (start IS NULL OR current_timestamp < start OR current_timestamp > stop))                 
        UNION(SELECT 'shell_monitors' AS table_name, sh.id AS id,
        sh.device_id AS device_id,
        sh.last_check AS last_check, 
        sh.next_check AS next_check FROM shell_monitors sh
	LEFT OUTER JOIN shell_notification_blackouts sn ON sh.id=sn.monitor_id
        WHERE sh.disabled=0 AND sh.status <> 'pending'
	AND (start IS NULL OR current_timestamp < start OR current_timestamp > stop))                 
        UNION(SELECT 'url_monitors' AS table_name, url.id AS id,
        url.device_id AS device_id,
        url.last_check AS last_check, 
        url.next_check AS next_check FROM url_monitors url
	LEFT OUTER JOIN url_notification_blackouts un ON url.id=un.monitor_id
        WHERE url.disabled=0 AND url.status <> 'pending'
	AND (start IS NULL OR current_timestamp < start OR current_timestamp > stop))                 
        ORDER BY next_check;

