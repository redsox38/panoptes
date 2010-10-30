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
require_once 'monitorEntry.php';

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
	$r['rrd_file'] = $rrd_root . '/' . $dev->address() . '/' . 
	  'port_monitors' . '/' . $metric . '.rrd';
	$r['xml_file'] = $rrd_root . '/' . $dev->address() . '/' . 
	  'port_monitors' . '/' . $metric . '.xml';
	
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
	$res = mysql_query("SELECT id, srcaddr AS src, srcport AS sport, dstaddr AS dst, dstport AS dport, proto FROM discovered WHERE ignored=0 AND proto='tcp'", $this->db);
	
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
      $ent->id($r['id']);
      $ent->dstaddr($r['dst']);
      $ent->dport($r['dport']);
      $ent->proto($r['proto']);
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
      $dev->id($r['id']);
      $dev->name($r['name']);
      $dev->address($r['address']);
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
      $grp->id($r['id']);
      $grp->name($r['group_name']);      
    } else {
      $grp = null;
    }      

    return($grp);
  }

  /**
   * Retrieve monitior entries
   *
   * @param id id of specific device to retrieve
   *                 monitor data for
   *
   * @throws Exception 
   * @return array of monitorEntry objects
   */
  public function getPortMonitorData($id) {
    $rtndata = array();

    $res = mysql_query("SELECT * FROM port_monitors WHERE device_id='" . 
		       $id ."'", $this->db);
    
    if ($res !== false) {
      while ($r = mysql_fetch_assoc($res)) {
	$ent = new monitorEntry($this->db);
	$ent->id = $r['id'];
	$ent->device_id = $id;
	$ent->port = $r['port'];
	$ent->last_check = $r['last_check'];
	$ent->next_check = $r['next_check'];
	$ent->proto = $r['proto'];
	$ent->status = $r['status'];
	$ent->status_string = $r['status_string'];
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
	
	array_push($data, array('id' => $ent->id(),
				'dstaddr' => $ent->dstaddr(),
				'dport'   => $ent->dport(),
				'proto'   => $ent->proto()));
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
	array_push($data, array('name'     => $grp->name(),
				'type'     => 'group',
				'children' => $chld,
				'id'       => 'g_' . $grp->id()));
      }

      // get individual devices 
      // put devices that are not already in a group
      // in the ungrouped group for display
      // purposes
      while($dev = $this->getDevice()) {
	array_push($data, array('name' => $dev->name(),
				'type' => 'device',
				'id'   => 'd_' . $dev->id()));
	if (!array_key_exists($dev->id(), $grouped)) {
	  $ungrouped_children[] = array('_reference' => 'd_' . $dev->id());
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
	array_push($data, array('name' => $grp->name(),
				'id'   => $grp->id()));
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
	$grp->id(0);
	$grp->name($args['name']);      
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
	$data = array('name'    => $dev->name(),
		      'type'    => 'device',
		      'address' => $dev->address(),
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
}

?>
