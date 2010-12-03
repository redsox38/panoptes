<?php
/*
 *
 * Copyright (C) 2010 Todd Merritt <redsox38@gmail.com>
 *
 *    This program is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU General Public License as published by
 *    the Free Software Foundation, either version 3 of the License, or
 *    (at your option) any later version.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU General Public License for more details.
 *
 *    You should have received a copy of the GNU General Public License
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

/**
 * portMonitorEntry class
 *
 * class for interacting with monitor objects
 * and converting discovery objects into monitor objects
 *
 * @version 0.01
 * @author Todd Merritt <redsox38@gmail.com>
 * @project panoptes
 *
 */

require_once 'hostEntry.php';

class portMonitorEntry extends hostEntry
{
  public function __construct($db = null) {
    if (!is_null($db)) {
      $this->db = $db;
    }
  }
  
 /**
   * Commit entry into database
   *
   * @param none
   * @throws Exception
   * @return none
   */
  public function commit() {
    // insert into device table if not there already
    if (is_null($this->device_id)) {
      // see if it exists
      $res = mysql_query("SELECT id from devices WHERE address='" .
			 $this->srcaddr . "'", $this->db);

      if ($res !== false) {
	$r = mysql_fetch_assoc($res);
	if (!$r) {
	  mysql_free_result($res);

	  // try to get host name
	  $name = gethostbyaddr($this->srcaddr);

	  // insert new record
	  mysql_query("INSERT INTO devices VALUES(0, '" .
		      $this->srcaddr . "','" . 
		      $name . "')");

	  $this->device_id = $this->_last_insert_id();
	}
      } else {
	throw new Exception(mysql_error());
      }
    }
    
    $res = mysql_query("INSERT INTO port_monitors VALUES(0, '" .
		       $this->device_id . "', " . $this->sport . ", '" .
		       $this->proto . "', 15, NOW(), NOW(), 'new', '', 0)", 
                       $this->db);

    if ($res === false) {
      throw new Exception(mysql_error());
    } else {
      $this->id = $this->_last_insert_id();
    }
  }

  /**
   * Delete entry from database
   *
   * @param none
   * @throws Exception
   * @return none
   */
  public function delete() {
    $res = mysql_query("DELETE FROM port_monitors WHERE id='" . 
		       $this->id . "'");
    if ($res == false) {
      throw new Exception(mysql_error());
    }
  }

  /**
   * Disable entry in database
   *
   * @param none
   * @throws Exception
   * @return none
   */
  public function disable() {
    $res = mysql_query("UPDATE port_monitors SET disabled=1 WHERE id='" .
		       $this->id . "'");
    if ($res == false) {
      throw new Exception(mysql_error());
    }
  }

  /**
   * Enable entry in database
   *
   * @param none
   * @throws Exception
   * @return none
   */
  public function enable() {
    $res = mysql_query("UPDATE port_monitors SET disabled=0 WHERE id='" .
		       $this->id . "'");
    if ($res == false) {
      throw new Exception(mysql_error());
    }
  }

  /**
   * Ack entry in database
   *
   * @param msg ack message
   * @throws Exception
   * @return none
   */
  public function ack($msg) {
    global $panoptes_current_user;

    $res = mysql_query("INSERT into port_acknowledgments VALUES(0, " .
		       $this->id . ",'" . $panoptes_current_user . 
		       "',NOW(),'" . 
		       mysql_real_escape_string($msg) . "')");
    if ($res == false) {
      throw new Exception(mysql_error());
    }
  }

  /**
   * get ack entry from datbase
   *
   * @param msg ack message
   * @throws Exception
   * @return none
   */
  public function getAckInfo() {
    
    $res = mysql_query("SELECT * FROM port_acknowledgments WHERE monitor_id=" .
		       $this->id . " ORDER BY ack_time LIMIT 1", $this->db);

    if ($res == false) {
      throw new Exception(mysql_error());
    } else {
      $r = mysql_fetch_assoc($res);

      if ($r) {
	$rtn['ack_by'] = $r['ack_user'];
	$rtn['ack_time'] = $r['ack_time'];
	$rtn['ack_msg'] = $r['ack_msg'];
      } else {
	$rtn = array('ack_by'   => '',
		     'ack_time' => '',
		     'ack_msg'  => '');
      }
      mysql_free_result($res);
    }

    return($rtn);
  }
}
?>
