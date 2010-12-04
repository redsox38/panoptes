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
 * class for storing/retrieving user preferences
 *
 *
 * @version 0.01
 * @author Todd Merritt <redsox38@gmail.com>
 * @project panoptes
 *
 */

class userPrefs
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
  
  /**
   * Get all preferences
   *
   * @param id user id of owner of preference
   *        scope scope of preference to retrieve
   *        pref name of preference to retrieve
   * @throws Exception
   * @return var string
   */
  public function getAllPrefs($id, $scope = null) {

    $prefs = array();

    if (is_null($scope)) {
      $res = mysql_query("SELECT * FROM user_prefs WHERE user_id='" .
		       $id . "'", $this->data['db']);
    } else {
      $res = mysql_query("SELECT * FROM user_prefs WHERE pref_scope='" . 
		       mysql_real_escape_string($scope) . 
		       "' AND user_id='" .
		       $id . "'", $this->data['db']);
    }

    if ($res !== false) {
      $count = 0;
      while ($r = mysql_fetch_assoc($res)) {
	$prefs[] = array('id' => $count++,
			 'pref_name' => $r['pref_name'],
			 'pref_scope' => $r['pref_scope'],
			 'pref_value' => $r['pref_value']);
      }
      mysql_free_result($res);
    } else {
      throw new Exception(mysql_error());
    }
    
    return($prefs);
  }

  /**
   * Get preference
   *
   * @param id user id of owner of preference
   *        scope scope of preference to retrieve
   *        pref name of preference to retrieve
   * @throws Exception
   * @return var string
   */
  public function getPref($id, $scope, $pref) {
    $pref_val = null;

    $res = mysql_query("SELECT pref_value FROM user_prefs WHERE pref_scope='" . 
		       mysql_real_escape_string($scope) . 
		       "' AND pref_name='" .
		       mysql_real_escape_string($pref) . "' AND user_id='" .
		       $id . "'", $this->data['db']);

    if ($res !== false) {
      $r = mysql_fetch_assoc($res);
      if ($r) {
	$pref_val = $r['pref_value'];
      }
      mysql_free_result($res);
    } else {
      throw new Exception(mysql_error());
    }
    
    return($pref_val);
  }
  
  /**
   * Set preference
   *
   * @param id user id to set preference for
   *        scope scope of preference to set
   *        pref name of preference to set
   *        value value to set preference to
   * @throws Exception
   * @return none
   */
  public function setPref($id, $scope, $pref, $value) {
    $pref_val = null;

    $qry = "REPLACE INTO user_prefs VALUES ('" . 
      $id . "','" .
      mysql_real_escape_string($scope) . 
      "','" .
      mysql_real_escape_string($pref) . "','" .
      mysql_real_escape_string($value) . "')";

    $res = mysql_query($qry, $this->data['db']);

    if ($res === false) {
      throw new Exception(mysql_error());
    }
  }
}
?>
