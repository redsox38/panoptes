<?php
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

require_once 'panoptesConfiguration.php';
require_once 'autoDiscoveryEntry.php';
require_once 'deviceGroup.php';
require_once 'deviceEntry.php';
require_once 'pingEntry.php';
require_once 'portMonitorEntry.php';
require_once 'certificateMonitorEntry.php';
require_once 'SNMPMonitorEntry.php';

class panoptes
{
  protected $config;
  protected $data = array();
  protected $_disc_data = null;
  protected $_dev_data = null;
  protected $_dev_group_data = null;
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
    $this->config = new panoptesConfiguration();
    $this->db = mysql_connect(
			      $this->config->getConfigValue('db.host'),
			      $this->config->getConfigValue('db.user'),
			      $this->config->getConfigValue('db.password')
			      );
    mysql_select_db($this->config->getConfigValue('db.name'),
		    $this->db);

  }
  
  public function __destroy() {
    mysql_close($this->db);
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
	  $pat = ':' . $path . '/[^/]+/([^\.]+).rrd:';
	  $f = preg_replace($pat, '\1', $f);
	  $r[] = array('metric' => $f);
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
	
	$monitor_types = array('port_monitors','ping_monitors');

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
	  } else {
	    $disp = $a['name'];
	  }
	  array_push($defs, 'DEF:' . $disp . '=' . $r['rrd_file'] .
		     ':' . $a['name'] . ':AVERAGE');
	  array_push($graphs, $a['type'] . ':' . $disp . $a['color'] . ':' .
		     $a['units']);
	  if (array_key_exists("legend", $a)) {
	    array_push($gprints, 'GPRINT:' . $disp . ':' .
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
   * Retrieve autoDiscoveryEntry
   *
   * @param id id of specific autoDiscoveryEntry to retrieve
   * @throws Exception 
   * @return autoDiscoveryEntry returns the next entry, null if there are no 
   *                            entries remaining
   */
  public function getAutoDiscoveryEntry($id = null) {

    $r = null;

    if (!is_null($id)) {
      // update from table
      $this->_disc_data = array();
      $res = mysql_query("SELECT id, srcaddr AS src, srcport AS sport, dstaddr AS dst, dstport AS dport, proto FROM discovered WHERE ignored=0 AND proto='tcp' AND id='" . $id ."'", $this->db);

      if ($res !== false) {
	$r = mysql_fetch_assoc($res);      
	mysql_free_result($res);
      } else {
	throw new Exception(mysql_error());
      }
    } else {
      if (is_null($this->_disc_data)) {
	// update from table
	$this->_disc_data = array();
	$res = mysql_query("SELECT id, srcaddr AS src, srcport AS sport, dstaddr AS dst, dstport AS dport, proto FROM discovered WHERE ignored=0 AND proto='tcp' GROUP BY dst,dport,proto", $this->db);
	
	if ($res !== false) {
	  while ($row = mysql_fetch_assoc($res)) {
	    array_push($this->_disc_data, $row);
	  }	
	  mysql_free_result($res);
	} else {
	  throw new Exception(mysql_error());
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
      $res = mysql_query("SELECT id, address, name FROM devices WHERE id='" . $id ."'", $this->db);
      
      if ($res !== false) {
	$r = mysql_fetch_assoc($res);      
	mysql_free_result($res); 
      } else {
	throw new Exception(mysql_error());
      }
    } else {
      if (is_null($this->_dev_data)) {
	// update from table
	$this->_dev_data = array();

        $res = mysql_query("SELECT id, address, name FROM devices", $this->db);

	if ($res !== false) {
	  while ($row = mysql_fetch_assoc($res)) {
	    array_push($this->_dev_data, $row);
	  }	
	  mysql_free_result($res);
	} else {
	  throw new Exception(mysql_error());
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
    } else {
      $dev = null;
    }      

    return($dev);
  }

  /**
   * Retrieve group entry
   *
   * @param id id of specific groupEntry to retrieve
   *        name name of specific group to retrieve
   *
   * @throws Exception 
   * @return deviceEntry returns the next entry, null if there are no 
   *                     entries available
   */
  public function getDeviceGroup($id = null, $name = null) {

    $r = null;
    
    if (!is_null($id)) {
      // update from table
      $this->_dev_group_data = array();
      $res = mysql_query("SELECT id, group_name FROM device_groups WHERE id='" . $id ."'", $this->db);
      
      if ($res !== false) {
	$r = mysql_fetch_assoc($res);
      
	mysql_free_result($res);
      } else {
	throw new Exception(mysql_error());
      }
    } else if (!is_null($name)) {
      // update from table
      $this->_dev_group_data = array();
      $res = mysql_query("SELECT id, group_name FROM device_groups WHERE group_name='" . $name ."'", $this->db);
      
      if ($res !== false) {
	$r = mysql_fetch_assoc($res);
      
	mysql_free_result($res);
      } else {
	throw new Exception(mysql_error());
      }
    } else {
      if (is_null($this->_dev_group_data)) {
	// update from table
	$this->_dev_group_data = array();

        $res = mysql_query("SELECT id, group_name FROM device_groups", 
			   $this->db);

	if ($res !== false) {
	  while ($row = mysql_fetch_assoc($res)) {
	    array_push($this->_dev_group_data, $row);
	  }
	
	  mysql_free_result($res);
	} else {
	  throw new Exception(mysql_error());
	}
      } 
      
      $r = array_shift($this->_dev_group_data);
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
   * Retrieve snmp monitior entries
   *
   * @param id id of specific device to retrieve
   *                 snmp monitor data for
   *
   * @throws Exception 
   * @return array of SNMPMonitorEntry objects
   */
  public function getSNMPMonitorData($id) {
    $rtndata = array();


    $res = mysql_query("SELECT * FROM snmp_monitors WHERE device_id='" . 
		       $id ."'", $this->db);
    
    if ($res !== false) {
      while ($r = mysql_fetch_assoc($res)) {
	$ent = new SNMPMonitorEntry($this->db);
	$ent->id = $r['id'];
	$ent->device_id = $id;
	$ent->name = $r['name'];
	$ent->oid = $r['oid'];
	$ent->last_check = $r['last_check'];
	$ent->next_check = $r['next_check'];
	$ent->proto = $r['proto'];
	$ent->status = $r['status'];
	$ent->status_string = $r['status_string'];
	$ent->disabled = $r['disabled'];
	array_push($rtndata, $ent);
      }
      mysql_free_result($res);
    } else {
      throw new Exception(mysql_error());
    }

    return($rtndata);
  }

  /**
   * Retrieve monitior entries
   *
   * @param id id of specific device to retrieve
   *                 monitor data for
   *
   * @throws Exception 
   * @return array of portMonitorEntry objects
   */
  public function getPortMonitorData($id) {
    $rtndata = array();

    $res = mysql_query("SELECT * FROM port_monitors WHERE device_id='" . 
		       $id ."'", $this->db);
    
    if ($res !== false) {
      while ($r = mysql_fetch_assoc($res)) {
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
      mysql_free_result($res);
    } else {
      throw new Exception(mysql_error());
    }

    return($rtndata);
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
    $rtndata = array();

    $res = mysql_query("SELECT * FROM certificate_monitors WHERE device_id='" . 
		       $id ."'", $this->db);
    
    if ($res !== false) {
      while ($r = mysql_fetch_assoc($res)) {
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
      mysql_free_result($res);
    } else {
      throw new Exception(mysql_error());
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
    $data = array();
    
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
	array_push($data, array('name'     => $grp->name,
				'type'     => 'group',
				'children' => $chld,
				'id'       => 'g_' . $grp->id));
      }

      // get individual devices 
      // put devices that are not already in a group
      // in the ungrouped group for display
      // purposes
      while($dev = $this->getDevice()) {
	array_push($data, array('name' => $dev->name,
				'type' => 'device',
				'id'   => 'd_' . $dev->id));
	if (!array_key_exists($dev->id, $grouped)) {
	  $ungrouped_children[] = array('_reference' => 'd_' . $dev->id);
	}
      }
      
      array_push($data, array('name'     => 'ungrouped',
			      'type'     => 'group',
			      'children' => $ungrouped_children,
			      'id'       => 'g_0'));
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
  public function ajax_getGroups($args) {
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
    try {
      $grp = $this->getDeviceGroup(null, $args['name']);
  
      if (is_null($grp)) {
	// add new group entry
	$grp = new deviceGroup();
	$grp->db($this->db);
	$grp->id = 0;
	$grp->name = $args['name'];      
	$grp->commit();
      }

      // add member to group
      $grp->addMember($args['id']);
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
	$data = array('name'    => $dev->name,
		      'type'    => 'device',
		      'address' => $dev->address,
		      'id'      => $args['id']);
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
    $data = array();
    
    try {
      $rst = $this->getSNMPMonitorData($args['id']);
      foreach ($rst as $a) {
	array_push($data, array (
				 'id'            => $a->id,
				 'device_id'     => $a->device_id,
				 'oid'           => $a->oid,
				 'last_check'    => $a->last_check,
				 'next_check'    => $a->next_check,
				 'status'        => $a->status,
				 'status_string' => $a->status_string,
				 'metric'        => $a->proto . '-' .
				 $a->port
				 ));
      }
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
    $data = array();
    
    try {
      $rst = $this->getPortMonitorData($args['id']);
      foreach ($rst as $a) {
	array_push($data, array (
				 'id'            => $a->id,
				 'device_id'     => $a->device_id,
				 'port'          => $a->port,
				 'proto'         => $a->proto,
				 'last_check'    => $a->last_check,
				 'next_check'    => $a->next_check,
				 'status'        => $a->status,
				 'status_string' => $a->status_string,
				 'metric'        => $a->proto . '-' .
				 $a->port
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
      $dev->commit();

      // add ping monitor 
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
    $data = array();
    
    try {
      $rst = $this->getCertificateMonitorData($args['id']);
      foreach ($rst as $a) {
	array_push($data, array (
				 'id'            => $a->id,
				 'device_id'     => $a->device_id,
				 'url'           => $a->url,
				 'last_check'    => $a->last_check,
				 'next_check'    => $a->next_check,
				 'status'        => $a->status,
				 'status_string' => $a->status_string
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
	foreach ($args['id'] as $v) {	  
	  $ent = new portMonitorEntry($this->db);
	  $ent->id = $v;
	  $ent->delete();
	}
      } elseif ($args['type'] == 'certificate_monitors') {
	foreach ($args['id'] as $v) {	  
	  $ent = new certificateMonitorEntry($this->db);
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
	foreach ($args['id'] as $v) {	  
	  $ent = new certificateMonitorEntry($this->db);
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
	$ent = new SNMPMonitorEntry($this->db);
	$ent->device_id = $args['id'];
	$ent->name = $args['params']['name'];
	$ent->oid = implode(',', $args['params']['oids']);
	$ent->commit();

	array_push($data, array (
				 'id'            => $ent->id,
				 'device_id'     => $ent->device_id,
				 'name'          => $ent->name,
				 'oid'           => $ent->oids,
				 'last_check'    => '0000-00-00 00:00:00',
				 'next_check'    => '0000-00-00 00:00:00',
				 'status'        => 'new',
				 'status_string' => ''
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
	  $ent = new portMonitorEntry($this->db);
	} else if ($args['type'] == 'certificate_monitors') {
	  $ent = new certificateMonitorEntry($this->db);
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

}

?>
