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

require_once 'monitorEntry.php';

class certificateMonitorEntry extends monitorEntry
{
  public function __construct($db = null) {
    if (!is_null($db)) {
      $this->db = $db;
    }
    $this->monitorTable("certificate_monitors");
    $this->ackTable("certificate_acknowledgments");
    $this->notificationTable("certificate_notifications");
  }
  
 /**
   * Commit entry into database
   *
   * @param none
   * @throws Exception
   * @return none
   */
  public function commit() {
    try {
      $this->_commit(array(
                           'id'             => '0',
                           'device_id'      => $this->device_id,
                           'url'            => $this->url,
                           'check_interval' => '1440',
                           'last_check'     => 'NOW()',
                           'next_check'     => 'NOW()',
                           'status'         => 'new',
                           'status_string'  => '',
                           'disabled'       => '0'
                           ));
    } catch (Exception $e) {
      throw($e);
    }
  }
}
?>
