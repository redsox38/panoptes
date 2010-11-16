<?php
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
   * @throws Exception
   * @return var integer
   */
  public function _last_insert_id() {
    $res = mysql_query("SELECT LAST_INSERT_ID() AS id", $this->db);

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
}
?>
