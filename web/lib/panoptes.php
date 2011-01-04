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
 * panoptes class
 *
 * Main class for interacting with panoptes objects
 *
 * @version 0.01
 * @author Todd Merritt <redsox38@gmail.com>
 * @project panoptes
 *
 */

require_once 'deviceGroup.php';
require_once 'deviceEntry.php';

class panoptes
{
  protected $config;
  protected $data = array();
  protected $_disc_data = null;
  protected $_dev_data = null;
  protected $_dev_group_data = null;
  protected $_sec_group_data = null;
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

  public function getDb() {
    return($this->db);
  }

  /**
   * Retrieve confguration object
   *
   * @param none
   * @throws none
   * @return panoptesConfiguration current configuration object
   */
  public function config() {
    return($this->config);
  }

  /**
   * Compare given user to admin list from config file
   *
   * @param none
   * @throws none
   * @return boolean
   */
  public function isAdmin($user) {
    $admins = explode(',', $this->config()->getConfigValue('web.admins'));
    
    $r = false;

    foreach($admins as $a) {
      if ($a == $user) {
	$r = true;
	break;
      }
    }

    return($r);
  }
  
  /**
   * Return list of available RRDs for a given device
   *
   * @param id id of specific device to retrieve
   *                 rrd info for
   *
   * @throws Exception 
   * @return array
   */
  public function getRRDs($id) {

    try {
      $r = array();

      $dev = $this->getDevice($id);
      
      if ($dev) {
	$rrd_root = $this->config()->getConfigValue('rrd.directory'); 
	$path = $rrd_root . '/' . $dev->address;
	
	// find all rrd files below path
	// stripping off prefix and .rrd extension

	$t = glob($path . '/*/*.rrd');
	foreach ($t as $f) {	
	  $pat = ':' . $path . '/[^/]+/(.*)\.rrd$:';
	  $metric = preg_replace($pat, '\1', $f);
          
	  // get title from xml
	  $xml_file = preg_replace(':(.*)\.rrd$:','\1', $f);
	  $xml_file .= '.xml';

	  require_once 'panoptesConfiguration.php';
	  $rrd_cfg = new panoptesConfiguration($xml_file);
	  $cfg = $rrd_cfg->getConfigArray();
	  if (array_key_exists("title", $cfg)) {
	    $lbl = $cfg['title'];
	  } else {
	    $lbl = $metric;
	  }
	  
	  $r[] = array('metric' => $metric, 'label' => $lbl);
	}
      } else {
	throw new Exception("Device " . $id . " does not exist");
      }
    } catch (Exception $e) {
      throw($e);
    }
    
    return($r);
  }

  /**
   * Parse RRD xml and return information for graphing
   *
   * @param id id of specific device to retrieve
   *                 rrd info for
   *        metric name of the metric to get rrd data from
   *
   * @throws Exception 
   * @return array
   */
  public function getRRDInfo($id, $metric) {

    try {
      $r = array();

      $dev = $this->getDevice($id);
      
      if ($dev) {
	$r['image_file'] = '/tmp/' . $id . '-' . $metric . '.png';

	$rrd_root = $this->config()->getConfigValue('rrd.directory'); 
	
	$monitor_types = array('port_monitors','ping_monitors','snmp_monitors','shell_monitors', 'url_monitors');

	foreach ($monitor_types as $t) {
	  $tmp_rrd = $rrd_root . '/' . $dev->address . '/' . 
	    $t . '/' . $metric . '.rrd';
	  $tmp_xml = $rrd_root . '/' . $dev->address . '/' . 
	    $t . '/' . $metric . '.xml';

	  if (file_exists($tmp_rrd)) {
	    $r['rrd_file'] = $tmp_rrd;
	    $r['xml_file'] = $tmp_xml;
	    break;
	  }
	}

	// parse xml
	require_once 'panoptesConfiguration.php';
	$rrd_cfg = new panoptesConfiguration($r['xml_file']);
	$cfg = $rrd_cfg->getConfigArray();

	// convert xml into options array
	$r['rrd_opts'] = array();
       
	// if there's only one attribute the xml comes back
	// as just an array of values
	// otherwise, it comes back as an array of arrays
	// just make it uniform for ease of processing
	if (array_key_exists("0", $cfg['attribute'])) {
	  $attrs = $cfg['attribute'];
	} else {
	  $attrs = array();
	  array_push($attrs, $cfg['attribute']);
	}

	if (array_key_exists("vertical_label", $cfg)) {
	  array_push($r['rrd_opts'], '--vertical-label=' .
		     $cfg['vertical_label']);
	}

	if (array_key_exists("title", $cfg)) {
	  array_push($r['rrd_opts'], '--title=' .
		     $cfg['title']);
	}

	$defs = array();
	$graphs = array();
	$gprints = array();
	
	foreach ($attrs as $a) {
	  if (array_key_exists("display_as", $a)) {
	    $disp = $a['display_as'];
	    $disp = preg_replace('/:/', '\\:', $disp);
	  } else {
	    $disp = $a['name'];
	  }
	  array_push($defs, 'DEF:' . $a['name'] . '=' . $r['rrd_file'] .
		     ':' . $a['name'] . ':AVERAGE');
	  array_push($graphs, $a['type'] . ':' . $a['name'] . $a['color'] . ':' .
		     $disp);
	  if (array_key_exists("legend", $a)) {
	    array_push($gprints, 'GPRINT:' . $a['name'] . ':' .
		       $a['legend']);
	  }
	}

	// append data definitions
	// graphing definitions
	// gprint params for legend
	foreach ($defs as $v) {
	  array_push($r['rrd_opts'], $v);
	}

	foreach ($graphs as $v) {
	  array_push($r['rrd_opts'], $v);
	}

	foreach ($gprints as $v) {
	  array_push($r['rrd_opts'], $v);
	}
    } else {
	throw new Exception("Device " . $id . " does not exist");
      }
    } catch (Exception $e) {
      throw($e);
    }

    return($r);
  }

  /**
   * usetPermission
   *
   * @param type one or read/write/none
   * @param sec_grp_id security group id
   * @param dev_grp_id device group id
   * @throws PDOException
   * @return none
   */
  public function setPermission($type, $sec_grp_id, $dev_grp_id) {
    if ($type == 'none') {
      $qry = 'DELETE FROM permissions WHERE security_group_id=' .
	$sec_grp_id . ' AND device_group_id=' . $dev_grp_id;
    } else {
      $qry = 'REPLACE INTO permissions VALUES(' . $sec_grp_id . 
	',' . $dev_grp_id . ',"' . $type . '")';
    }

    try {
      $this->db->exec($qry);
    } catch (PDOException $e) {
      throw($e);
    }
  }

  /**
   * Retrieve all users
   *
   * @param none
   * @throws PDOException 
   * @return array of user objects
   */
  public function getAllUsers() {
    require_once 'userEntry.php';

    $rtn = array();

    try {
      $stmt = $this->db->prepare("SELECT * FROM users");
      $stmt->execute();
      
      while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
	$e = new userEntry($this->db);
	$e->id = $r['id'];
	$e->name = $r['name'];
	$e->created_by = $r['created_by'];
	$e->modified = $r['modified'];
	array_push($rtn, $e);
      }
    } catch (PDOException $e) {
      throw($e);
    }

