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
 * pingEntry class
 *
 * class for interacting with ping device objects
 *
 * @version 0.01
 * @author Todd Merritt <redsox38@gmail.com>
 * @project panoptes
 *
 */

require_once 'deviceEntry.php';

class pingEntry
{
  protected $db;
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
   * Commit entry into database
   *
   * @param none
   * @throws PDOException
   * @return none
   */
  public function commit() {
    // insert into ping_monitors table if not there already
    if (is_null($this->id)) {
      // insert new entry 
      try {
	$id = $this->device->id;
	$status = "new";
	$status_string = "pending check";

	$stmt = $this->db->prepare("INSERT INTO ping_monitors VALUES (0, ?, 15, NOW(), NOW(), ?, ?, 0)");
	$stmt->bindParam(1, $id, PDO::PARAM_INT);
	$stmt->bindParam(2, $status);
	$stmt->bindParam(3, $status_string);
	$stmt->execute();
	$this->id = $this->db->lastInsertId();
      } catch (PDOException $e) {
	throw($e);
      }
    }
  }
  
}
?>
