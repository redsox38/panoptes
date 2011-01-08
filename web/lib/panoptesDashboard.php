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
 * panoptesDashboard class
 *
 * Main class for interacting with panoptesDashboard objects
 *
 * @version 0.01
 * @author Todd Merritt <redsox38@gmail.com>
 * @project panoptes
 *
 */


class panoptesDashboard
{
  protected $config;
  protected $data = array();
  protected $db;

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

  public function __construct() {
    require_once 'panoptesConfiguration.php';
    $this->config = new panoptesConfiguration();

    $type = $this->config->getConfigValue('db.type');
    $user = $this->config->getConfigValue('db.user');
    $pass = $this->config->getConfigValue('db.password');
    $host = $this->config->getConfigValue('db.host');
    $name = $this->config->getConfigValue('db.name');
    $this->db = new PDO($type . ":host=" . $host . ";dbname=" . $name,
			$user, $pass);
    $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  }
  
  public function __destroy() {
    $this->db = NULL;
  }

}

?>
