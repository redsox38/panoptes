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
   * Get/Set db srcaddr
   *
   * @param val optional address to set srcaddr to
   * @throws Exception
   * @return var current srcaddr
   */
  public function srcaddr($val = null) {
    if (!(is_null($val))) {
      $this->srcaddr = $val;
    }

    return($this->srcaddr);
  }

  /**
   * Get/Set db sport
   *
   * @param val optional port to set sport to
   * @throws Exception
   * @return var current sport
   */
  public function sport($val = null) {
    if (!(is_null($val))) {
      $this->sport = $val;
    }

    return($this->sport);
  }

  /**
   * Get/Set db dstaddr
   *
   * @param val optional address to set dstaddr to
   * @throws Exception
   * @return var current dstaddr
   */
  public function dstaddr($val = null) {
    if (!(is_null($val))) {
      $this->dstaddr = $val;
    }

    return($this->dstaddr);
  }

  /**
   * Get/Set db dport
   *
   * @param val optional port to set dport to
   * @throws Exception
   * @return var current dport
   */
  public function dport($val = null) {
    if (!(is_null($val))) {
      $this->dport = $val;
    }

    return($this->dport);
  }

  /**
   * Get/Set db protocol
   *
   * @param val optional string to set protocol to
   * @throws Exception
   * @return var current proto
   */
  public function proto($val = null) {
    if (!(is_null($val))) {
      $this->proto = $val;
    }

    return($this->proto);
  }
}
?>
