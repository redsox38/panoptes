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
 * abstract class for attributes common to all monitorEntry types
 *
 *
 * @version 0.01
 * @author Todd Merritt <redsox38@gmail.com>
 * @project panoptes
 *
 */

abstract class monitorEntry
{
  protected $db;
  protected $monitorTable;
  protected $ackTable;
  protected $data = array();

  /* 
   * getter method
   * @param name property to retrieve
   * @return string value or null
   */
  public function __get($name) {
    if (array_key_exists($name, $this->data)) {
      return($this->data[$name]);
    } else {
      return(null);
    }
  }

  /* 
   * setter method
   * @param name property to set
   * @param val value to set property to
   * @return string value or null
   */  
  public function __set($name, $val) {
    $this->data[$name] = $val;
  }
  
  /**
   * Get/Set db link
   *
   * @param val optional db link to set link to
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
   * Get/Set monitor table
   *
   * @param val optional string to set table name to
   * @throws none
   * @return var current table name
   */
  public function monitorTable($val = null) {
    if (!(is_null($val))) {
      $this->monitorTable = $val;
    }

    return($this->monitorTable);
  }

  /**
   * Get/Set ack table
   *
   * @param val optional string to set table name to
   * @throws Exception
   * @return var current table name
   */
  public function ackTable($val = null) {
    if (!(is_null($val))) {
      $this->ackTable = $val;
    }

    return($this->ackTable);
  }

  /**
   * Get if from last insert
   *
   * @param none
   * @throws PDOException, Exception
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
   * Commit entry into database
   *
   * @param vals array of field names/values
   * @throws PDOException, Exception
   * @return none
   */
  public function _commit($vals) {
    try {
      // insert into device table if not there already
      if (is_null($this->device_id)) {
	// add deviceEntry
	require_once 'deviceEntry.php';
	$dev = new deviceEntry($this->db());
	$dev->srcaddr = $this->srcaddr;
	$dev->commit();
	$this->device_id = $dev->id;
      }

      $cols_string = '(';
      $vals_string = '(';

      foreach ($vals as $k => $v) {
	$cols_string .= $k . ",";
	$vals_string .= "'" . $v . "',";
      }
      // remove trailing ,
      $cols_string = trim($cols_string, ",");
      $vals_string = trim($vals_string, ",");

      $cols_string .= ')';
      $vals_string .= ')';

      $qry = "INSERT INTO " . $this->monitorTable() . " " . $cols_string .
	" VALUES " . $vals_string;
      
      $this->db->exec($qry);
      $this->id = $this->db->lastInsertId();
    } catch (PDOException $e) {
      throw($e);
    } catch (Exception $e) {
      throw($e);
    }
  }

  /**
   * Delete entry from database
   *
   * @param none
   * @throws PDOException
   * @return none
   */
  public function delete() {
    try {
      $stmt = $this->db->prepare("DELETE FROM " . $this->monitorTable() . " WHERE id=?");
      $stmt->bindParam(1, $this->id, PDO::PARAM_INT);
      $stmt->execute();
    } catch (PDOException $e) {
      throw($e);
    }
  }

  /**
   * Disable entry in database
   *
   * @param none
   * @throws PDOException
   * @return none
   */
  public function disable() {
    try {
      $stmt = $this->db->prepare("UPDATE " . $this->monitorTable() . " SET disabled=1 WHERE id=?");
      $stmt->bindParam(1, $this->id, PDO::PARAM_INT);
      $stmt->execute();
    } catch (PDOException $e) {
      throw($e);
    }
  }

  /**
   * Enable entry in database
   *
   * @param none
   * @throws PDOException
   * @return none
   */
  public function enable() {
    try {
      $stmt = $this->db->prepare("UPDATE " . $this->monitorTable() . " SET disabled=0 WHERE id=?");
      $stmt->bindParam(1, $this->id, PDO::PARAM_INT);
      $stmt->execute();
    } catch (PDOException $e) {
      throw($e);
    }
  }  

  /**
   * Ack entry in database
   *
   * @param msg ack message
   * @throws PDOException
   * @return none
   */
  public function ack($msg) {
    global $panoptes_current_user;

    try {
      $stmt = $this->db->prepare("INSERT INTO " . $this->ackTable() . " VALUES(0, ?, ?, NOW(), ?)");
      $stmt->bindParam(1, $this->id, PDO::PARAM_INT);
      $stmt->bindParam(2, $panoptes_current_user);
      $stmt->bindParam(3, $msg);
      $stmt->execute();
    } catch (PDOException $e) {
      throw($e);
    }
  }

  /**
   * get ack entry from datbase
   *
   * @param msg ack message
   * @throws PDOException
   * @return array containing most recent ack info
   */
  public function getAckInfo() {
    
    try {
      $stmt = $this->db->prepare("SELECT * FROM " . $this->ackTable() . 
				 " WHERE monitor_id=? ORDER BY ack_time LIMIT 1");
      $stmt->bindParam(1, $this->id, PDO::PARAM_INT);
      $stmt->execute();

      $r = $stmt->fetch(PDO::FETCH_ASSOC);

      if ($r) {
        $rtn['ack_by'] = $r['ack_user'];
        $rtn['ack_time'] = $r['ack_time'];
        $rtn['ack_msg'] = $r['ack_msg'];
      } else {
        $rtn = array('ack_by'   => '',
                     'ack_time' => '',
                     'ack_msg'  => '');
      }
    } catch (PDOException $e) {
      throw($e);
    }

    return($rtn);
  }
}
?>
