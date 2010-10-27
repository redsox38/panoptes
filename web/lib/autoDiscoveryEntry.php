<?php
/**
 * autoDiscoveryEntry class
 *
 * class for interacting with autoDiscovery objects
 *
 * @version 0.01
 * @author Todd Merritt <redsox38@gmail.com>
 * @project panoptes
 *
 */

require_once 'hostEntry.php';
require_once 'monitorEntry.php';

class autoDiscoveryEntry extends hostEntry
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
   * ignore this entry by marking it as ignored in the table
   *
   * @param none
   * @throws Exception
   * @return integer 0 on success
   */
  public function ignore() {
    
    $res = mysql_query("UPDATE discovered SET ignored=1 WHERE id=" . 
		       mysql_real_escape_string($this->id, $this->db) . 
		       "", $this->db);
    
    if ($res === false)
      throw new Exception(mysql_error());
    return(0);
  }

  /**
   * monitor this entry by creating a monitor entry object and
   * committing it to the database
   *
   * @param string type should be src or dst depending
   *               on which side of the connection is to be 
   *               monitored.
   * @throws Exception
   * @return integer 0 on success
   */
  public function monitor($type) {

    if ($type == "src") {
      $addr = $this->srcaddr();
      $port = $this->sport();
    } else {
      $addr = $this->dstaddr();
      $port = $this->dport();
    }

    try {
      $monitor_ent = new monitorEntry($this->db);
      $monitor_ent->srcaddr = $addr;
      $monitor_ent->sport = $port;
      $monitor_ent->proto = $this->proto();
      
      $monitor_ent->commit();
    } catch (Exception $e) {
      throw $e;
    }

    return(0);
  }

}
?>
