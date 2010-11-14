<?php
/**
 * portMonitorEntry class
 *
 * class for interacting with monitor objects
 * and converting discovery objects into monitor objects
 *
 * @version 0.01
 * @author Todd Merritt <redsox38@gmail.com>
 * @project panoptes
 *
 */

require_once 'hostEntry.php';

class portMonitorEntry extends hostEntry
{
  protected $device_id = null;

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
   * @param val optional db link variable to set db link
   * @throws none
   * @return current db link 
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
    // insert into device table if not there already
    if (is_null($this->device_id)) {
      // see if it exists
      $res = mysql_query("SELECT id from devices WHERE address='" .
			 $this->srcaddr . "'", $this->db);

      if ($res !== false) {
	$r = mysql_fetch_assoc($res);
	if (!$r) {
	  mysql_free_result($res);

	  // try to get host name
	  $name = gethostbyaddr($this->srcaddr);

	  // insert new record
	  mysql_query("INSERT INTO devices VALUES(0, '" .
		      $this->srcaddr . "','" . 
		      $name . "')");

	  $res = mysql_query("SELECT id from devices WHERE address='" .
			     $this->srcaddr . "'", $this->db);
	  if ($res !== false) {
	    $r = mysql_fetch_assoc($res);
	    mysql_free_result($res);
	  } else {
	    throw new Exception(mysql_error());
	  }
	}

	$this->device_id = $r['id'];
      } else {
	throw new Exception(mysql_error());
      }
    }
    
    $res = mysql_query("INSERT INTO port_monitors VALUES(0, '" .
		       $this->device_id . "', " . $this->sport . ", '" .
		       $this->proto . "', 15, NOW(), NOW(), 'new', '')", $this->db);

    if ($res === false) {
      throw new Exception(mysql_error());
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
    $res = mysql_query("DELETE FROM port_monitors WHERE id='" . 
		       $this->id . "'");
    if ($res == false) {
      throw new Exception(mysql_error());
    }
  }
}
?>
