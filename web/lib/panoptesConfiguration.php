<?php
/**
 * panoptesConfiguration class
 *
 * Class for interacting with panoptes XML Config file
 *
 * @version 0.01
 * @author Todd Merritt <redsox38@gmail.com>
 * @project panoptes
 *
 */
class panoptesConfiguration
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

  public function __construct() {
    $this->config_file = '/home/tmerritt/panoptes/config.xml';
    $xml = file_get_contents($this->config_file);
    
    $t = $this->_xml2ary($xml);
    $this->configuration = $t['config'];
  }

  /**
   * Retrieve value from xml configuration
   *
   * @param name string to retrieve value for
   *             format is node.attr
   * @throws none
   * @return string value for requested configuration param
   */
  public function getConfigValue($name) {
    // break name into element and attribute
    $pos = strpos($name, ".");

    $element = substr($name, 0, $pos);
    $attr    = substr($name, $pos+1);
    
    return($this->configuration[$element . "_attr"][$attr]);
  }

  private function _xml2ary(&$string, $get_attributes = 1, $priority = 'tag') {
    $parser = xml_parser_create();
    xml_parser_set_option($parser, XML_OPTION_CASE_FOLDING, 0);
    xml_parser_set_option($parser, XML_OPTION_SKIP_WHITE, 1);
    xml_parse_into_struct($parser, trim($string), $xml_values);
    xml_parser_free($parser);

    if (!$xml_values)
        return; //Hmm...

    $xml_array = array ();
    $parents = array ();
    $opened_tags = array ();
    $arr = array ();
    $current = & $xml_array;
    $repeated_tag_index = array ();
    foreach ($xml_values as $data) {
      unset ($attributes, $value);
      extract($data);
      $result = array ();
      $attributes_data = array ();
      if (isset ($value)) {
	if ($priority == 'tag')
	  $result = $value;
	else
	  $result['value'] = $value;
      }

      if (isset ($attributes) and $get_attributes) {
	foreach ($attributes as $attr => $val) {
	  if ($priority == 'tag')
	    $attributes_data[$attr] = $val;
	  else
	    //Set all the attributes in a array called 'attr'
	    $result['attr'][$attr] = $val; 
	}
      }

      if ($type == "open") {
	$parent[$level -1] = & $current;
	if (!is_array($current) or (!in_array($tag, array_keys($current)))) {
	  $current[$tag] = $result;
	  if ($attributes_data)
	    $current[$tag . '_attr'] = $attributes_data;
	  $repeated_tag_index[$tag . '_' . $level] = 1;
	  $current = & $current[$tag];
	} else {
	  if (isset ($current[$tag][0])) {
	    $current[$tag][$repeated_tag_index[$tag . '_' . $level]] = $result;
	    $repeated_tag_index[$tag . '_' . $level]++;
	  } else {
	    $current[$tag] = array (
				    $current[$tag],
				    $result
				    );
	    $repeated_tag_index[$tag . '_' . $level] = 2;

	    if (isset ($current[$tag . '_attr'])) {
	      $current[$tag]['0_attr'] = $current[$tag . '_attr'];
	      unset ($current[$tag . '_attr']);
	    }
	  }
	  $last_item_index = $repeated_tag_index[$tag . '_' . $level] - 1;
	  $current = & $current[$tag][$last_item_index];
	}
      } elseif ($type == "complete") {
	if (!isset ($current[$tag])) {
	  $current[$tag] = $result;
	  $repeated_tag_index[$tag . '_' . $level] = 1;
	  if ($priority == 'tag' and $attributes_data)
	    $current[$tag . '_attr'] = $attributes_data;
	} else {
	  if (isset ($current[$tag][0]) and is_array($current[$tag])) {
	    $current[$tag][$repeated_tag_index[$tag . '_' . $level]] = $result;
	    if ($priority == 'tag' and $get_attributes and $attributes_data) {
	      $current[$tag][$repeated_tag_index[$tag . '_' . $level] . '_attr'] = $attributes_data;
	    }
	    $repeated_tag_index[$tag . '_' . $level]++;
	  } else {
	    $current[$tag] = array (
				    $current[$tag],
				    $result
				    );
	    $repeated_tag_index[$tag . '_' . $level] = 1;
	    if ($priority == 'tag' and $get_attributes) {
	      if (isset ($current[$tag . '_attr'])) {
		$current[$tag]['0_attr'] = $current[$tag . '_attr'];
		unset ($current[$tag . '_attr']);
	      }
	      if ($attributes_data) {
		$current[$tag][$repeated_tag_index[$tag . '_' . $level] . '_attr'] = $attributes_data;
	      }
	    }
	    //0 and 1 index is already taken
	    $repeated_tag_index[$tag . '_' . $level]++; 
	  }
	}
      } elseif ($type == 'close') {
	$current = & $parent[$level -1];
      }
    }
    return ($xml_array);    
  }
}
?>
