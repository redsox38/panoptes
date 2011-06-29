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

  protected $colors = array('#ff0000','#0000ff','#6666ff','#00e600','#006600');

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

  private function _imageTextWrap($fontSize, $fontFace, $string, $width){
    $ret = "";   
    $arr = explode(' ', $string);
    
    foreach ( $arr as $word ){
      $str = $ret.' '.$word;
      $testbox = imagettfbbox($fontSize, 0, $fontFace, $str);
      if ( $testbox[2] > $width ){
	$ret.=($ret==""?"":"\n").$word;
      } else {
	$ret.=($ret==""?"":' ').$word;
      }
    }
    
    return $ret;
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
      $rtn['type'] = 'image';

      require_once dirname(realpath(__FILE__)) . '/../panoptes.php';
      
      $pan = new panoptes();

      // draw rrd graph from params field of widget render last 30 minutes
      $start = sprintf("--start=%ld", time() - 1800);

      $prms = $entry->params;

      $rrd_params = array();
      $devices = array();
      $count = 0;
      foreach ($prms as $a) {
	preg_match('/^(\d+):(.*)/', $a, $matches);
	$dev = $pan->getDevice($matches[1]);

	$short_name = preg_replace('/([^\.]+)\..*/', '\1', $dev->name);
	array_push($devices, $short_name);

	$rrd_info = $pan->getRRDInfo($matches[1],
				     $matches[2], false, $count);

	// replace colors in opts since they may overlap
	// prefix host to graph text
	foreach ($rrd_info['rrd_opts'] as $k => $v) {
	  $rrd_info['rrd_opts'][$k] = preg_replace('/(\#.{6}):(.*)/', $this->colors[$count % 5] .
						   ':' . $short_name . ' \2', $v);
	}

	$rrd_params = array_merge($rrd_params, $rrd_info['rrd_opts']);
	$count++;
      }

      // make title out of device names
      $devices = array_unique($devices);
      if (count($devices) > 1) {
	$last = array_pop($devices);
	$first = implode(',', $devices);
	$title = "--title=" . $first . ' & ' . $last;
      } else {
	$title = "--title=" . $devices[0];
      }

      array_unshift($rrd_params, $title);
      array_unshift($rrd_params, "--width=200");
      array_unshift($rrd_params, "--height=200");
      array_unshift($rrd_params, $start);

      $file_name = "/tmp/dashboard_image_" . rand() . '.png';
      $ret = rrd_graph($file_name, $rrd_params, count($rrd_params));

      if(!is_array($ret)) {
	$fontsize = 10;
	$font = $pan->config()->getConfigValue('web.gd_font');
	$hgt = 200;
	$wdt = 200;

	$err = rrd_error();
	$im = imagecreatetruecolor($wdt, $hgt);

  
	// set foreground and background colors
	$bg_color = imagecolorallocate($im, 255, 255, 255);
	$fg_color = imagecolorallocate($im, 0, 0, 0);

	imagefilledrectangle($im, 0, 0, $wdt, $hgt, $bg_color);

	// wrap text to fit in image
	$err = $this->_imageTextWrap($fontsize, $font, $err, $wdt);
	
	imagettftext($im, $fontsize, 0, 0, ($hgt / 3), $fontsize, $font, $err);
	
	header("Content-type: image/png");
	imagepng($im, $file_name);

	imagedestroy($im);
      }

      $rtn['value'] = $file_name;
    } catch (PDOException $e) {
      throw($e);
    }

    return($rtn);
  }
}
?>
