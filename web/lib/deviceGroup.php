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
 * deviceGroup class
 *
 * class for interacting with device object group membership
 *
 * @version 0.01
 * @author Todd Merritt <redsox38@gmail.com>
 * @project panoptes
 *
 */

class deviceGroup
{
  protected $db;
  protected $data = array();
  protected $children = null;

  public function __get($name) {
    if (array_key_exists($name, $this->data)) {
      return($this->data[$name]);
    } else {
      return(null);
    }
  }
  
  public function __set($name, $val) {
    $this->data[$name] = $val;
  }

  public function __construct($db = null) {
    if (!is_null($db)) {
      $this->db = $db;
    }
  }
  
  public function __destroy() {
  }

  /**
   * Get/Set db link
   *
   * @param val optional db link to set db to
   * @throws none
   * @return var current db link
   */
  public function db($val = null) {
    if (!(is_null($val))) {
      $this->db = $val;
    }
    
    return($this->db);
  }

  /**
   * Get children (members) of this group
   *
   * @param none
   * @throws Exception
   * @return array containing the device ids of the child devices
   */
  public function children() {
    if (is_null($this->children)) {
      $this->children = array();
      
      $res = mysql_query("SELECT device_id FROM device_group_membership WHERE group_id='" .
			 $this->id ."'", $this->db);
      
      if ($res) {
	while ($r = mysql_fetch_assoc($res)) {
	  array_push($this->children, $r['device_id']);
	}	
	mysql_free_result($res);
      } else {
	throw new Exception(mysql_error());
      }
    }

    return($this->children);
  }

 /**
   * Commit entry into database
   *
   * @param none
   * @throws Exception
   * @return none
   */
  public function commit() {
    // insert into device table 
    $res = mysql_query("INSERT INTO device_groups VALUES(" .
		       $this->id . ",'" .
		       $this->name . "')", $this->db);
    
    if ($res !== false) {
      // retrieve group id and update object
      $res = mysql_query("SELECT id FROM device_groups WHERE group_name='" .
			 $this->name . "'", $this->db);
      if ($res !== false) {
	$r = mysql_fetch_assoc($res);
	$this->id = $r['id'];
      } else {
	throw new Exception(mysql_error());
      }
    } else {
      throw new Exception(mysql_error());
    }
  }

  /**
   * Add child to database
   *
   * @param device_id id of device entry to add as child
   * @throws Exception
   * @return none
   */
  public function addMember($device_id) {
    $res = mysql_query("INSERT INTO device_group_membership VALUES(" .
		       $this->id . "," . $device_id . ")", $this->db);

    if ($res === false)
      throw new Exception(mysql_error());
  }
}
?>
