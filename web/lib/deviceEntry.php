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
   * @throws Exception
   * @return none
   */
  public function commit() {
    // try to get host name
    $this->name = gethostbyaddr($this->srcaddr);

    // insert into device table if not there already
    if (is_null($this->id)) {      
      // insert new record
      mysql_query("INSERT INTO devices VALUES(0, '" .
 		  $this->srcaddr . "','" . 
		  $this->name . "')");

      $res = mysql_query("SELECT id from devices WHERE address='" .
			 $this->srcaddr . "'", $this->db);
      if ($res !== false) {
	$r = mysql_fetch_assoc($res);
	$this->id = $r['id'];
	mysql_free_result($res);
      } else {
	throw new Exception(mysql_error());
      }
    } else {
      // update existing entry
      $res = mysql_query("UPDATE devices SET name='" .
			 $this->name . "', address='" .
			 $this->srcaddr . "' WHERE id='" .
			 $this->id . "'");
      if ($res === false) {
	throw new Exception(mysql_error());
      }
    }
  }

  /**
   * Delete device entry
   *
   * @param none
   * @throws Exception
   * @return none
   */
  public function delete() {
    $res = mysql_query("DELETE FROM devices WHERE id='" . $this->id . "'");
    if ($res === false) {
      throw new Exception(mysql_error());
    }
  }

  /**
   * schedule outage window for device
   *
   * @param start date string 'yyyy/mm/dd hh:mm'
   *        stop date string 'yyyy/mm/dd hh:mm'
   * @throws Exception
   * @return none
   */
  public function scheduleOutage($start, $stop) {
    $qry = "INSERT INTO device_outages VALUES(0, '" .
      $this->id . "','" .
      $start . "','" .
      $stop . "')";
    $res = mysql_query($qry);
    if ($res === false) {
      throw new Exception($qry);
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
      "WHERE device_id='" . $this->id . 
      "' AND (start_date > NOW() OR stop_date > NOW())" .
      " ORDER BY start_date";

    if (!$all) {
      $qry .= " LIMIT 1";
    }
    
    $rtn = array();

    $res = mysql_query($qry);
    if ($res !== false) {
      while ($r = mysql_fetch_assoc($res)) {
	array_push($rtn, array('start' => $r['start_date'],
			       'stop'  => $r['stop_date']));
      }
      mysql_free_result($res);
    } else {
      throw new Exception($qry);
    }

    return($rtn);
  }
}
?>
