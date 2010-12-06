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
   * @throws Exception
   * @return var integer
   */
  public function _last_insert_id() {
    $res = mysql_query("SELECT LAST_INSERT_ID() AS id", $this->db());

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
   * Commit entry into database
   *
   * @param vals array of field names/values
   * @throws Exception
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

      $qry = "INSERT INTO " . $this->monitorTable . " " . $cols_string .
	" VALUES " . $vals_string;
      
      $res = mysql_query($qry, $this->db());
      
      if ($res === false) {
	throw new Exception(mysql_error());
      } else {
	$this->id = $this->_last_insert_id();
      }
    } catch (Exception $e) {
      throw($e);
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
    $res = mysql_query("DELETE FROM " . $this->monitorTable() . " WHERE id='" . 
                       $this->id . "'", $this->db());
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
    $res = mysql_query("UPDATE " . $this->monitorTable() . " SET disabled=1 WHERE id='" .
                       $this->id . "'", $this->db());
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
    $res = mysql_query("UPDATE " . $this->monitorTable() . " SET disabled=0 WHERE id='" .
                       $this->id . "'", $this->db());
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
    global $panoptes_current_user;

    $res = mysql_query("INSERT into " . $this->ackTable() . " VALUES(0, " .
                       $this->id . ",'" . $panoptes_current_user . 
                       "',NOW(),'" . 
                       mysql_real_escape_string($msg) . "')", $this->db());
    if ($res == false) {
      throw new Exception(mysql_error());
    }
  }

  /**
   * get ack entry from datbase
   *
   * @param msg ack message
   * @throws Exception
   * @return array containing most recent ack info
   */
  public function getAckInfo() {
    
    $res = mysql_query("SELECT * FROM " . $this->ackTable() . " WHERE monitor_id=" .
                       $this->id . " ORDER BY ack_time LIMIT 1", $this->db());

    if ($res == false) {
      throw new Exception(mysql_error());
    } else {
      $r = mysql_fetch_assoc($res);

      if ($r) {
        $rtn['ack_by'] = $r['ack_user'];
        $rtn['ack_time'] = $r['ack_time'];
        $rtn['ack_msg'] = $r['ack_msg'];
      } else {
        $rtn = array('ack_by'   => '',
                     'ack_time' => '',
                     'ack_msg'  => '');
      }
      mysql_free_result($res);
    }

    return($rtn);
  }
}
?>
