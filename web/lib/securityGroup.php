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
   * @throws PDOException
   * @return var integer
   */
  public function _last_insert_id() {
    try {
      $id = $this->db->lastInsertId();
      
      if (!($id) || ($id < 1)) {
        throw new Exception("No ID");
      }
    } catch (PDOException $e) {
      throw($e);
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
      
      try {
	$stmt = $this->db->prepare("SELECT user_id FROM security_group_membership WHERE group_id=?");
	$stmt->bindParam(1, $this->id, PDO::PARAM_INT);
	$stmt->execute();
	
	while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
	  array_push($this->children, $r['user_id']);
	}	
      } catch (PDOException $e) {
	throw($e);
      }
    }

    return($this->children);
  }

 /**
   * Commit entry into database
   *
   * @param none
   * @throws PDOException
   * @return none
   */
  public function commit() {
    // insert into security group
    try {
      $stmt = $this->db->prepare("INSERT INTO security_groups VALUES (0, ?)");
      $stmt->bindParam(1, $this->name);
      $stmt->execute();
      $this->id = $this->db->lastInsertId();
    } catch (PDOException $e) {
      throw($e);
    }
  }

 /**
   * Add member to group
   *
   * @param userid user to add to group
   * @throws Exception
   * @return none
   */
  public function addMember($userid) {
    // insert into security group
    try {
      $stmt = $this->db->prepare("INSERT INTO security_group_membership VALUES (?, ?)");
      $stmt->bindParam(1, $this->id, PDO::PARAM_INT);
      $stmt->bindParam(2, $userid, PDO::PARAM_INT);
      $stmt->execute();
    } catch (PDOException $e) {
      throw($e);
    }
  }


 /**
   * Delete member from group
   *
   * @param userid user to remove to group
   * @throws Exception
   * @return none
   */
  public function deleteMember($userid) {
    // delete from security group
    try {
      $stmt = $this->db->prepare("DELETE FROM security_group_membership WHERE id=? AND user_id=?");
      $stmt->bindParam(1, $this->id, PDO::PARAM_INT);
      $stmt->bindParam(2, $userid, PDO::PARAM_INT);
      $stmt->execute();
    } catch (PDOException $e) {
      throw($e);
    }
  }
}
?>
