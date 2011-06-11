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
 * panoptesTemplate class
 *
 * class for interacting with device templates
 *
 * @version 0.01
 * @author Todd Merritt <redsox38@gmail.com>
 * @project panoptes
 *
 */

class panoptesTemplate
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

  /*
   * save
   *
   * @param none
   * @throws Exception
   * @return none
   *
   */
  public function save() {
    try {
      if (is_null($this->name)) {
	throw new Exception("Name is not defined");
      } else if (is_null($this->params)) {
	throw new Exception("Params is not defined");
      }

      $id = $this->id;

      $stmt = $this->db->prepare("INSERT INTO device_templates VALUES(?, ?, ?)");
      $stmt->bindParam(1, $id);
      $stmt->bindParam(2, $this->name);
      $stmt->bindParam(3, json_encode($this->params));
      $stmt->execute();
      
      $this->id = $this->db->lastInsertId();
    } catch (Exception $e) {
      throw($e);
    }
  }

  /*
   * delete
   *
   * @param none
   * @throws Exception
   * @return none
   *
   */
  public function delete() {
    try {
      if (is_null($this->id)) {
	throw new Exception("id is not defined");
      }

      $id = $this->id;
      
      $stmt = $this->db->prepare("DELETE FROM device_templates WHERE id=?");
      $stmt->bindParam(1, $id);
      $stmt->execute();
    } catch (Exception $e) {
      throw($e);
    }
  }
}

?>