    return($rtn);
  }

  /**
   * Retrieve autoDiscoveryEntry
   *
   * @param id id of specific autoDiscoveryEntry to retrieve
   * @throws PDOException 
   * @return autoDiscoveryEntry returns the next entry, null if there are no 
   *                            entries remaining
   */
  public function getAutoDiscoveryEntry($id = null) {
    require_once 'autoDiscoveryEntry.php';
    $r = null;

    if (!is_null($id)) {
      // update from table
      $this->_disc_data = array();
      try {
	$stmt = $this->db->prepare("SELECT id, srcaddr AS src, srcport AS sport, dstaddr AS dst, dstport AS dport, proto FROM discovered WHERE ignored=0 AND proto='tcp' AND id=?");
	$stmt->bindParam(1, $id, PDO::PARAM_INT);
	$stmt->execute();

	$r = $stmt->fetch(PRO::FETCH_ASSOC);
      } catch (PDOException $e) {
	throw($e);
      }
    } else {
      if (is_null($this->_disc_data)) {
	// update from table
	$this->_disc_data = array();
	try {
	  $stmt = $this->db->prepare("SELECT id, srcaddr AS src, srcport AS sport, dstaddr AS dst, dstport AS dport, proto FROM discovered WHERE ignored=0 AND proto='tcp' GROUP BY dst,dport,proto");
	  $stmt->execute();
	
	  while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
	    array_push($this->_disc_data, $row);
	  }	
	} catch (PDOException $e) {
	  throw($e);
	}
      } 
      
      $r = array_shift($this->_disc_data);
    }

    if ($r) {
      $ent = new autoDiscoveryEntry();
      $ent->db($this->db);
      $ent->id = $r['id'];
      $ent->dstaddr = $r['dst'];
      $ent->dport = $r['dport'];
      $ent->proto = $r['proto'];
    } else {
      $ent = null;
    }      

    return($ent);
  }

  /**
   * Retrieve monitored device entry
   *
   * @param id id of specific deviceEntry to retrieve
   * @throws Exception 
   * @return deviceEntry returns the next entry, null if there are no 
   *                     entries available
   */
  public function getDevice($id = null) {

    $r = null;
    
    if (!is_null($id)) {
      // update from table
      $this->_dev_data = array();
      try {
	$stmt = $this->db->prepare("SELECT * FROM devices WHERE id=?");
	$stmt->bindParam(1, $id, PDO::PARAM_INT);
	$stmt->execute();

	$r = $stmt->fetch(PDO::FETCH_ASSOC);
      } catch (PDOException $e) {
	throw($e);
      }
    } else {
      if (is_null($this->_dev_data)) {
	// update from table
	$this->_dev_data = array();

	try {
	  $stmt = $this->db->prepare("SELECT * FROM devices");
	  $stmt->execute();

	  while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
	    array_push($this->_dev_data, $row);
	  }	
	} catch (PDOException $e) {
	  throw($e);
	}
      } 
      
      $r = array_shift($this->_dev_data);
    }

    if ($r) {
      $dev = new deviceEntry();
      $dev->db($this->db);
      $dev->id = $r['id'];
      $dev->name = $r['name'];
      $dev->address = $r['address'];
      $dev->os_genre = $r['os_genre'];
      $dev->os_detail = $r['os_detail'];
    } else {
      $dev = null;
    }      

    return($dev);
  }

  /**
   * Retrieve list of device group ids 
   * that the given list of security group ids
   * does not have access to
   *
   * @param excl array of security group ids
   *
   * @throws PDOException 
   * @return deviceGroup returns the next entry, null if there are no 
   *                     entries available
   */
  public function getRestrictedDeviceGroups($excl) {
    $groups = array();

    if (is_null($excl)) {
      throw new Exception('No security groups provided');
    }

    $excl_list = implode(",", $excl);

    try {
      $qry = 'SELECT d.id FROM device_groups d, permissions p WHERE p.security_group_id NOT IN (' .
	$excl_list . ') AND p.device_group_id=d.id';

      $stmt = $this->db->prepare($qry);
      $stmt->execute();

      while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
	array_push($groups, $row['id']);
      }
    } catch (PDOException $e) {
      throw($e);
    }

    return($groups);
  }

  /**
   * Retrieve group entry
   *
   * @param id id of specific groupEntry to retrieve
   *        name name of specific group to retrieve
   *
   * @throws Exception 
   * @return deviceGroup returns the next entry, null if there are no 
   *                     entries available
   */
  public function getDeviceGroup($id = null, $name = null) {

    $r = null;
    
    try {
      if (!is_null($id)) {
	// update from table
	$this->_dev_group_data = array();
	
	$stmt = $this->db->prepare("SELECT id, group_name FROM device_groups WHERE id=?");
	$stmt->bindParam(1, $id, PDO::PARAM_INT);
	$stmt->execute();

	$r = $stmt->fetch(PDO::FETCH_ASSOC);
      } else if (!is_null($name)) {
	// update from table
	$this->_dev_group_data = array();

	$stmt = $this->db->prepare("SELECT id, group_name FROM device_groups WHERE group_name=?");
	$stmt->bindParam(1, $name);
	$stmt->execute();

	$r = $stmt->fetch(PDO::FETCH_ASSOC);
      } else {
	if (is_null($this->_dev_group_data)) {
	  // update from table
	  $this->_dev_group_data = array();
	  
	  $stmt = $this->db->prepare("SELECT id, group_name FROM device_groups");
	  $stmt->execute();

	  while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
	    array_push($this->_dev_group_data, $row);
	  }
	} 
	
	$r = array_shift($this->_dev_group_data);
      }
    } catch (PDOException $e) {
      throw($e);
    }

    if (!is_null($r) && !empty($r)) {
      $grp = new deviceGroup();
      $grp->db($this->db);
      $grp->id = $r['id'];
      $grp->name = $r['group_name'];      
    } else {
      $grp = null;
    }      

    return($grp);
  }

  /**
   * Retrieve security group entry
   *
   * @param id id of specific groupEntry to retrieve
   *        name name of specific group to retrieve
   *
   * @throws PDOException 
   * @return securityGroup returns the next entry, null if there are no 
   *                     entries available
   */
  public function getSecurityGroup($id = null, $name = null) {

    $r = null;
    
    try {
      if (!is_null($id)) {
	// update from table
	$this->_sec_group_data = array();
	
	$stmt = $this->db->prepare("SELECT id, group_name FROM security_groups WHERE id=?");
	$stmt->bindParam(1, $id, PDO::PARAM_INT);
	$stmt->execute();

	$r = $stmt->fetch(PDO::FETCH_ASSOC);
      } else if (!is_null($name)) {
	// update from table
	$this->_sec_group_data = array();

	$stmt = $this->db->prepare("SELECT id, group_name FROM security_groups WHERE group_name=?");
	$stmt->bindParam(1, $name);
	$stmt->execute();

	$r = $stmt->fetch(PDO::FETCH_ASSOC);
      } else {
	if (is_null($this->_sec_group_data)) {
	  // update from table
	  $this->_sec_group_data = array();
	  
	  $stmt = $this->db->prepare("SELECT id, group_name FROM security_groups");
	  $stmt->execute();
	  
	  while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
	    array_push($this->_sec_group_data, $row);
	  }
	} 
	
	$r = array_shift($this->_sec_group_data);
      }
    } catch (PDOException $e) {
      throw($e);
    }

    if (!is_null($r) && !empty($r)) {
      require_once 'securityGroup.php';
      $grp = new securityGroup($this->db);
      $grp->id = $r['id'];
      $grp->name = $r['group_name'];      
    } else {
      $grp = null;
    }      

    return($grp);
  }

  /**
   * Retrieve snmp monitior entries
   *
   * @param id id of specific device to retrieve
   *                 snmp monitor data for
   * @param ent_id optional specific entry to retrieve
   *
   * @throws PDOException 
   * @return array of SNMPMonitorEntry objects
   */
  public function getSNMPMonitorData($id, $ent_id = null) {
    require_once 'SNMPMonitorEntry.php';
    $rtndata = array();

    try {
      $qry = "SELECT * FROM snmp_monitors WHERE device_id=?";
      if (!is_null($ent_id)) {
	$qry .= " AND id=?";
      }

      $stmt = $this->db->prepare($qry);
      $stmt->bindParam(1, $id, PDO::PARAM_INT);

      if (!is_null($ent_id)) {
	$stmt->bindParam(2, $ent_id, PDO::PARAM_INT);
      }

      $stmt->execute();

      while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
	$ent = new SNMPMonitorEntry($this->db);
	$ent->id = $r['id'];
	$ent->device_id = $id;
	$ent->name = $r['name'];
	$ent->community = $r['community'];
	$ent->oid_array = explode(',', $r['oid']);
	$ent->oid_string = implode("\n", $ent->oid_array);
	$ent->last_check = $r['last_check'];
	$ent->next_check = $r['next_check'];
	$ent->status = $r['status'];
	$ent->status_string = $r['status_string'];
	$ent->disabled = $r['disabled'];
	array_push($rtndata, $ent);
      }
    } catch (PDOException $e) {
      throw($e);
    }

    return($rtndata);
  }

  /**
   * Retrieve monitior entries
   *
   * @param id id of specific device to retrieve
   *                 monitor data for
   * @param ent_id optional specific entry to retrieve
   *
   * @throws Exception 
   * @return array of shellMonitorEntry objects
   */
  public function getShellMonitorData($id, $ent_id = null) {
    require_once 'shellMonitorEntry.php';
    $rtndata = array();

    try {
      $qry = "SELECT * FROM shell_monitors WHERE device_id=?";

      if (!is_null($ent_id)) {
	$qry .= " AND id=?";
      }

      $stmt = $this->db->prepare($qry);
      $stmt->bindParam(1, $id, PDO::PARAM_INT);

      if (!is_null($ent_id)) {
	$stmt->bindParam(2, $ent_id, PDO::PARAM_INT);
      }
      $stmt->execute();

      while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
	$ent = new shellMonitorEntry($this->db);
	$ent->id = $r['id'];
	$ent->device_id = $id;
	$ent->script = $r['script'];
	$ent->params = $r['params'];
	$ent->last_check = $r['last_check'];
	$ent->next_check = $r['next_check'];
	$ent->status = $r['status'];
	$ent->status_string = $r['status_string'];
	$ent->disabled = $r['disabled'];
	
	array_push($rtndata, $ent);
      }
    } catch (PDOException $e) {
      throw($e);
    }

    return($rtndata);
  }

  /**
   * Retrieve monitior entries
   *
   * @param id id of specific device to retrieve
   *                 monitor data for
   *
   * @throws PDOException 
   * @return array of portMonitorEntry objects
   */
  public function getPortMonitorData($id, $ent_id = null) {
    $rtndata = array();

    try {
      $qry = "SELECT * FROM port_monitors WHERE device_id=?";
      if (!is_null($ent_id)) {
	$qry .= " AND id=?";
      }
      $stmt = $this->db->prepare($qry);

      $stmt->bindParam(1, $id, PDO::PARAM_INT);
      
      if (!is_null($ent_id)) {
	$stmt->bindParam(2, $ent_id, PDO::PARAM_INT);
      }
      $stmt->execute();

      while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
	$ent = new portMonitorEntry($this->db);
	$ent->id = $r['id'];
	$ent->device_id = $id;
	$ent->port = $r['port'];
	$ent->last_check = $r['last_check'];
	$ent->next_check = $r['next_check'];
	$ent->proto = $r['proto'];
	$ent->status = $r['status'];
	$ent->status_string = $r['status_string'];
	$ent->disabled = $r['disabled'];
	array_push($rtndata, $ent);
      }
    } catch (PDOException $e) {
      throw($e);
    }

    return($rtndata);
  }

  /**
   * Retrieve icmp monitior entry
   *
   * @param id id of specific device to retrieve
   *                 monitor data for
   *
   * @throws PDOException 
   * @return pingEntry object
   */
  public function getPingMonitorData($id) {    
    require_once 'pingEntry.php';
    $ent = false;

    try {
      $stmt = $this->db->prepare("SELECT * FROM ping_monitors WHERE device_id=?");
      $stmt->bindParam(1, $id, PDO::PARAM_INT);
      $stmt->execute();

      $r = $stmt->fetch(PDO::FETCH_ASSOC);
      
      if ($r) {
	$ent = new pingEntry($this->db);
	$ent->id = $r['id'];
	$ent->device_id = $id;
	$ent->last_check = $r['last_check'];
	$ent->next_check = $r['next_check'];
	$ent->status = $r['status'];
	$ent->status_string = $r['status_string'];
	$ent->disabled = $r['disabled'];
      }
    } catch (PDOException $e) {
      throw($e);
    }

    return($ent);
  }

  /**
   * Retrieve certificate monitior entries
   *
   * @param id id of specific device to retrieve
   *                 certificate monitor data for
   *
   * @throws Exception 
   * @return array of certificateMonitorEntry objects
   */
  public function getCertificateMonitorData($id) {
    global $panoptes_current_user;

    require_once 'certificateMonitorEntry.php';
    $rtndata = array();

    try {
      $stmt = $this->db->prepare("SELECT * FROM certificate_monitors WHERE device_id=?");
      $stmt->bindParam(1, $id, PDO::PARAM_INT);
      $stmt->execute();

      while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
	$ent = new certificateMonitorEntry($this->db);
	$ent->id = $r['id'];
	$ent->device_id = $id;
	$ent->last_check = $r['last_check'];
	$ent->next_check = $r['next_check'];
	$ent->url = $r['url'];
	$ent->status = $r['status'];
	$ent->status_string = $r['status_string'];
	$ent->disabled = $r['disabled'];
	array_push($rtndata, $ent);
      }
    } catch (PDOException $e) {
      throw($e);
    }

    return($rtndata);
  }

  /**
   * Retrieve url monitior entries
   *
   * @param id id of specific device to retrieve
   *                 url monitor data for
   *
   * @throws Exception 
   * @return array of urlMonitorEntry objects
   */
  public function getUrlMonitorData($id) {
    global $panoptes_current_user;

    require_once 'urlMonitorEntry.php';
    $rtndata = array();

    try {
      $stmt = $this->db->prepare("SELECT * FROM url_monitors WHERE device_id=?");
      $stmt->bindParam(1, $id, PDO::PARAM_INT);
      $stmt->execute();

      while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
	$ent = new urlMonitorEntry($this->db);
	$ent->id = $r['id'];
	$ent->device_id = $id;
	$ent->last_check = $r['last_check'];
	$ent->next_check = $r['next_check'];
	$ent->url = $r['url'];
	$ent->expect_http_status = $r['expect_http_status'];
	$ent->expect_http_content = $r['expect_http_content'];
	$ent->status = $r['status'];
	$ent->status_string = $r['status_string'];
	$ent->disabled = $r['disabled'];
	array_push($rtndata, $ent);
      }
    } catch (PDOException $e) {
      throw($e);
    }

    return($rtndata);
  }

  /**
   * ignore auto discovery entries for ajax request
   *
   * @param args json params converted into an array
   *             id key contains an array of ids to ignore
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_ignoreAutoDiscoveryEntry($args) {

    try {
      foreach ($args['id'] as $v) {
	$ent = $this->getAutoDiscoveryEntry($v);
	$ent->ignore();
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => 'success'));
  }

  /**
   * retrieve current auto discovery entries
   *
   * @param args json params converted into an array
   *             optional count key contains the number of
   *             items requested to be returned
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_populateAutoDiscoveryForm($args) {
    $data = array();

    if (array_key_exists("count", $args)) {
      $max = $args['count'];
    } else {
      $max = $this->config()->getConfigValue('autodiscoveryform.displayentries'); 
    }

    try {
      for ($i = 0; $i < $max; $i++) {
	$ent = $this->getAutoDiscoveryEntry();
	if (is_null($ent)) {
	  break;
	}
	
	array_push($data, array('id' => $ent->id,
				'dstaddr' => $ent->dstaddr,
				'dport'   => $ent->dport,
				'proto'   => $ent->proto));
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }
  
  /**
   * monitor auto discovery entries
   *
   * @param args json params converted into an array
   *             id key contains the ids of the  
   *             auto discovery entries to be monitored
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_monitorAutoDiscoveryEntry($args) {
    try {
      foreach ($args['id'] as $v) {
	$ent = $this->getAutoDiscoveryEntry($v);      
	$ent->monitor($args['type']);
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success'));
  }

  /**
   * get list of devices and groups 
   *
   * @param args json params converted into an array
   *             currently ignored.
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getDeviceList($args) {
    global $panoptes_current_user;

    $data = array();
    $list = array();

    // get group data
    $grouped = array();    
    $ungrouped_children = array();

    try {
      while ($grp = $this->getDeviceGroup()) {
	
	$chld = array();
	foreach ($grp->children() as $c) {
	  $chld[] = array('_reference' => 'd_' . $c);
	  $grouped[$c] = 1;
	}
	$list[] = array('name'     => $grp->name,
			'type'     => 'group',
			'children' => $chld,
			'id'       => 'g_' . $grp->id);
      }

      // get individual devices 
      // put devices that are not already in a group
      // in the ungrouped group for display
      // purposes
      while($dev = $this->getDevice()) {
	$list[] = array('name' => $dev->name,
			'type' => 'device',
			'id'   => 'd_' . $dev->id);
	if (!array_key_exists($dev->id, $grouped)) {
	  $ungrouped_children[] = array('_reference' => 'd_' . $dev->id);
	}
      }
      
      $list[] = array('name'     => 'ungrouped',
		      'type'     => 'group',
		      'children' => $ungrouped_children,
		      'id'       => 'g_0');

      // go back and remove device groups that none of this users security groups
      // have permission on (excluding ungrouped devices)
      require_once 'userEntry.php';
      $user = new userEntry();
      $user->db = $this->db;
      $user->getByName($panoptes_current_user);
      $sec_groups = $user->getGroups();

      // get device groups to exclude
      $excl_groups = $this->getRestrictedDeviceGroups($sec_groups);

      // remove those groups
      foreach ($excl_groups as $e) {
	$gid = 'g_' . $e;
	$ct = count($list);
	for ($i = 0; $i < $ct; $i++) {	 
	  if ($list[$i]['id'] == $gid) {
	    unset($list[$i]);
	    $i = $ct;
	  }
	}
      }

      // build data array
      foreach ($list as $k => $v) {
	array_push($data, $v);
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * get device groups
   *
   * @param args json params converted into an array
   *             currently not used
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getDeviceGroups($args) {
    try {
      $data = array();

      while ($grp = $this->getDeviceGroup()) {
	array_push($data, array('name' => $grp->name,
				'id'   => $grp->id));
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * get device groups
   *
   * @param args json params converted into an array
   *             id is the id of the group to remove
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_deleteDeviceGroup($args) {
    try {
      $grp = $this->getDeviceGroup($args['id']);
      if ($grp) { 
	$grp->delete();
      } else {
	return(array('result' => 'failure',
		     'error'  => 'device group ' . $args['id'] . ' does not exist'));
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => array()));
  }
  
  /**
   * get security groups
   *
   * @param args json params converted into an array
   *             currently not used
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getSecurityGroups($args) {
    try {
      $data = array();

      while ($grp = $this->getSecurityGroup()) {
	$members = array();
	$mem = $grp->children();
	foreach ($mem as $m) {
	  array_push($members, array('_reference' => 'u_' . $m));
	}
	array_push($data, array('name'     => $grp->name,
				'type'     => 'group',
				'children' => $members,
				'id'       => 'g_' . $grp->id));
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * add group member
   *
   * add member id to group, creating group if it doesn't already exist
   *
   * @param args json params converted into an array
   *             id device id to add to group
   *             name name of group to add
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_addGroupMember($args) {
    $data = array();

    try {
      $grp = $this->getDeviceGroup(null, $args['name']);
  
      if (is_null($grp)) {
	// add new group entry
	$grp = new deviceGroup();
	$grp->db($this->db);
	$grp->id = 0;
	$grp->name = $args['name'];      
	$grp->commit();
	$data['id'] = $grp->id;
	$data['name'] = $grp->name;
      }

      // add member to group
      $grp->addMember($args['id']);
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * remove group member
   *
   * add member id to group, creating group if it doesn't already exist
   *
   * @param args json params converted into an array
   *             group_id group id to emove device from
   *             device_id device to rm
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_removeGroupMember($args) {
    try {
      $grp = $this->getDeviceGroup($args['group_id']);
  
      if (is_null($grp)) {
	return(array('result' => 'failure',
		     'error'  => 'group ' . $args['group_id'] . ' does not exist'));
      }

      // add member to group
      $grp->removeMember($args['device_id']);
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success'));
  }

  /**
   * add security group member
   *
   * add member id to group, creating group if it doesn't already exist
   *
   * @param args json params converted into an array
   *             user_id user id to add (numeric database id)
   *             group_id group id to add to
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_addSecurityGroupMember($args) {
    try {

      $grp = $this->getSecurityGroup($args['group_id'], null);
  
      if (is_null($grp)) {
	return(array('result' => 'failure',
		     'error'  => "group " . $args['group_id'] . " does not exist"));
      }

      // add member to group
      $grp->addMember($args['user_id']);
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success'));
  }

  /**
   * delete security group member
   *
   * add member id to group, creating group if it doesn't already exist
   *
   * @param args json params converted into an array
   *             user_id user id to remove (numeric database id)
   *             group_id group id to remove from
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_deleteSecurityGroupMember($args) {
    try {

      $grp = $this->getSecurityGroup($args['group_id'], null);
  
      if (is_null($grp)) {
	return(array('result' => 'failure',
		     'error'  => "group " . $args['group_id'] . " does not exist"));
      }

      // remove member from group
      $grp->deleteMember($args['user_id']);
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success'));
  }

  /**
   * get device info
   *
   * return information about given device id
   *
   * @param args json params converted into an array
   *             id device id to get data for
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getDeviceInfo($args) {
    try {
      $dev = $this->getDevice($args['id']);
      if ($dev) {
	$data = array('name'      => $dev->name,
		      'type'      => 'device',
		      'os_type'   => $dev->os_genre,
		      'os_detail' => $dev->os_detail,
		      'address'   => $dev->address,
		      'id'        => $args['id']);

	// get worst status string for color codifying tab
	$data['max_status'] = $dev->maxStatus();

	// get ping data if there is any
	$ent = $this->getPingMonitorData($args['id']);
	if ($ent) {
	  $data['ping_data'] = $ent->status_string;
	}
	
	// see if there's a future/current outage scheduled
	$out = $dev->getOutage();
	
	if (!empty($out)) {
	  $o = $out[0];
	  $data['outage_data'] = $o['start'] . " to " .
	    $o['stop'];
	}
      } else {
	$data = array();
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * get availability monitor entry
   *
   * return monitor information for given device id
   *        and entry id
   *
   * @param args json params converted into an array
   *             device_id device id to get data for
   *             entry_id entry to get data for
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getSNMPMonitorEntry($args) {
    global $panoptes_current_user;
    try {
      require_once 'userEntry.php';
      $user = new userEntry();
      $user->db = $this->db;
      $user->getByName($panoptes_current_user);

      $rst = $this->getSNMPMonitorData($args['device_id'], $args['entry_id']);
      $a = $rst[0];
      $ack = $a->getAckInfo();
      $data = array (
		     'id'            => $a->id,
		     'device_id'     => $a->device_id,
		     'name'          => $a->name,
		     'community'     => $a->community,
		     'oid'           => $a->oid_string,
		     'oids'          => $a->oid_array,
		     'last_check'    => $a->last_check,
		     'next_check'    => $a->next_check,
		     'ack_by'        => $ack['ack_by'],
		     'ack_msg'       => $ack['ack_msg'],
		     'status'        => $a->status,
		     'status_string' => $a->status_string,
		     'metric'        => $a->name,
		     'disabled'      => $a->disabled,
		     'notify'        => $a->getNotification($user->id)
		     );
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * get snmp monitor data
   *
   * return snmp monitor information for given device id
   *
   * @param args json params converted into an array
   *             id device id to get data for
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getSNMPMonitorData($args) {
    global $panoptes_current_user;
    $data = array();
    
    try {
      require_once 'userEntry.php';
      $user = new userEntry();
      $user->db = $this->db;
      $user->getByName($panoptes_current_user);

      $rst = $this->getSNMPMonitorData($args['id']);
      foreach ($rst as $a) {
	$ack = $a->getAckInfo();
	array_push($data, array (
				 'id'            => $a->id,
				 'device_id'     => $a->device_id,
				 'name'          => $a->name,
				 'community'     => $a->community,
				 'oid'           => $a->oid_string,
				 'oids'          => $a->oid_array,
				 'last_check'    => $a->last_check,
				 'next_check'    => $a->next_check,
				 'ack_by'        => $ack['ack_by'],
				 'ack_msg'       => $ack['ack_msg'],
				 'status'        => $a->status,
				 'status_string' => $a->status_string,
				 'metric'        => $a->name,
				 'disabled'      => $a->disabled,
				 'notify'        => $a->getNotification($user->id)
				 ));
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * get availability monitor entry
   *
   * return monitor information for given device id
   *        and entry id
   *
   * @param args json params converted into an array
   *             device_id device id to get data for
   *             entry_id entry to get data for
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getPortMonitorEntry($args) {
    global $panoptes_current_user;

    try {
      require_once 'userEntry.php';
      $user = new userEntry();
      $user->db = $this->db;
      $user->getByName($panoptes_current_user);

      $rst = $this->getPortMonitorData($args['device_id'], $args['entry_id']);
      $a = $rst[0];
      $ack = $a->getAckInfo();
      $data = array (
		     'id'            => $a->id,
		     'device_id'     => $a->device_id,
		     'port'          => $a->port,
		     'proto'         => $a->proto,
		     'last_check'    => $a->last_check,
		     'next_check'    => $a->next_check,
		     'status'        => $a->status,
		     'status_string' => $a->status_string,
		     'ack_by'        => $ack['ack_by'],
		     'ack_msg'       => $ack['ack_msg'],
		     'metric'        => $a->proto . '-' . $a->port,
		     'disabled'      => $a->disabled,
		     'notify'        => $a->getNotification($user->id)
		     );
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * get availability monitor data
   *
   * return monitor information for given device id
   *
   * @param args json params converted into an array
   *             id device id to get data for
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getPortMonitorData($args) {
    global $panoptes_current_user;
    $data = array();
    
    try {
      require_once 'userEntry.php';
      $user = new userEntry();
      $user->db = $this->db;
      $user->getByName($panoptes_current_user);

      $rst = $this->getPortMonitorData($args['id']);
      foreach ($rst as $a) {
	$ack = $a->getAckInfo();
	array_push($data, array (
				 'id'            => $a->id,
				 'device_id'     => $a->device_id,
				 'port'          => $a->port,
				 'proto'         => $a->proto,
				 'last_check'    => $a->last_check,
				 'next_check'    => $a->next_check,
				 'status'        => $a->status,
				 'ack_by'        => $ack['ack_by'],
				 'ack_msg'       => $ack['ack_msg'],
				 'status_string' => $a->status_string,
				 'metric'        => $a->proto . '-' . $a->port,
				 'disabled'      => $a->disabled,
				 'notify'        => $a->getNotification($user->id)
				 ));
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
                  'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * add new pingable device
   *
   * adds new pingable device and returns information needed to
   * add it to the deviceTree
   *
   * @param args json params converted into an array
   *             id device id to get data for
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_addPingMonitor($args) {
    $data = array();

    try {
      $dev = new deviceEntry();
      $dev->db($this->db);
      $dev->srcaddr = $args['address'];
      $dev->os_genre = 'unknown';
      $dev->os_detail = 'unknown';
      $dev->commit();

      $data['id'] = 'd_' . $dev->id;
      $data['type'] = 'device';
      $data['name'] = $dev->name;

      // add ping monitor 
      require_once 'pingEntry.php';
      $pm = new pingEntry();
      $pm->db($this->db);
      $pm->device = $dev;
      $pm->commit();
    } catch (Exception $e) {
      return(array('result' => 'failure',
                  'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * get available RRDs for a given device
   *
   * @param args json params converted into an array
   *             id device id to get data for
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getRRDs($args) {
    $data = array();

    try {
      $data = $this->getRRDs($args['id']);
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * delete device
   *
   * @param args json params converted into an array
   *             id device id to get data for
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_deleteDevice($args) {
    try {
      // get device object and call delete
      $dev = $this->getDevice($args['id']);

      if ($dev) {
	$dev->delete();
      } else {
	throw new Exception("Device " . $id . " does not exist");
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success'));
  }

  /**
   * get certificate monitor data
   *
   * return monitor information for given device id
   *
   * @param args json params converted into an array
   *             id device id to get data for
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getCertificateMonitorData($args) {
    global $panoptes_current_user;
    $data = array();
    
    try {
      require_once 'userEntry.php';
      $user = new userEntry();
      $user->db = $this->db;
      $user->getByName($panoptes_current_user);

      $rst = $this->getCertificateMonitorData($args['id']);
      foreach ($rst as $a) {
	$ack = $a->getAckInfo();
	array_push($data, array (
				 'id'            => $a->id,
				 'device_id'     => $a->device_id,
				 'url'           => $a->url,
				 'last_check'    => $a->last_check,
				 'next_check'    => $a->next_check,
				 'ack_by'        => $ack['ack_by'],
				 'ack_msg'       => $ack['ack_msg'],
				 'status'        => $a->status,
				 'status_string' => $a->status_string,
				 'disabled'      => $a->disabled,
				 'notify'        => $a->getNotification($user->id)
				 ));
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
                  'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * get url monitor data
   *
   * return monitor information for given device id
   *
   * @param args json params converted into an array
   *             id device id to get data for
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getUrlMonitorData($args) {
    global $panoptes_current_user;
    $data = array();
    
    try {
      require_once 'userEntry.php';
      $user = new userEntry();
      $user->db = $this->db;
      $user->getByName($panoptes_current_user);

      $rst = $this->getUrlMonitorData($args['id']);
      foreach ($rst as $a) {
	$ack = $a->getAckInfo();
	array_push($data, array (
				 'id'                  => $a->id,
				 'device_id'           => $a->device_id,
				 'url'                 => $a->url,
				 'expect_http_status'  => $a->expect_http_status,
				 'expect_http_content' => $a->expect_http_content,
				 'last_check'          => $a->last_check,
				 'next_check'          => $a->next_check,
				 'ack_by'              => $ack['ack_by'],
				 'ack_msg'             => $ack['ack_msg'],
				 'status'              => $a->status,
				 'status_string'       => $a->status_string,
				 'disabled'            => $a->disabled,
				 'notify'              => $a->getNotification($user->id)
				 ));
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
                  'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * delete monitor entries
   *
   * @param args json params converted into an array
   *             id key contains an array of ids to remove
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_deleteMonitorEntry($args) {

    try {
      // table is based on type argument
      if ($args['type'] == 'port_monitors') {
	require_once 'portMonitorEntry.php';
	foreach ($args['id'] as $v) {	  
	  $ent = new portMonitorEntry($this->db);
	  $ent->id = $v;
	  $ent->delete();
	}
      } elseif ($args['type'] == 'certificate_monitors') {
	require_once 'certificateMonitorEntry.php';
	foreach ($args['id'] as $v) {	  
	  $ent = new certificateMonitorEntry($this->db);
	  $ent->id = $v;
	  $ent->delete();
	}
      } elseif ($args['type'] == 'snmp_monitors') {
	foreach ($args['id'] as $v) {	  
	  require_once 'SNMPMonitorEntry.php';
	  $ent = new SNMPMonitorEntry($this->db);
	  $ent->id = $v;
	  $ent->delete();
	}
      } elseif ($args['type'] == 'shell_monitors') {
	foreach ($args['id'] as $v) {	  
	  require_once 'shellMonitorEntry.php';
	  $ent = new shellMonitorEntry($this->db);
	  $ent->id = $v;
	  $ent->delete();
	}
      } elseif ($args['type'] == 'url_monitors') {
	foreach ($args['id'] as $v) {	  
	  require_once 'urlMonitorEntry.php';
	  $ent = new urlMonitorEntry($this->db);
	  $ent->id = $v;
	  $ent->delete();
	}
      } else {
	return(array('result' => 'failure',
		     'error'  => 'unknown type: ' . $args['type']));	
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => 'success'));
  }

  /**
   * disable monitor entries
   *
   * @param args json params converted into an array
   *             id key contains an array of ids to remove
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_disableMonitorEntry($args) {

    try {
      // table is based on type argument
      $flag = strcmp($args['status'], 'disable');

      if ($args['type'] == 'port_monitors') {
	require_once 'portMonitorEntry.php';
	foreach ($args['id'] as $v) {	  
	  $ent = new portMonitorEntry($this->db);
	  $ent->id = $v;
	  if ($flag) {
	    $ent->enable();
	  } else {
	    $ent->disable();
	  }
	}
      } elseif ($args['type'] == 'certificate_monitors') {
	require_once 'certificateMonitorEntry.php';
	foreach ($args['id'] as $v) {	  
	  $ent = new certificateMonitorEntry($this->db);
	  $ent->id = $v;
	  if ($flag) {
	    $ent->enable();
	  } else {
	    $ent->disable();
	  }
	}
      } elseif ($args['type'] == 'snmp_monitors') {
	require_once 'SNMPMonitorEntry.php';
	foreach ($args['id'] as $v) {	  
	  $ent = new SNMPMonitorEntry($this->db);
	  $ent->id = $v;
	  if ($flag) {
	    $ent->enable();
	  } else {
	    $ent->disable();
	  }
	}
      } elseif ($args['type'] == 'shell_monitors') {
	require_once 'shellMonitorEntry.php';
	foreach ($args['id'] as $v) {	  
	  $ent = new shellMonitorEntry($this->db);
	  $ent->id = $v;
	  if ($flag) {
	    $ent->enable();
	  } else {
	    $ent->disable();
	  }
	}
      } elseif ($args['type'] == 'url_monitors') {
	require_once 'urlMonitorEntry.php';
	foreach ($args['id'] as $v) {	  
	  $ent = new urlMonitorEntry($this->db);
	  $ent->id = $v;
	  if ($flag) {
	    $ent->enable();
	  } else {
	    $ent->disable();
	  }
	}
      } else {
	return(array('result' => 'failure',
		     'error'  => 'unknown type: ' . $args['type']));	
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => 'success'));
  }

  /**
   * add monitor entry
   *
   * @param args json params converted into an array
   *             
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_addMonitorEntry($args) {
    try {
      $data = array();
      // table is based on type argument
      if ($args['params']['type'] == 'port_monitors') {
	require_once 'portMonitorEntry.php';
	$ent = new portMonitorEntry($this->db);
	$ent->device_id = $args['id'];
	$ent->sport = $args['params']['port'];
	$ent->proto = $args['params']['proto'];
	$ent->commit();

	array_push($data, array (
				 'id'            => $ent->id,
				 'device_id'     => $ent->device_id,
				 'port'          => $ent->sport,
				 'proto'         => $ent->proto,
				 'last_check'    => '0000-00-00 00:00:00',
				 'next_check'    => '0000-00-00 00:00:00',
				 'status'        => 'new',
				 'status_string' => '',
				 'metric'        => $ent->proto . '-' .
				 $ent->sport
				 ));
      } else if ($args['params']['type'] == 'certificate_monitors') {
	require_once 'certificateMonitorEntry.php';
	$ent = new certificateMonitorEntry($this->db);
	$ent->device_id = $args['id'];
	$ent->url = $args['params']['url'];
	$ent->commit();

	array_push($data, array (
				 'id'            => $ent->id,
				 'device_id'     => $ent->device_id,
				 'url'           => $ent->url,
				 'last_check'    => '0000-00-00 00:00:00',
				 'next_check'    => '0000-00-00 00:00:00',
				 'status'        => 'new',
				 'status_string' => ''
				 ));
      } else if ($args['params']['type'] == 'snmp_monitors') {
	require_once 'SNMPMonitorEntry.php';
	$ent = new SNMPMonitorEntry($this->db);
	$ent->device_id = $args['id'];
	$ent->name = $args['params']['name'];
	$ent->community = $args['params']['community'];
	$ent->oid_string = implode("\n", $args['params']['oids']);
	$ent->oid_array = $args['params']['oids'];
	$ent->commit();

	array_push($data, array (
				 'id'            => $ent->id,
				 'device_id'     => $ent->device_id,
				 'name'          => $ent->name,
				 'community'     => $ent->community,
				 'oid'           => $ent->oid_string,
				 'last_check'    => '0000-00-00 00:00:00',
				 'next_check'    => '0000-00-00 00:00:00',
				 'status'        => 'new',
				 'status_string' => ''
				 ));
      } else if ($args['params']['type'] == 'shell_monitors') {
	require_once 'shellMonitorEntry.php';
	$ent = new shellMonitorEntry($this->db);
	$ent->device_id = $args['id'];
	$ent->script = $args['params']['script'];
	$ent->params = base64_decode($args['params']['params']);
	$ent->commit();

	array_push($data, array (
				 'id'            => $ent->id,
				 'device_id'     => $ent->device_id,
				 'script'        => $ent->script,
				 'params'        => $ent->params,
				 'last_check'    => '0000-00-00 00:00:00',
				 'next_check'    => '0000-00-00 00:00:00',
				 'status'        => 'new',
				 'status_string' => ''
				 ));
      } else if ($args['params']['type'] == 'url_monitors') {
	require_once 'urlMonitorEntry.php';
	$ent = new urlMonitorEntry($this->db);
	$ent->device_id = $args['id'];
	$ent->url = $args['params']['url'];
	$ent->expect_http_status = $args['params']['expect_http_status'];
	$ent->expect_http_content = $args['params']['expect_http_content'];
	$ent->commit();

	array_push($data, array (
				 'id'                  => $ent->id,
				 'device_id'           => $ent->device_id,
				 'url'                 => $ent->url,
				 'expect_http_status'  => $ent->expect_http_status,
				 'expect_http_content' => $ent->expect_http_content,
				 'last_check'          => '0000-00-00 00:00:00',
				 'next_check'          => '0000-00-00 00:00:00',
				 'status'              => 'new',
				 'status_string'       => ''
				 ));
      } else {
	return(array('result' => 'failure',
		     'error'  => 'unknown type: ' . $args['params']['type']));	
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * reschedule
   *
   * @param args json params converted into an array
   *             
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_rescheduleMonitorEntry($args) {
    try {
      $data = array();

      $new_tm = $args['params']['date'];
      $new_tm = preg_replace('/(\d+)\/(\d+)\/(\d+)/', '\3-\1-\2', $new_tm);
      $new_tm .= ' ' . $args['params']['time'] . ':00';

      $data['time'] = $new_tm;

      foreach ($args['monitor_ids'] as $v) {	  
	// table is based on type argument
	if ($args['params']['type'] == 'port_monitors') {
	  require_once 'portMonitorEntry.php';
	  $ent = new portMonitorEntry($this->db);
	} else if ($args['params']['type'] == 'certificate_monitors') {
	  require_once 'certificateMonitorEntry.php';
	  $ent = new certificateMonitorEntry($this->db);
	} else if ($args['params']['type'] == 'snmp_monitors') {
	  require_once 'SNMPMonitorEntry.php';
	  $ent = new SNMPMonitorEntry($this->db);
	} else if ($args['params']['type'] == 'shell_monitors') {
	  require_once 'shellMonitorEntry.php';
	  $ent = new shellMonitorEntry($this->db);
	} else if ($args['params']['type'] == 'url_monitors') {
	  require_once 'urlMonitorEntry.php';
	  $ent = new urlMonitorEntry($this->db);
	} else {
	  return(array('result' => 'failure',
		       'error'  => 'unknown type: ' . $args['params']['type']));	
	}
	
	$ent->id = $v;
	$ent->reschedule($new_tm);
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }
	
  /**
   * ack monitor entry
   *
   * @param args json params converted into an array
   *             id contains an array of ids
   *             type contains the table name
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_ackMonitorEntry($args) {
    try {
      $data = array();
      // table is based on type argument
      foreach ($args['id'] as $v) {	  
	if ($args['type'] == 'port_monitors') {
	  require_once 'portMonitorEntry.php';
	  $ent = new portMonitorEntry($this->db);
	} else if ($args['type'] == 'certificate_monitors') {
	  require_once 'certificateMonitorEntry.php';
	  $ent = new certificateMonitorEntry($this->db);
	} else if ($args['type'] == 'snmp_monitors') {
	  require_once 'SNMPMonitorEntry.php';
	  $ent = new SNMPMonitorEntry($this->db);
	} else if ($args['type'] == 'shell_monitors') {
	  require_once 'shellMonitorEntry.php';
	  $ent = new shellMonitorEntry($this->db);
	} else if ($args['type'] == 'url_monitors') {
	  require_once 'urlMonitorEntry.php';
	  $ent = new urlMonitorEntry($this->db);
	}

	$ent->id = $v;
	$ent->ack($args['msg']);
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * get available mibs for a device
   *
   * @param args json params converted into an array
   *             id contains an array of ids
   *             community snmp community string
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getMIBS($args) {
    try {
      $data = array();

      $dev = $this->getDevice($args['id']);
      
      snmp_set_quick_print(true);

      $oids = snmprealwalk($dev->address, $args['community'], null);

      if ($oids === false) {
	return(array('result' => 'failure',
		     'error'  => 'SNMP Failure'));
      } else {
	// load returned mibs
	foreach($oids as $k => $v) {
	  $mib_txt = sprintf("%s%s (%s%s)", substr($k, 0, 25), 
			     (strlen($k) > 25 ? "..." : ""), 
			     substr($v, 0, 15) ,
			     (strlen($v) > 15 ? "..." : ""));
	  $data[] = array('mib' => $k, 'mib_txt' => $mib_txt,
			  'value' => $v);
	}
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * schedule outage window for device
   *
   * @param args json params converted into an array
   *             id contains device id
   *             start_date start of outage 
   *             start_time start time of outage
   *             stop_date stop of outage
   *             stop_time stop of outage
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_scheduleDeviceOutage($args) {
    try {
      $dev = $this->getDevice($args['id']);

      $start = $args['start_date'];
      $start = preg_replace('/(\d+)\/(\d+)\/(\d+)/', '\3-\1-\2', $start);
      $start .= ' ' . $args['start_time'];

      $stop = $args['stop_date'];
      $stop = preg_replace('/(\d+)\/(\d+)\/(\d+)/', '\3-\1-\2', $stop);
      $stop .= ' ' . $args['stop_time'];

      if ($dev) {
	$dev->scheduleOutage($start, $stop);
      } else {
	return(array('result' => 'failure',
		     'error'  => 'Device does not exist'));
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * utility method for accepting file uplaods
   *
   * @param args json params converted into an array
   *             type type of file being uploaded
   *             contents base64 encoded file contents
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_uploadFile($args) {
    global $php_errormsg;

    $result = 'success';
    $error = '';
    $data = '';

    try {     
      ini_set('track_errors', true);

      if ($args['type'] == 'script') {
	// make sure we accept script uploads
	$script_root = $this->config()->getConfigValue('script.directory'); 

	if ($script_root) {
	  // decode file contents
	  $contents = base64_decode($args['contents']);
	  $file_path = $script_root . '/' . $args['name'];

	  // make sure it doesn't exist already
	  if (!file_exists($file_path)) {
	    $fh = @fopen($file_path, 'w');
	    if ($fh === false) {
	      $result = 'failure';
	      $error = 'fopen: ' . $php_errormsg;
	    } else {
	      fwrite($fh, $contents);
	      fclose($fh);
	      chmod($file_path, 0755);
	    }
	  } else {
	    $result = 'failure';
	    $error = 'script with that name already exists';
	  }
	} else {
	  $result = 'failure';
	  $error = 'No script upload directory defined';
	}
      } else {
	$result = 'failure';
	$error  = 'Unsupported upload type: ' . $args['type'];
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 
		 'data' => $data));
  }

  /**
   * get availability monitor entry
   *
   * return monitor information for given device id
   *        and entry id
   *
   * @param args json params converted into an array
   *             device_id device id to get data for
   *             entry_id entry to get data for
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getShellMonitorEntry($args) {
    global $panoptes_current_user;
    try {
      require_once 'userEntry.php';
      $user = new userEntry();
      $user->db = $this->db;
      $user->getByName($panoptes_current_user);

      $rst = $this->getShellMonitorData($args['device_id'], $args['entry_id']);
      $a = $rst[0];
      $ack = $a->getAckInfo();
      $data = array (
		     'id'            => $a->id,
		     'device_id'     => $a->device_id,
		     'script'        => $a->script,
		     'params'        => $a->params,
		     'last_check'    => $a->last_check,
		     'next_check'    => $a->next_check,
		     'ack_by'        => $ack['ack_by'],
		     'ack_msg'       => $ack['ack_msg'],
		     'status'        => $a->status,
		     'status_string' => $a->status_string,
		     'disabled'      => $a->disabled,
		     'notify'        => $a->getNotification($user->id)
		     );
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }

    return(array('result' => 'success', 'data' => $data));
  }

  /**
   * list shell monitors
   *
   * @param args json params converted into an array
   *             id optional device id to get monitors for, if 
                    omitted, returns all available monitors
   * @throws none
   * @return array containing result and possible error messages
   *               if no id it provided it will return an array
   *               of all available monitors
   *               otherwise it will reutrn an array of monitors for
   *               the given device id
   */
  public function ajax_getShellMonitors($args) {
    global $php_errormsg;
    global $panoptes_current_user;

    $result = 'success';
    $error = '';
    $data = array();

    try {     
      ini_set('track_errors', true);

      if (array_key_exists('id', $args)) {
	require_once 'userEntry.php';
	$user = new userEntry();
	$user->db = $this->db;
	$user->getByName($panoptes_current_user);

	// just get shell monitors for the device identified by id
	$monitors = $this->getShellMonitorData($args['id']);
	foreach ($monitors as $a) {
	  $ack = $a->getAckInfo();
	  array_push($data, array(
				 'id'            => $a->id,
				 'device_id'     => $a->device_id,
				 'script'        => $a->script,
				 'params'        => $a->params,
				 'last_check'    => $a->last_check,
				 'next_check'    => $a->next_check,
				 'ack_by'        => $ack['ack_by'],
				 'ack_msg'       => $ack['ack_msg'],
				 'status'        => $a->status,
				 'status_string' => $a->status_string,
				 'notify'        => $a->getNotification($user->id)
				  ));
	}
      } else {
	$count = 0;
	$script_root = $this->config()->getConfigValue('script.directory'); 

	if ($script_root) {
	  $dh = @opendir($script_root);
	  if ($dh !== false) {
	    while(($fname = readdir($dh)) !== false) {
	      if ($fname != '.' && $fname != '..') {
		// read script up until first non comment
		// non blank line and look for required/optional parameters
		$params = '';
		$fh = fopen($script_root . '/' . $fname, "r");
		while(($ln = fgets($fh)) !== false) {
		  if (preg_match('/^#param:\s*(.*)/', 
				 $ln, $matches)) {
		    $params = $matches[1];
		    break;
		  } else if (preg_match('/^[#\s].*/', $ln)) {
		    continue;
		  } else {
		    break;
		  }
		}
		fclose($fh);

		array_push($data, array('script' => $fname,
					'param' => $params));
 	      }
	    }
	    closedir($dh);
	  } else {
	    $result = 'failure';
	    $error = 'opendir: ' . $php_errormsg;
	  }
	} else {
	  $result = 'failure';
	  $error = 'No script upload directory defined';	  
	}
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 
		 'data' => $data));
  }

  /**
   * createSecurityGroup
   *
   * @param args json params converted into an array
   8                  group_name name of group to add
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_createSecurityGroup($args) {
    $result = 'success';
    $error = '';
    $data = array();

    try {
      require_once 'securityGroup.php';
      $grp = new securityGroup($this->db);
      $grp->name = $args['group_name'];
      $grp->commit();

      array_push($data, array(
			      'id'       => $grp->id,
			      'type'     => 'group',
			      'children' => array(),
			      'name'     => $grp->name));      
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 
		 'data' => $data));
  }

  /**
   * get individual or all users
   *
   * @param args json params converted into an array
   *                  id id of the user to get info for
   *                  if not provided, list all users
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getUser($args) {
    $result = 'success';
    $error = '';
    $data = array();

    try {
      if (array_key_exists('id', $args)) {
      } else {
	$r = $this->getAllUsers();
	foreach ($r as $usr) {
	  array_push($data, array(
				  'id'         => 'u_' . $usr->id,
				  'name'       => $usr->name,
				  'type'       => 'user',
				  'created_by' => $usr->created_by,
				  'modified'   => $usr->modified,
				  ));
	}
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 
		 'data' => $data));
  }

  /**
   * get individual or all users
   *
   * @param args json params converted into an array
   *                  name name of user to add
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_addUser($args) {
    $result = 'success';
    $error = '';
    $data = array();

    try {
      if (array_key_exists('name', $args)) {
	require_once 'userEntry.php';
	$usr = new userEntry($this->db);
	$usr->name = $args['name'];
	$usr->commit();
	$data['id'] = 'u_' . $usr->id;
	$data['type'] = 'user';
	$data['name'] = $usr->name;
	$data['created_by'] = $usr->created_by;
	$data['modified'] = $usr->modified;
      } else {
	$result = 'failure';
	$error = 'No name provided';
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 
		 'data' => $data));
  }

  /**
   * delete user
   *
   * @param args json params converted into an array
   *                  name name of user to delete
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_deleteUser($args) {
    $result = 'success';
    $error = '';
    $data = array();

    try {
      if (array_key_exists('id', $args)) {
	require_once 'userEntry.php';
	$usr = new userEntry($this->db);
	$usr->id = $args['id'];
	$usr->delete();
      } else {
	$result = 'failure';
	$error = 'No id provided';
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 
		 'data' => $data));
  }

  /**
   * savePrefs
   *
   * @param args json params converted into an array
   *                  scope scope of preferences being saved
   *                  prefs name value pairs of preferences to update
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_savePrefs($args) {
    global $panoptes_current_user;

    $result = 'success';
    $error = '';
    $data = array();

    try {
      require_once 'userEntry.php';
      require_once 'userPrefs.php';
      $user = new userEntry();
      $user->db = $this->db;
      $user->getByName($panoptes_current_user);

      $userPrefs = new userPrefs($this->db);
      $userPrefs->db = $this->db;
      foreach ($args['prefs'] as $k => $v) {
	$userPrefs->setPref($user->id, $args['scope'], $k, $v);
      }
      
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 
		 'data' => $data));
  }

  /**
   * getAllPrefs
   *
   * @param args json params converted into an array
   *                  scope scope of preferences being saved
   *                  prefs name value pairs of preferences to update
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getAllPrefs($args) {
    global $panoptes_current_user;

    $result = 'success';
    $error = '';

    try {
      require_once 'userEntry.php';
      require_once 'userPrefs.php';
      $user = new userEntry();
      $user->db = $this->db;
      $user->getByName($panoptes_current_user);

      $userPrefs = new userPrefs($this->db);
      $userPrefs->db = $this->db;
      $data = $userPrefs->getAllPrefs($user->id);
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 
		 'data' => $data));
  }

  /**
   * updatePermission
   *
   * @param args json params converted into an array
   *                  security_group security group id
   *                  device_group device group id
   *                  type request type one of grant or revoke
   *                  access read or write
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_updatePermission($args) {

    $result = 'success';
    $error = '';

    try {
      if ($args['type'] == 'grant') {
	$this->setPermission($args['access'], $args['security_group'], $args['device_group']);
      } else if ($srgs['type'] == 'revoke') {
	$this->setPermission('none', $args['security_group'], $args['device_group']);
      } else {
	$result = 'failure';
	$error = 'unknown request type: ' . $args['type'];
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 
		 'data' => $data));
  }

  /**
   * addNotification
   *
   * @param args json params converted into an array
   *                  device_id optional if not null, then add notification for 
   *                            every monitor on this device
   *                  monitor_ids array of monitor ids to add from type if device_id not given
   *                  type monitor table
   *                  access read or write
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_addNotification($args) {
    global $panoptes_current_user;

    $result = 'success';
    $error = '';

    $user = new userEntry();
    $user->db = $this->db;
    $user->getByName($panoptes_current_user);

    try {
      if (array_key_exists('device_id', $args)) {
	// port monitors
	$rst = $this->getPortMonitorData($args['device_id']);
	foreach ($rst as $a) {
	  $a->addNotification($user->id);
	}
	//certificate monitors
	$rst = $this->getCertificateMonitorData($args['device_id']);
	foreach ($rst as $a) {
	  $a->addNotification($user->id);
	}
	//snmp monitors
	$rst = $this->getSNMPMonitorData($args['device_id']);
	foreach ($rst as $a) {
	  $a->addNotification($user->id);
	}
	//shell monitors
	$rst = $this->getShellMonitorData($args['device_id']);
	foreach ($rst as $a) {
	  $a->addNotification($user->id);
	}
	//url monitors
	$rst = $this->getUrlMonitorData($args['device_id']);
	foreach ($rst as $a) {
	  $a->addNotification($user->id);
	}
      } else {
	foreach ($args['monitor_ids'] as $v) {
	  if ($args['type'] == 'port_monitors') {
	    require_once 'portMonitorEntry.php';
	    $ent = new portMonitorEntry($this->db);
	  } else if ($args['type'] == 'certificate_monitors') {
	    require_once 'certificateMonitorEntry.php';
	    $ent = new certificateMonitorEntry($this->db);
	  } else if ($args['type'] == 'snmp_monitors') {
	    require_once 'SNMPMonitorEntry.php';
	    $ent = new SNMPMonitorEntry($this->db);
	  } else if ($args['type'] == 'shell_monitors') {
	    require_once 'shellMonitorEntry.php';
	    $ent = new shellMonitorEntry($this->db);
	  } else if ($args['type'] == 'url_monitors') {
	    require_once 'urlMonitorEntry.php';
	    $ent = new urlMonitorEntry($this->db);
	  }

	  $ent->id = $v;
	  $ent->addNotification($user->id);
	}
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 
		 'data' => $data));
  }

  /**
   * removeNotification
   *
   * @param args json params converted into an array
   *                  device_id optional if not null, then remove notification for 
   *                            every monitor on this device
   *                  monitor_ids array of monitor ids to remove from type if device_id not given
   *                  type monitor table
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_removeNotification($args) {
    global $panoptes_current_user;

    $result = 'success';
    $error = '';

    try {
      $user = new userEntry();
      $user->db = $this->db;
      $user->getByName($panoptes_current_user);

      if (array_key_exists('device_id', $args)) {
	// port monitors
	$rst = $this->getPortMonitorData($args['device_id']);
	foreach ($rst as $a) {
	  $a->removeNotification($user->id);
	}
	//certificate monitors
	$rst = $this->getCertificateMonitorData($args['device_id']);
	foreach ($rst as $a) {
	  $a->removeNotification($user->id);
	}
	//snmp monitors
	$rst = $this->getSNMPMonitorData($args['device_id']);
	foreach ($rst as $a) {
	  $a->removeNotification($user->id);
	}
	//shell monitors
	$rst = $this->getShellMonitorData($args['device_id']);
	foreach ($rst as $a) {
	  $a->removeNotification($user->id);
	}
	//url monitors
	$rst = $this->getUrlMonitorData($args['device_id']);
	foreach ($rst as $a) {
	  $a->removeNotification($user->id);
	}
      } else {
	foreach ($args['monitor_ids'] as $v) {
	  if ($args['type'] == 'port_monitors') {
	    require_once 'portMonitorEntry.php';
	    $ent = new portMonitorEntry($this->db);
	  } else if ($args['type'] == 'certificate_monitors') {
	    require_once 'certificateMonitorEntry.php';
	    $ent = new certificateMonitorEntry($this->db);
	  } else if ($args['type'] == 'snmp_monitors') {
	    require_once 'SNMPMonitorEntry.php';
	    $ent = new SNMPMonitorEntry($this->db);
	  } else if ($args['type'] == 'shell_monitors') {
	    require_once 'shellMonitorEntry.php';
	    $ent = new shellMonitorEntry($this->db);
	  } else if ($args['type'] == 'url_monitors') {
	    require_once 'urlMonitorEntry.php';
	    $ent = new urlMonitorEntry($this->db);
	  }

	  $ent->id = $v;
	  $ent->removeNotification($user->id);
	}
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 
		 'data' => $data));
  }

  /**
   * cloneMonitor
   *
   * @param args json params converted into an array
   *                  device_id optional if not null, then clone
   *                            every monitor on this device
   *                  monitor_ids array of monitor ids to clone from type if device_id not given
   *                  type monitor table
   *                  target_device_id target id to copy monitor to
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_cloneMonitor($args) {
    $result = 'success';
    $error = '';

    try {
      if (array_key_exists('device_id', $args)) {
      } else {
	foreach ($args['monitor_ids'] as $v) {
	  if ($args['type'] == 'port_monitors') {
	    require_once 'portMonitorEntry.php';
	    $ent = new portMonitorEntry($this->db);
	  } else if ($args['type'] == 'certificate_monitors') {
	    require_once 'certificateMonitorEntry.php';
	    $ent = new certificateMonitorEntry($this->db);
	  } else if ($args['type'] == 'snmp_monitors') {
	    require_once 'SNMPMonitorEntry.php';
	    $ent = new SNMPMonitorEntry($this->db);
	  } else if ($args['type'] == 'shell_monitors') {
	    require_once 'shellMonitorEntry.php';
	    $ent = new shellMonitorEntry($this->db);
	  } else if ($args['type'] == 'url_monitors') {
	    require_once 'urlMonitorEntry.php';
	    $ent = new urlMonitorEntry($this->db);
	  }

	  $ent->id = $v;
	  $ent->copyToDevice($args['target_device_id']);
	}
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 
		 'data' => $data));
  }

  /**
   * addParentDevice
   *
   * @param args json params converted into an array
   *             child_id device id of child device
   *             parent_id device id of parent device
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_addParentDevice($args) {
    $result = 'success';
    $error = '';

    try {
      if (array_key_exists('child_id', $args) &&
	  array_key_exists('parent_id', $args)) {
	$dev = $this->getDevice($args['parent_id']);
	$dev->addChild($args['child_id']);
      } else {
	$result = 'failure';
	$error = 'must supply parent and child ids';
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 
		 'data' => $data));
  }

  /**
   * editDeviceInfo
   *
   * @param args json params converted into an array
   *             device_id device id to modify
   *             name optional name to replace
   *             os_type optional os genre to replace
   *             os_detail optional os detil to replace
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_editDeviceInfo($args) {
    $result = 'success';
    $error = '';

    try {
      if (array_key_exists('device_id', $args)) {
	$dev = $this->getDevice($args['device_id']);	
	
	if (array_key_exists('name', $args) && ($args['name'] != '')) {
	  $dev->name = $args['name'];
	}
	if (array_key_exists('os_type', $args) && ($args['os_type'] != '')) {
	  $dev->os_genre = $args['os_type'];
	}
	if (array_key_exists('os_detail', $args) && ($args['os_detail'] != '')) {
	  $dev->os_detail = $args['os_detail'];
	}
	$dev->commit();
      } else {
	$result = 'failure';
	$error = 'must supply device id';
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error));
  }
}

?>
