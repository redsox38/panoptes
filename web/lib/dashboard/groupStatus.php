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
 * dashboardWidget class
 *
 * class for interacting with dashboardWidgets
 *
 * @version 0.01
 * @author Todd Merritt <redsox38@gmail.com>
 * @project panoptes
 *
 */

require_once 'widgetInterface.php';

class groupStatusWidget implements widgetInterface
{
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

  public function __construct($db = null) {
    if (!is_null($db)) {
      $this->data['db'] = $db;
    }
  }

  /**
   * getNewFormInterface
   *
   * @param none
   * @throws none
   * @return val javascript to be passed back to client
   */
  public function getNewFormInterface() {
    $val = file_get_contents(dirname(realpath(__FILE__)) . '/groupStatusAdd.js');
    return($val);
  }

  /**
   * getNewFormCleanup
   *
   * @param none
   * @throws none
   * @return val javascript to be passed back to client
   */
  public function getNewFormCleanup() {
    $val = file_get_contents(dirname(realpath(__FILE__)) . '/groupStatusRemove.js');
    return($val);
  }

  /**
   * maxPosition
   *
   * @param user_id user_id from database
   * @throws PDOException
   * @return max position in this users dashboard
   */
  public function maxPosition($user_id) {
    try {
      $stmt = $this->db->prepare("SELECT MAX(position) AS max FROM user_dashboard_widgets WHERE user_id=?");
      $stmt->bindParam(1, $user_id, PDO::PARAM_INT);
      $stmt->execute();
      
      $r = $stmt->fetch(PDO::FETCH_ASSOC);
      if ($r) {
	return($r['max']);
      } else {
	return(-1);
      }
    } catch (PDOException $e) {
      throw($e);
    } 
  }
  
  /**
   * saveWidget
   *
   * @param widget_id widget id
   * @param user_id user_id from database
   * @param args params array passed in from client
   * @throws PDOException
   * @return none
   */
  public function saveWidget($widget_id, $user_id, $args) {
    $save_params = array();

    $save_params['group_id'] = preg_replace('/g_(\d+)/', '\1', $args['new_widget_grp']);
    
    try {
      $next_pos = $this->maxPosition($user_id);
      $next_pos++;

      $stmt = $this->db->prepare("INSERT INTO user_dashboard_widgets VALUES(0, ?, ?, ?, ?)");
      $stmt->bindParam(1, $widget_id, PDO::PARAM_INT);
      $stmt->bindParam(2, $user_id, PDO::PARAM_INT);
      $stmt->bindParam(3, serialize($save_params));
      $stmt->bindParam(4, $next_pos, PDO::PARAM_INT);
      $stmt->execute();
      $this->id = $this->db->lastInsertId();
    } catch (PDOException $e) {
      throw($e);
    } 
  }

  /**
   * renderUserWidget
   *
   * @param entry dashboardUserWidget object
   * @throws PDOException
   * @return none
   */
  public function renderUserWidget(dashboardUserWidget $entry) {
    try {
      $rtn = array();
      $rtn['type'] = 'html';

      require_once dirname(realpath(__FILE__)) . '/../deviceGroup.php';
      require_once dirname(realpath(__FILE__)) . '/../deviceEntry.php';

      // get group name from id
      $prms = $entry->params;
      $grp = new deviceGroup($this->db);
      $grp->getById($prms['group_id']);
      if ($grp) {
	$counts = array();
	$counts['ok'] = 0;
	$counts['warn'] = 0;
	$counts['critical'] = 0;

	$rtn['value'] = '<div style="font-weight: bold; font-size: larger; text-align: center;">' . $grp->name . ' summary</div/>';
	// get status for children
	foreach ($grp->children() as $c) {
	  $dev = new deviceEntry($this->db);
	  $dev->getById($c);
	  if ($dev->id) {
	    $status = $dev->maxStatus();
	    if (array_key_exists($status, $counts)) {
	      $counts[$status]++;
	    } else {
	      $counts[$status] = 1;
	    }
	  }
	}

	// add to output
	$rtn['value'] .= '<span style="font-align: left; font-weight: bold;">ok</span><span style="float: right;">' . 
	                 $counts['ok'] . '</span><br/>' . "\n";
	$rtn['value'] .= '<span style="font-align: left; font-weight: bold; color: #b3511d;">warn</span><span style="float: right; color: #b3511d;">' . 
	                 $counts['warn'] . '</span><br/>' . "\n";
	$rtn['value'] .= '<span style="font-align: left; font-weight: bold; color: #a62434;">critical</span><span style="float: right; color: #a62434;">' . 
	                 $counts['critical'] . '</span><br/>' . "\n";
      } else {
	$rtn['value'] = '<center>unknown group id</center>';
      }
    } catch (PDOException $e) {
      throw($e);
    }

    return($rtn);
  }
}
?>
