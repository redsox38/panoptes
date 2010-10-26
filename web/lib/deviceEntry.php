<?php
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
   * Get/Set id
   *
   * @param val optional string to set id to
   * @throws none
   * @return string current id
   */
  public function id($val = null) {
    if (!(is_null($val))) {
      $this->id = $val;
    }

    return($this->id);
  }

  /**
   * Get/Set name
   *
   * @param val optional string to set name to
   * @throws none
   * @return string name
   */
  public function name($val = null) {
    if (!(is_null($val))) {
      $this->name = $val;
    }

    return($this->name);
  }

  /**
   * Get/Set address
   *
   * @param val optional string to set address to
   * @throws none
   * @return string name
   */
  public function address($val = null) {
    if (!(is_null($val))) {
      $this->address = $val;
    }

    return($this->address);
  }

}
?>
