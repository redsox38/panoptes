<?php
require_once 'lib/panoptes.php';

$file = '/tmp/' . $_REQUEST['id'] . '-' . $_REQUEST['metric'] . '.png';
$opts = array( "--vertical-label=B/s",
	       "DEF:time=/home/tmerritt/panoptes_rrds/127.0.0.1/port_monitors/tcp-80.rrd:ds0:AVERAGE",
	       "LINE1:time#0000FF:Out traffic\\r"
               );
$ret = rrd_graph($file, $opts, count($opts));

if(!is_array($ret)) {
  $err = rrd_error();
  echo "rrd_graph() ERROR: $err\n";
} else {
  header("Content-type: image/png");
  ob_clean();
  flush();
  readfile($file);
}

?>
