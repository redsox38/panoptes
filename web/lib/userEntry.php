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
 * userEntry class
 *
 * class for interacting with monitored user objects
 *
 * @version 0.01
 * @author Todd Merritt <redsox38@gmail.com>
 * @project panoptes
 *
 */

class userEntry
{
  protected $data = array();

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
      $this->data['db'] = $db;
    }
  }
  
  public function __destroy() {
  }

  /**
   * Commit entry into database
   *
   * @param none
   * @throws Exception
   * @return none
   */
  public function commit() {
    global $panoptes_current_user;

    // insert into user table if not there already
    if (is_null($this->id)) {      
      // insert new record
      mysql_query("INSERT INTO users VALUES(0, '" .
		  $this->name . "','" .
		  $panoptes_current_user . "', NOW())");

      $res = mysql_query("SELECT id from users WHERE name='" .
			 $this->name . "'", $this->db);
      if ($res !== false) {
	$r = mysql_fetch_assoc($res);
	$this->id = $r['id'];
	mysql_free_result($res);
      } else {
	throw new Exception(mysql_error());
      }
    } else {
      // update existing entry
      $res = mysql_query("UPDATE users SET name='" .
			 $this->name . "' WHERE id='" .
			 $this->id . "'");
      if ($res === false) {
	throw new Exception(mysql_error());
      }
    }
  }

  /**
   * Get user by name
   *
   * @param name name to look up
   * @throws Exception
   * @return none
   */
  public function getByName($name) {
    $res = mysql_query("SELECT * FROM users WHERE name='" .
		       mysql_real_escape_string($name) . 
		       "'", $this->db);

    if ($res !== false) {
      $r = mysql_fetch_assoc($res);
      if ($r) {
	$this->id = $r['id'];
	$this->name = $r['name'];
	$this->created_by = $r['created_by'];
	$this->modified = $r['modified'];
	mysql_free_result($res);
      } else {
	throw new Exception("user " . $name . " does not exist");
      }
    } else {
      throw new Exception(mysql_error());
    }
  }

  /**
   * Get security groups for this user
   *
   * @param none
   * @throws Exception
   * @return array of group ids
   */
  public function getGroups() {
    $groups = array();

    $res = mysql_query("SELECT group_id FROM security_group_membership WHERE user_id='" .
		       $this->id . 
		       "'", $this->db);

    if ($res !== false) {
      while ($r = mysql_fetch_assoc($res)) {
	$groups[] = $r['group_id'];
      }
      mysql_free_result($res);
    } else {
      throw new Exception(mysql_error());
    }

    return($groups);
  }

  /**
   * Delete user entry
   *
   * @param none
   * @throws Exception
   * @return none
   */
  public function delete() {
    $res = mysql_query("DELETE FROM users WHERE id='" . $this->id . "'");
    if ($res === false) {
      throw new Exception(mysql_error());
    }
  }
}
?>
