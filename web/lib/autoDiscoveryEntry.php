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
require_once 'portMonitorEntry.php';

class autoDiscoveryEntry extends hostEntry
{
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
   * @throws PDOException
   * @return integer 0 on success
   */
  public function ignore() {
    
    try {
      $stmt = $this->db->prepare("UPDATE discovered SET ignored=1 WHERE id=?");
      $stmt->bindParam(1, $this->id, PDO::PARAM_INT);
      $stmt->execute();
    } catch (PDOException $e) {
      throw $e;
    }

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
      $addr = $this->srcaddr;
      $port = $this->sport;
    } else {
      $addr = $this->dstaddr;
      $port = $this->dport;
    }

    try {
      $monitor_ent = new portMonitorEntry($this->db);
      $monitor_ent->srcaddr = $addr;
      $monitor_ent->sport = $port;
      $monitor_ent->proto = $this->proto;
      
      $monitor_ent->commit();
    } catch (Exception $e) {
      throw $e;
    }

    return(0);
  }
}
?>
