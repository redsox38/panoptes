<?php
require_once 'lib/panoptes.php';

function imageTextWrap($fontSize, $fontFace, $string, $width){
  $ret = "";   
  $arr = explode(' ', $string);
  
  foreach ( $arr as $word ){
    $teststring = $ret.' '.$word;
    $testbox = imagettfbbox($fontSize, 0, $fontFace, $teststring);
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

$ret = rrd_graph($rrd_info['image_file'], $rrd_info['rrd_opts'], 
		 count($rrd_info['rrd_opts']));

if(!is_array($ret)) {
  $fontsize = 10;
  $font = '/usr/share/fonts/truetype/freefont/FreeMono.ttf';
  $hgt = 175;
  $wdt = 500;

  $err = rrd_error();
  $im = imagecreatetruecolor(500, 175);

  
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
