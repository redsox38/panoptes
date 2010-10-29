<?php
require_once 'lib/panoptes.php';

//load monitor object
$panoptes = new panoptes();

$rrd_info = $panoptes->getRRDInfo($_REQUEST['id'],
				  $_REQUEST['metric']);

$ret = rrd_graph($rrd_info['image_file'], $rrd_info['rrd_opts'], 
		 count($rrd_info['rrd_opts']));

if(!is_array($ret)) {
  $err = rrd_error();
  echo "rrd_graph() ERROR: $err\n";
} else {
  header("Content-type: image/png");
  ob_clean();
  flush();
  readfile($rrd_info['image_file']);
}

?>
