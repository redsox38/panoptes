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
 * abstract class for attributes common to monitorEntry 
 * and autoDiscoveryEntry
 *
 *
 * @version 0.01
 * @author Todd Merritt <redsox38@gmail.com>
 * @project panoptes
 *
 */

abstract class hostEntry
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
  
  /**
   * Get/Set db link
   *
   * @param val optional db link to set link to
   * @throws Exception
   * @return var current db link
   */
  public function db($val = null) {
    if (!(is_null($val))) {
      $this->db = $val;
    }

    return($this->db);
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
}
?>
