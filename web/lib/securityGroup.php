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
 * securityGroup class
 *
 * class for interacting with device object group membership
 *
 * @version 0.01
 * @author Todd Merritt <redsox38@gmail.com>
 * @project panoptes
 *
 */

class securityGroup
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
    $this->id = 0;
  }
  
  public function __destroy() {
  }

  /**
   * Get if from last insert
   *
   * @param none
   * @throws Exception
   * @return var integer
   */
  public function _last_insert_id() {
    $res = mysql_query("SELECT LAST_INSERT_ID() AS id", $this->db);

    $id = false;

    if ($res !== false) {
      $r = mysql_fetch_assoc($res);
      if ($r) {
        $id = $r['id'];
      } else {
        throw new Exception("No ID");
      }
      mysql_free_result($res);
    } else {
      throw new Exception(mysql_error());
    }

    return($id);
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
      
      $res = mysql_query("SELECT user_id FROM security_group_membership WHERE group_id='" .
			 $this->id ."'", $this->db);
      
      if ($res) {
	while ($r = mysql_fetch_assoc($res)) {
	  array_push($this->children, $r['user_id']);
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
    // insert into security group
    $res = mysql_query("INSERT INTO security_groups VALUES(0,'" .
		       $this->name . "')", $this->db);
    
    if ($res !== false) {
      // retrieve group id and update object
      $this->id = $this->_last_insert_id();
    } else {
      throw new Exception(mysql_error());
    }
  }
}
?>
