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
 * SNMPMonitorEntry class
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

class SNMPMonitorEntry extends hostEntry
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
    
    $res = mysql_query("INSERT INTO snmp_monitors VALUES(0, '" .
		       $this->device_id . "', '" .
		       $this->name . "','" .
		       implode(',', $this->oid_array) . 
		       "', 15, NOW(), NOW(), 'new', '', 0)", 
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
    $res = mysql_query("DELETE FROM snmp_monitors WHERE id='" . 
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
    $res = mysql_query("UPDATE snmp_monitors SET disabled=1 WHERE id='" .
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
    $res = mysql_query("UPDATE snmp_monitors SET disabled=0 WHERE id='" .
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
    $res = mysql_query("INSERT into snmp_acknowledgments VALUES(0, " .
		       $this->id . ",'webuser',NOW(),'" . 
		       mysql_real_escape_string($msg) . "')");
    if ($res == false) {
      throw new Exception(mysql_error());
    }
  }
}
?>
