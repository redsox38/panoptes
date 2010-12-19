/* drop everything */
DROP TABLE IF EXISTS device_relationships;
DROP PROCEDURE IF EXISTS get_max_status;

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

/* stored procedures */

DELIMITER //
CREATE PROCEDURE get_max_status(IN in_id BIGINT)
                                  
READS SQL DATA
SQL SECURITY INVOKER
COMMENT 'Get most relevant status from given device id'
BEGIN

SELECT DISTINCT GREATEST(u.status, p.status, c.status, n.status, s.status) AS max FROM
       url_monitors u,
       port_monitors p,
       certificate_monitors c,
       snmp_monitors n,
       shell_monitors s
       WHERE 
       u.device_id = in_id OR
       p.device_id = in_id OR
       c.device_id = in_id OR
       n.device_id = in_id OR
       s.device_id = in_id;

END;
//
DELIMITER ;

