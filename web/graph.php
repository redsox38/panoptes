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

require_once 'lib/panoptes.php';

function imageTextWrap($fontSize, $fontFace, $string, $width){
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

//load monitor object
$panoptes = new panoptes();

$rrd_info = $panoptes->getRRDInfo($_REQUEST['id'],
				  $_REQUEST['metric']);

// parse start/end dates from user input
$sd = date_parse_from_format('D M d Y H:i:s \G\M\TO \(T\)', $_REQUEST['start']);
$ed = date_parse_from_format('D M d Y H:i:s \G\M\TO \(T\)', $_REQUEST['stop']);

$opts = array();

$start = sprintf("--start=%ld", mktime(0, 0, 0, $sd['month'], $sd['day'], 
				       $sd['year']));
$end = sprintf("--end=%ld", mktime(0, 0, 0, $ed['month'], $ed['day'], 
				   $ed['year']));

// and push onto start of parameter array
array_unshift($rrd_info['rrd_opts'], $end);
array_unshift($rrd_info['rrd_opts'], $start);

$ret = rrd_graph($rrd_info['image_file'], $rrd_info['rrd_opts'], 
		 count($rrd_info['rrd_opts']));

if(!is_array($ret)) {
  $fontsize = 10;
  $font = $panoptes->config()->getConfigValue('web.gd_font');
  $hgt = 175;
  $wdt = 500;

  $err = rrd_error();
  $im = imagecreatetruecolor($wdt, $hgt);

  
  // set foreground and background colors
  $bg_color = imagecolorallocate($im, 255, 255, 255);
  $fg_color = imagecolorallocate($im, 0, 0, 0);

  imagefilledrectangle($im, 0, 0, $wdt, $hgt, $bg_color);

  // wrap text to fit in image
  $err = imageTextWrap($fontsize, $font, $err, $wdt);

  imagettftext($im, $fontsize, 0, 0, ($hgt / 3), $fontsize, $font, $err);

  header("Content-type: image/png");
  imagepng($im);

  imagedestroy($im);
} else {
  header("Content-type: image/png");
  ob_clean();
  flush();
  readfile($rrd_info['image_file']);
}

?>
