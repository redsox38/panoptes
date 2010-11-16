<?php
/**
 * certificateMonitorEntry class
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

class certificateMonitorEntry extends hostEntry
{
  public function __construct($db = null) {
    if (!is_null($db)) {
      $this->db = $db;
    }
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

	  $this->device_id = $this->_last_insert_id();
	}
      } else {
	throw new Exception(mysql_error());
      }
    }
    
    $res = mysql_query("INSERT INTO certificate_monitors VALUES(0, '" .
		       $this->device_id . "', '" .
		       $this->url . "', 1440, NOW(), NOW(), 'new', '', 0)", 
                       $this->db);

    if ($res === false) {
      throw new Exception(mysql_error());
    } else {
      $this->id = $this->_last_insert_id();
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
    $res = mysql_query("DELETE FROM certificate_monitors WHERE id='" . 
		       $this->id . "'");
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
    $res = mysql_query("UPDATE certificate_monitors SET disabled=1 WHERE id='" .
		       $this->id . "'");
    if ($res == false) {
      throw new Exception(mysql_error());
    }
  }
}
?>
