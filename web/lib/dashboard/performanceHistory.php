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

class performanceHistoryWidget implements widgetInterface
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
    $val = file_get_contents(dirname(realpath(__FILE__)) . '/performanceHistoryAdd.js');
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
    $val = file_get_contents(dirname(realpath(__FILE__)) . '/performanceHistoryRemove.js');
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

    $i = 0;
    while ($i >= 0) {
      $p = 'perf_hist_input_' . $i;
      if (array_key_exists($p, $args)) {
	$save_params[] = $args[$p];
	$i++;
      } else {
	$i = -1;
      }
    }

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
	for ($i = $pos; $i <= $last; $i++) {
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
    try {
      // draw rrd graph from params field of widget
    } catch (PDOException $e) {
      throw($e);
    }

    return($rtn);
  }
}
?>
