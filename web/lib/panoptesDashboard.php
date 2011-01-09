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

  /**
   * getWidgets
   *
   * @param none
   * @throws none
   * @return array containing result and possible error messages
   */
  public function getWidget($id = null) {
    require_once 'dashboard/widget.php';

    $rtn = array();

    try {
      if ($id) {
	$stmt = $this->db->prepare("SELECT * FROM dashboard_widgets WHERE id=?");
	$stmt->bindParam(1, $id, PDO::PARAM_INT);
      } else {
	$stmt = $this->db->prepare("SELECT * FROM dashboard_widgets");
      }
      $stmt->execute();
      
      while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
	$ent = new dashboardWidget($this->db);
	$ent->name = $r['name'];
	$ent->id = $r['id'];
	$ent->description = $r['description'];
	$ent->php_class = $r['php_class'];
	$ent->php_file = $r['php_file'];
	array_push($rtn, $ent);
      }
    } catch (PDOException $e) {
      throw($e);
    }

    return($rtn);
  }

  /**
   * getDashboardWidgets
   *
   * @param args json params converted into an array
   *             not used
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getDashboardWidgets($args) {
    $result = 'success';
    $error = '';
    $data = array();
    
    try {
      $rst = $this->getWidget();
      foreach ($rst as $a) {
	array_push($data, array(
				'description' => $a->description,
				'id'          => $a->id,
				'name'        => $a->name			       
				));
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 'data' => $data));
  }

  /**
   * getWidgetForm
   *
   * @param args json params converted into an array
   *             widget_id widget id to get form elements for
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getWidgetForm($args) {
    $result = 'success';
    $error = '';
    $data = '';
    
    try {
      if (array_key_exists('widget_id', $args)) {
	$rst = $this->getWidget();
	if ($rst) {
	  $ent = $rst[0];
	  require_once 'dashboard/' . $ent->php_file;

	  $class_name = $ent->php_class;
	  $obj = new $class_name($this->db);

	  $data = $obj->getNewFormInterface();
	} else {
	  $result = 'failure';
	  $error = 'invalid widget id supplied';
	}
      } else {
	$result = 'failure';
	$error = 'no widget id supplied';
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 'data' => $data));
  }

  /**
   * getWidgetFormCleanup
   *
   * @param args json params converted into an array
   *             widget_id widget id to get form elements for
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getWidgetFormCleanup($args) {
    $result = 'success';
    $error = '';
    $data = '';
    
    try {
      if (array_key_exists('widget_id', $args)) {
	$rst = $this->getWidget();
	if ($rst) {
	  $ent = $rst[0];
	  require_once 'dashboard/' . $ent->php_file;

	  $class_name = $ent->php_class;
	  $obj = new $class_name($this->db);

	  $data = $obj->getNewFormCleanup();
	} else {
	  $result = 'failure';
	  $error = 'invalid widget id supplied';
	}
      } else {
	$result = 'failure';
	$error = 'no widget id supplied';
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 'data' => $data));
  }

  /**
   * saveWidget
   *
   * @param args json params converted into an array
   *             widget_id widget id to save
   *             params parameter map to pass to widget class
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_saveWidget($args) {
    global $panoptes_current_user;

    $result = 'success';
    $error = '';
    $data = '';

    require_once 'userEntry.php';
    $user = new userEntry();
    $user->db = $this->db;
    $user->getByName($panoptes_current_user);
    
    try {
      if (array_key_exists('widget_id', $args)) {
	$rst = $this->getWidget();
	if ($rst) {
	  $ent = $rst[0];
	  require_once 'dashboard/' . $ent->php_file;

	  $class_name = $ent->php_class;
	  $obj = new $class_name($this->db);

	  $data = $obj->saveWidget($ent->id, $user->id, $args['params']);
	} else {
	  $result = 'failure';
	  $error = 'invalid widget id supplied';
	}
      } else {
	$result = 'failure';
	$error = 'no widget id supplied';
      }
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 'data' => $data));
  }

  /**
   * getUserWidgets
   *
   * @param args json params converted into an array
   *             not used currently
   * @throws none
   * @return array containing result and possible error messages
   */
  public function ajax_getUserWidgets($args) {
    global $panoptes_current_user;

    $result = 'success';
    $error = '';
    $data = array();

    require_once 'userEntry.php';
    $user = new userEntry();
    $user->db = $this->db;
    $user->getByName($panoptes_current_user);
    
    try {
      // get a list of widgets that this user has added
    } catch (Exception $e) {
      return(array('result' => 'failure',
		   'error'  => $e->getMessage()));
    }
    
    return(array('result' => $result, 'error' => $error, 'data' => $data));
  }

}

?>
