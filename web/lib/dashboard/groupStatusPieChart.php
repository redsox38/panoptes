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
 * groupStatusPieChart class
 *
 * class for interacting with groupStatusPieChart dashboardWidgets
 *
 * @version 0.01
 * @author Todd Merritt <redsox38@gmail.com>
 * @project panoptes
 *
 */

require_once 'widgetInterface.php';

class groupStatusPieChartWidget implements widgetInterface
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
    $val = file_get_contents(dirname(realpath(__FILE__)) . '/groupStatusPieChartAdd.js');
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
    $val = file_get_contents(dirname(realpath(__FILE__)) . '/groupStatusPieChartRemove.js');
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
      if ($r && $r['max'] !== null) {
	return($r['max'] + 1);
      } else {
	return(0);
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

    $save_params['group_id'] = preg_replace('/g_(\d+)/', '\1', $args['new_widget_pie_grp']);
    
    try {
      $next_pos = $this->maxPosition($user_id);

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
   * deleteWidget
   *
   * @param pos position of this widget
   * @param id widget id for this user
   * @param user_id user id for this dashbaord
   * @throws PDOException
   * @return none
   */
  function deleteWidget($pos, $id, $user_id) {
    try {
      $stmt = $this->db->prepare("DELETE FROM user_dashboard_widgets WHERE id=? AND user_id=?");
      $stmt->bindParam(1, $id, PDO::PARAM_INT);
      $stmt->bindParam(2, $user_id, PDO::PARAM_INT);
      $stmt->execute();

      $last = $this->maxPosition($user_id);

      if ($last > $pos) {
	// reindex everything between the deleted widget and the last widget
	$pos++;
	for ($i = $pos; $i < $last; $i++) {
	  $this->reindexWidget($user_id, $i, ($i - 1));
	}
      }
    } catch (PDOException $e) {
      throw($e);
    }
  }

  /**
   * reindexWidget
   *
   * @param user_id user id for this dashbaord
   * @param pos position of this widget
   * @param new_pos new position of this widget
   * @throws PDOException
   * @return none
   */
  function reindexWidget($user_id, $pos, $new_pos) {
    try {
      $stmt = $this->db->prepare("UPDATE user_dashboard_widgets SET position=? WHERE user_id=? AND position=?");
      $stmt->bindParam(1, $new_pos, PDO::PARAM_INT);
      $stmt->bindParam(2, $user_id, PDO::PARAM_INT);
      $stmt->bindParam(3, $pos, PDO::PARAM_INT);
      $stmt->execute();
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
    global $panoptes_current_user;
    try {
      $rtn = array();
      $rtn['type'] = 'js';
      $rtn['value'] = '';

      require_once dirname(realpath(__FILE__)) . '/../deviceGroup.php';
      require_once dirname(realpath(__FILE__)) . '/../deviceEntry.php';
      require_once dirname(realpath(__FILE__)) . '/../userEntry.php';
      require_once dirname(realpath(__FILE__)) . '/../userPrefs.php';

      // get group name from id
      $prms = $entry->params;
      $grp = new deviceGroup($this->db);
      $grp->getById($prms['group_id']);
      if ($grp) {
	$counts = array();
	$counts['ok'] = 0;
	$counts['warn'] = 0;
	$counts['critical'] = 0;

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
      }

      $str = 'var groupStatusPieData = [';
      $i = 1;
      foreach($counts as $k => $v) {
      	$str .= '{ "x": "' . $i . '", "y": "' . $v . 
	  '", "text": "' . $k . '"},';
      	$i++;
      }
      $str .= ']; ';

      // load user prefs for chart theme
      $user = new userEntry();
      $user->db = $this->db;
      $user->getByName($panoptes_current_user);

      $userPrefs = new userPrefs($this->db);
      $userPrefs->db = $this->db;
      
      $theme = $userPrefs->getPref($user->id, 'general', 
				   'general_prefs_chart_theme');
    
      if (is_null($theme)) {
	require_once dirname(realpath(__FILE__)) . '/../panoptes.php';

	$panoptes = new panoptes();
	$theme = $panoptes->config()->getConfigValue('web.default_chart_theme');
      }      

      $rtn['value'] .= $str;
      $rtn['value'] .= "var dv = document.createElement('div'); dv.id = '" . $prms['group_id'] . "' + '_gs_div'; dv.style.height = '200px'; dv.style.width = '200px'; node.appendChild(dv); var GS_pieChart = new dojox.charting.Chart2D('" . $prms['group_id'] . "' + '_gs_div', { title: '" . $grp->name . " summary', titleFont: 'normal normal bold 12pt Helvetica', titleGap: 5 }); GS_pieChart.setTheme(dojox.charting.themes." . $theme . "); GS_pieChart.addPlot('default', { type: 'Pie', labels: true, labelOffset: -30, radius: 50, fontColor: 'black'}); GS_pieChart.addSeries('" . $grp->name . "' + ' Summary', groupStatusPieData); new dojox.charting.action2d.MoveSlice(GS_pieChart, 'default'); GS_pieChart.render()";
    } catch (PDOException $e) {
      throw($e);
    }

    return($rtn);
  }
}
?>
