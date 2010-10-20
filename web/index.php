<?php

require_once 'Zend/Loader/Autoloader.php';
require_once 'lib/panoptes.php';
require_once 'lib/autoDiscoveryEntry.php';

$al = Zend_Loader_Autoloader::getInstance(); 

// load current request
$req = new Zend_Controller_Request_Http();

// load monitor object
$panoptes = new panoptes();

// see if it is an ajax request and process it if it is
// otherwise render form
if ($req->isXmlHttpRequest()) {
  require_once('Zend/Json.php');
  
  header("Content-type: text/json");
  $action = 'ajax_' . $_REQUEST["action"];

  $data = $_REQUEST["data"];
  $data = str_replace("\\\"","\"",$data);

  $func_output = call_user_func(array($panoptes, $action), Zend_Json::decode($data));
  print Zend_Json::encode($func_output);

  exit(0);
}

?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html dir="ltr">
<head>
        <title>panoptes</title>
        <link rel="stylesheet" type="text/css" href="js/dijit/themes/claro/claro.css"/>
        <link rel="stylesheet" type="text/css" href="panoptes.css"/>
        <style type="text/css">
            @import "js/dojox/grid/resources/Grid.css"; 
            @import "js/dojox/grid/resources/claroGrid.css";
            @import "js/dojox/grid/enhanced/resources/claroEnhancedGrid.css";
            @import "js/dojox/grid/enhanced/resources/EnhancedGrid_rtl.css";
        </style>
    <script type="text/javascript" src="js/dojo/dojo.js" djConfig="parseOnLoad: true">
    </script>
    <script type="text/javascript">
        dojo.require("dojox.grid.EnhancedGrid");
        dojo.require("dojox.grid.enhanced.plugins.NestedSorting");
        dojo.require("dojox.grid.enhanced.plugins.IndirectSelection");
        dojo.require("dojox.grid.enhanced.plugins.Menu");
        dojo.require("dojo.data.ItemFileWriteStore");
        dojo.require("dijit.layout.BorderContainer");
        dojo.require("dijit.layout.ContentPane");
        dojo.require("dijit.layout.AccordionPane");
        dojo.require("dijit.layout.TabContainer");
        dojo.require("dijit.layout.AccordionContainer");
        dojo.require("dijit.Tree");
        dojo.require("dijit.Menu");
        dojo.require("dijit.MenuItem");
        dojo.require("dijit.form.Button");
        dojo.require("dijit.form.ComboBox");
    </script>
    <script type="text/javascript" src="js/discovery.js"></script>
    <script type="text/javascript" src="js/devices.js"></script>

</head>
<body class="claro">
    <div id="master_layout" dojoType="dijit.layout.BorderContainer" style="width: 100%; height: 100%;">
        <div id="left_nav" region="leading" dojoType="dijit.layout.AccordionContainer" style="width: 15%;" splitter="true">
            <div id="tools" title="Tools" dojoType="dijit.layout.AccordionPane">
                Tools
            </div>
            <div id="device_list" title="Device List" dojoType="dijit.layout.AccordionPane">
                <div id="device_tree"></div>
	            <div dojoType="dijit.Menu" id="device_tree_menu" style="display: none;">
                    <div dojoType="dijit.MenuItem" iconClass="dijitIconTask" onClick="openDevice();">
                        Open Device
                    </div>
                    <div dojoType="dijit.MenuItem" onClick="addToGroup();">
                        Add to Group
                    </div>
                </div>
            </div>
            <div id="dashboard_widgets" title="Dashboard Widgets" dojoType="dijit.layout.AccordionPane">
                Dashboard Widgets
            </div>
        </div>

        <div id="panoptes_tab_container" region="center" dojoType="dijit.layout.TabContainer">
            <div id="dashboard" title="Dashboard" dojoType="dijit.layout.ContentPane">
                Dashboard
            </div>
            <div id="auto_discovery_tab" title="Auto Discovery" dojoType="dijit.layout.ContentPane" style="height: 100%; width: 100%;">
                <div id="auto_discovery_grid" style="width: 100%; height: 100%;">
	            <div dojoType="dijit.Menu" id="autoDiscoveryRowMenu" style="display: none;">
                    <div dojoType="dijit.MenuItem" iconClass="dijitEditorIcon dijitEditorIconSave" onClick="monitorEntry('dst');">
                        Monitor Entry
                    </div>
                    <div dojoType="dijit.MenuItem" iconClass="dijitIconDelete" onClick="ignoreEntry();">
                        Ignore Entry
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
