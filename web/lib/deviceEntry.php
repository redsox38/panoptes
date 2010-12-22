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
 * deviceEntry class
 *
 * class for interacting with monitored device objects
 *
 * @version 0.01
 * @author Todd Merritt <redsox38@gmail.com>
 * @project panoptes
 *
 */

class deviceEntry
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
    try {
      // insert into device table if not there already
      if (is_null($this->id)) {      
	// insert new record

	// try to get host name
	$srcaddr = $this->srcaddr;
	$this->name = gethostbyaddr($this->srcaddr);
	$name = $this->name;
	$os_genre = $this->os_genre;
	$os_detail = $this->os_detail;

	$stmt = $this->db->prepare("INSERT INTO devices VALUES(0, ?, ?, ?, ?)");
	$stmt->bindParam(1, $srcaddr);
	$stmt->bindParam(2, $name);
	$stmt->bindParam(3, $os_genre);
	$stmt->bindParam(4, $os_detail);
	$stmt->execute();
	
	$this->id = $this->db->lastInsertId();
      } else {
	// update existing entry
	$id = $this->id;
	$name = $this->name;
	$addr = $this->address;
	$os_genre = $this->os_genre;
	$os_detail = $this->os_detail;

	$stmt = $this->db->prepare("UPDATE devices SET name=?, address=?, os_genre=?, os_detail=? WHERE id=?");
	$stmt->bindParam(1, $name);
	$stmt->bindParam(2, $addr);
	$stmt->bindParam(3, $os_genre);
	$stmt->bindParam(4, $os_detail);
	$stmt->bindParam(5, $id, PDO::PARAM_INT);
	$stmt->execute();
      }
    } catch (PDOException $e) {
      throw($e);
    }
  }

  /**
   * Delete device entry
   *
   * @param none
   * @throws PDOException
   * @return none
   */
  public function delete() {
    try {
      $stmt = $this->db->prepare("DELETE FROM devices WHERE id=?");
      $stmt->bindParam(1, $this->id, PDO::PARAM_INT);
      $stmt->execute();
    } catch (PDOException $e) {
      throw($e);
    }
  }

  /**
   * schedule outage window for device
   *
   * @param start date string 'yyyy/mm/dd hh:mm'
   *        stop date string 'yyyy/mm/dd hh:mm'
   * @throws PDOException
   * @return none
   */
  public function scheduleOutage($start, $stop) {
    try {
      $stmt = $this->db->prepare("INSERT INTO device_outages VALUES(0, ?, ?, ?)");
      $stmt->bindParam(1, $this->id, PDO::PARAM_INT);
      $stmt->bindParam(2, $start);
      $stmt->bindParam(3, $stop);
      $stmt->execute();
    } catch (PDOException $e) {
      throw($e);
    }
  }

  /**
   * getOutage get future/current scheduled outage(s)
   *
   * @param none
   * @throws Exception
   * @return array of outage entries
   */
  public function getOutage($all = false) {
    $qry = "SELECT start_date, stop_date FROM device_outages " .
      "WHERE device_id=?  AND (start_date > NOW() OR stop_date > NOW())" .
      " ORDER BY start_date";

    if (!$all) {
      $qry .= " LIMIT 1";
    }
    
    $rtn = array();

    try {
      $id = $this->id;
      $stmt = $this->db->prepare($qry);
      $stmt->bindParam(1, $id, PDO::PARAM_INT);
      $stmt->execute();

      while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
	array_push($rtn, array('start' => $r['start_date'],
			       'stop'  => $r['stop_date']));
      }
    } catch (PDOException $e) {
      throw($e);
    }
    return($rtn);
  }

  /**
   * addChild add child relationship
   *
   * @param child_id device id of child to add
   * @throws Exception
   * @return none
   */
  public function addChild($child_id) {
    $qry = "INSERT INTO device_relationships VALUES(?, ?)";

    try {
      $id = $this->id;
      $stmt = $this->db->prepare($qry);
      $stmt->bindParam(1, $id, PDO::PARAM_INT);
      $stmt->bindParam(2, $child_id, PDO::PARAM_INT);      
      $stmt->execute();
    } catch (PDOException $e) {
      throw($e);
    }
    return($rtn);
  }

  /**
   * maxStatus get highest status level of any  monitor on this device
   *
   * @param none
   * @throws Exception
   * @return status status string
   */
  public function maxStatus() {
    $rtn = 'ok';
    $qry = "CALL get_max_status(?)";

    try {
      $id = $this->id;
      $stmt = $this->db->prepare($qry);
      $stmt->bindParam(1, $id, PDO::PARAM_INT);
      $stmt->execute();
      $r = $stmt->fetch(PDO::FETCH_ASSOC);

      if ($r) {
	$rtn = $r['max'];
      }
    } catch (PDOException $e) {
      throw($e);
    }
    return($rtn);
  }
}

?>