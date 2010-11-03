<?php
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
   * @throws Exception
   * @return none
   */
  public function commit() {
    // insert into ping_monitors table if not there already
    if (is_null($this->id)) {
      // insert new entry 
      $res = mysql_query("INSERT INTO ping_monitors VALUES(0," .
			 $this->device->id . ",15,0, 0, 'warn', 'pending')");

      if ($res !== false) {
	// go back and select entry to get entry id
	$res = mysql_query("SELECT id FROM ping_monitors WHERE device_id=" .
			   $this->device->id);
	$r = mysql_fetch_assoc($res);
	$this->id = $r['id'];
	mysql_free_result($res);	
      } else {
	throw new Exception(mysql_error());
      }
    }
  }

}
?>
