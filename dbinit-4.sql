/* drop everything */
DROP TABLE IF EXISTS device_relationships;

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

