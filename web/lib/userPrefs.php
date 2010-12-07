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
   * @throws PDOException
   * @return var string
   */
  public function getAllPrefs($id, $scope = null) {

    $prefs = array();

    try {
      $qry = "SELECT * FROM user_prefs WHERE user_id=?";
      if (!is_null($scope)) {
	$qry .= " AND pref_scope=?";
      }
      
      $stmt = $this->db->prepare($qry);
      $stmt->bindParam(1, $id, PDO::PARAM_INT);
      if (!is_null($scope)) {
	$stmt->bindParam(2, $scope);
      }
      
      $count = 0;
      while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
	$prefs[] = array('id' => $count++,
			 'pref_name' => $r['pref_name'],
			 'pref_scope' => $r['pref_scope'],
			 'pref_value' => $r['pref_value']);
      }
    } catch (PDOException $e) {
      throw($e);
    }
    
    return($prefs);
  }

  /**
   * Get preference
   *
   * @param id user id of owner of preference
   *        scope scope of preference to retrieve
   *        pref name of preference to retrieve
   * @throws PDOException
   * @return var string
   */
  public function getPref($id, $scope, $pref) {
    $pref_val = null;

    try {
      $stmt = $this->db->prepare("SELECT pref_value FROM user_prefs WHERE pref_scope=? AND pref_name=? AND user_id=?");
      $stmt->bindParam(1, $scope);
      $stmt->bindParam(2, $pref);
      $stmt->bindParam(3, $id, PDO::PARAM_INT);
      $stmt->execute();
      $r = $stmt->fetch(PDO::FETCH_ASSOC);
      
      if ($r) {
	$pref_val = $r['pref_value'];
      }
    } catch (PDOException $e) {
      throw($e);
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
   * @throws PDOException
   * @return none
   */
  public function setPref($id, $scope, $pref, $value) {
    $pref_val = null;

    try {
      $stmt = $this->db->prepare("REPLACE INTO user_prefs VALUES(?, ?, ?, ?)");
      $stmt->bindParam(1, $id, PDO::PARAM_INT);
      $stmt->bindParam(2, $scope);
      $stmt->bindParam(3, $pref);
      $stmt->bindParam(4, $value);
      $stmt->execute();
    } catch (PDOException $e) {
      throw($e);
    }
  }
}
?>
