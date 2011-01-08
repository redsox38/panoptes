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

require_once 'lib/panoptesDashboard.php';

// set current user global
if (isset($_SERVER['PHP_AUTH_USER'])) {
  $panoptes_current_user = $_SERVER['PHP_AUTH_USER'];
} else {
  $panoptes_current_user = 'webuser';
}

// load monitor object
$panoptes = new panoptesDashboard();

// see if it is an ajax request and process it if it is
// otherwise abort
if ((array_key_exists("HTTP_X_REQUESTED_WITH", $_SERVER)) && 
    $_SERVER["HTTP_X_REQUESTED_WITH"] == 'XMLHttpRequest') {
  header("Content-type: text/json");
  $action = 'ajax_' . $_REQUEST["action"];

  $data = $_REQUEST["data"];
  $data = str_replace("\\\"","\"",$data);

  $func_output = call_user_func(array($panoptes, $action), 
				json_decode($data, true));
  print json_encode($func_output);

  exit(0);
} else {
  exit(0);
}

