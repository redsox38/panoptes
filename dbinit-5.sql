/* drop everything */
DROP TABLE IF EXISTS dashboard_widgets;
DROP TABLE IF EXISTS user_dashboard_widgets;

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
INSERT INTO dashboard_widgets VALUES(0,'performance history graph','perfromanceHistoryWidget','performanceHistory.php','Display Performance History Graph');

