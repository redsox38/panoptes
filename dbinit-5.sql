/* drop everything */
DROP TABLE IF EXISTS dashboard_widgets;

/* tables */

--
-- Table structure for table dashboard_widgets
--

CREATE TABLE dashboard_widgets (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  php_class VARCHAR(128) NOT NULL,
  description VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


