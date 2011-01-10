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
   * @throws PDOException
   * @return array containing the device ids of the child devices
   */
  public function children() {
    if (is_null($this->children)) {
      $this->children = array();

      try {
	$id = $this->id;
	$stmt = $this->db->prepare("SELECT device_id FROM device_group_membership WHERE group_id=?");
	$stmt->bindParam(1, $id, PDO::PARAM_INT);
	$stmt->execute();
	
	while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
	  array_push($this->children, $r['device_id']);
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
    // insert into device table 
    try {
      $id = $this->id;
      $stmt = $this->db->prepare("INSERT INTO device_groups VALUES(?,?)");
      $stmt->bindParam(1, $id, PDO::PARAM_INT);
      $stmt->bindParam(2, $this->name);
      $stmt->execute();
      $this->id = $this->db->lastInsertId();
    } catch (PDOException $e) {
      throw($e);
    }
  }

  /**
   * Add child to database
   *
   * @param device_id id of device entry to add as child
   * @throws PDOException
   * @return none
   */
  public function addMember($device_id) {
    try {
      $id = $this->id;
      $stmt = $this->db->prepare("INSERT INTO device_group_membership VALUES(?, ?)");
      $stmt->bindParam(1, $id, PDO::PARAM_INT);
      $stmt->bindParam(2, $device_id, PDO::PARAM_INT);
      $stmt->execute();
    } catch (PDOException $e) {
      throw($e);
    }
  }

  /**
   * remove child from database
   *
   * @param device_id id of device entry to remove as child
   * @throws PDOException
   * @return none
   */
  public function removeMember($device_id) {
    try {
      $id = $this->id;
      $stmt = $this->db->prepare("DELETE FROM device_group_membership WHERE group_id=? AND device_id=?");
      $stmt->bindParam(1, $id, PDO::PARAM_INT);
      $stmt->bindParam(2, $device_id, PDO::PARAM_INT);
      $stmt->execute();
    } catch (PDOException $e) {
      throw($e);
    }
  }

  /**
   * Delete group
   *
   * @param none
   * @throws PDOException
   * @return none
   */
  public function delete() {
    try {
      $id = $this->id;
      $stmt = $this->db->prepare("DELETE FROM device_groups WHERE id=?");
      $stmt->bindParam(1, $id, PDO::PARAM_INT);
      $stmt->execute();
    } catch (PDOException $e) {
      throw($e);
    }
  }

  /**
   * getById
   *
   * @param id device id to populate with
   * @throws Exception
   * @return none
   */
  public function getById($id) {
    try {
      $stmt = $this->db->prepare("SELECT * FROM device_groups WHERE id=?");
      $stmt->bindParam(1, $id, PDO::PARAM_INT);
      $stmt->execute();
      
      $r = $stmt->fetch(PDO::FETCH_ASSOC);
      $this->id = $r['id'];
      $this->name = $r['group_name'];      
    } catch (PDOException $e) {
      throw($e);
    }
  }
}
?>
