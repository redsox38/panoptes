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
   * @throws PDOException
   * @return none
   */
  public function commit() {
    global $panoptes_current_user;

    try {
      // insert into user table if not there already
      if (is_null($this->id)) {      
	// insert new record
	$stmt = $this->db->prepare("INSERT INTO users VALUES(0, ?, ?, NOW())");
	$stmt->bindParam(1, $this->name);
	$stmt->bindParam(2, $panoptes_current_user);
	$stmt->execute();
	$this->id = $this->db->lastInsertId();
      } else {
	// update existing entry
	$stmt = $this->db->prepare("UPDATE users SET name=? WHERE id=?");
	$stmt->bindParam(1, $this->name);
	$stmt->bindParam(2, $this->id, PDO::PARAM_INT);
	$stmt->execute();
      }
    } catch (PDOException $e) {
      throw($e);
    }
  }

  /**
   * Get user by name
   *
   * @param name name to look up
   * @throws PDOException, Exception
   * @return none
   */
  public function getByName($name) {
    try {
      $stmt = $this->db->prepare("SELECT * FROM users WHERE name=?");
      $stmt->bindParam(1, $name);
      $stmt->execute();

      $r = $stmt->fetch(PDO::FETCH_ASSOC);

      if ($r) {
	$this->id = $r['id'];
	$this->name = $r['name'];
	$this->created_by = $r['created_by'];
	$this->modified = $r['modified'];
      } else {
	throw new Exception("user " . $name . " does not exist");
      }
    } catch (PDOException $e) {
      throw($e);
    }
  }

  /**
   * Get security groups for this user
   *
   * @param none
   * @throws PDOException
   * @return array of group ids
   */
  public function getGroups() {
    $groups = array();

    try {
      $id = $this->id;
      $stmt = $this->db->prepare("SELECT group_id FROM security_group_membership WHERE user_id=?");
      $stmt->bindParam(1, $id, PDO::PARAM_INT);
      $stmt->execute();
      
      while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
	$groups[] = $r['group_id'];
      }
    } catch (PDOException $e) {
      throw($e);
    }

    return($groups);
  }

  /**
   * Delete user entry
   *
   * @param none
   * @throws PDOException
   * @return none
   */
  public function delete() {
    try {
      $stmt = $this->db->prepare("DELETE FROM users WHERE id=?");
      $stmt->bindParam(1, $this->id);
      $stmt->execute();
    } catch (PDOException $e) {
      throw($e);
    }
  }
}
?>
