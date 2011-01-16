<?php
// just return image and then delete the file
$file = $_REQUEST['file'];

if (preg_match('/^\/tmp\/dashboard_image_/', $file)) {
  header("Content-type: image/png");
  ob_clean();
  flush();
  readfile($file);
  //  unlink($file);
} 
?>