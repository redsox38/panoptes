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
require_once 'lib/autoDiscoveryEntry.php';
require_once 'lib/userEntry.php';
require_once 'lib/userPrefs.php';

// set current user global
if (isset($_SERVER['PHP_AUTH_USER'])) {
  $panoptes_current_user = $_SERVER['PHP_AUTH_USER'];
} else {
  $panoptes_current_user = 'webuser';
}

// load monitor object
$panoptes = new panoptes();

// see if it is an ajax request and process it if it is
// otherwise render form
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
}

$dojo_url = $panoptes->config()->getConfigValue('web.dojo-url');
if (!$dojo_url) {
  echo "No dojo url defined!";
  exit(-1);
}

$user = new userEntry();
$user->db = $panoptes->getDb();
$user->getByName($panoptes_current_user);

$userPrefs = new userPrefs();
$userPrefs->db = $panoptes->getDb();
$theme = $userPrefs->getPref($user->id, 'general', 'general_prefs_theme');
if (is_null($theme)) {
  $theme = $panoptes->config()->getConfigValue('web.default_theme');
}
$theme_css = $dojo_url . '/dijit/themes/' . $theme . '/' . $theme . '.css';
$theme_grid_css = $dojo_url . '/dojox/grid/resources/' . $theme . 'Grid.css';
$theme_e_grid_css = $dojo_url . '/dojox/grid/enhanced/resources/' . $theme . 'EnhancedGrid.css';

$chart_theme = $userPrefs->getPref($user->id, 'general', 'general_prefs_chart_theme');
if (is_null($chart_theme)) {
  $chart_theme = $panoptes->config()->getConfigValue('web.default_chart_theme');
}
?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html dir="ltr">
<head>
        <title>panoptes</title>
<?php
  echo '<link rel="stylesheet" type="text/css" href="' . $theme_css . '"/>' . "\n";
?>        
        <link rel="stylesheet" type="text/css" href="panoptes.css"/>
        <style type="text/css">
<?php
  echo '@import "' . $dojo_url . '/dojox/grid/resources/Grid.css";' . "\n"; 
  echo '@import "' . $theme_grid_css . '";' . "\n";
  echo '@import "' . $theme_e_grid_css . '";' . "\n";
  echo '@import "' . $dojo_url . '/dojox/grid/enhanced/resources/EnhancedGrid_rtl.css";' . "\n";
?>
        </style>
<?php
  echo '<script type="text/javascript" src="' . $dojo_url . '/dojo/dojo.js" djConfig="parseOnLoad: true">' .
	"\n";
?>
    </script>
    <script type="text/javascript">
        dojo.require("dojox.grid.EnhancedGrid");
        dojo.require("dojox.grid.enhanced.plugins.NestedSorting");
        dojo.require("dojox.grid.enhanced.plugins.IndirectSelection");
        dojo.require("dojox.grid.enhanced.plugins.Menu");
        dojo.require("dojox.charting.Chart");
        dojo.require("dojox.charting.Chart2D");
        dojo.require("dojox.charting.plot2d.Pie");
        dojo.require("dojox.charting.action2d.Tooltip");
        dojo.require("dojox.charting.action2d.MoveSlice");
        dojo.require("dojox.charting.widget.Legend");
        dojo.require("dojo.data.ItemFileReadStore");
        dojo.require("dojo.data.ItemFileWriteStore");
        dojo.require("dojo.dnd.Source");
        dojo.require("dijit.layout.AccordionContainer");
        dojo.require("dijit.layout.BorderContainer");
        dojo.require("dijit.layout.AccordionPane");
        dojo.require("dijit.layout.TabContainer");
        dojo.require("dijit.layout.ContentPane");
        dojo.require("dijit.MenuItem");
        dojo.require("dijit.Tree");
        dojo.require("dijit.Menu");
        dojo.require("dijit.Tooltip");
        dojo.require("dijit.form.FilteringSelect");
        dojo.require("dijit.form.NumberSpinner");
        dojo.require("dijit.form.DateTextBox");
        dojo.require("dijit.form.TimeTextBox");
        dojo.require("dijit.tree.dndSource");
        dojo.require("dijit.form.ComboBox");
        dojo.require("dijit.form.TextBox");
        dojo.require("dijit.form.Button");
    </script>
    <script type="text/javascript" src="js/_preload.js"></script>
    <script type="text/javascript" src="js/_utils.js"></script>
    <script type="text/javascript" src="js/_discovery.js"></script>
    <script type="text/javascript" src="js/_devices.js"></script>
    <script type="text/javascript" src="js/_tools.js"></script>
<?php
	  echo "<script>dojo.require(\"dojox.charting.themes." . 
	  $chart_theme . "\");</script>\n";

	  if ($panoptes->isAdmin($panoptes_current_user)) {
	    echo '<script type="text/javascript" src="js/_users.js"></script>' . "\n";
	  }
?>

</head>
<?php
echo '<body class="' . $theme . '">' . "\n";
?>
<!-- 
Context menus
//-->
    <!-- Context menu for monitor grid //-->
    <div dojoType="dijit.Menu" id="monitorMenu" style="display: none;">
        <div dojoType="dijit.MenuItem" id="monitorMenuAdd" iconClass="panoptesIconAdd" onClick="addMonitor();">
            Add New
        </div>  
        <div dojoType="dijit.MenuItem" id="monitorMenuAcknowledge" onClick="ackMonitor();">
            Acknowledge
        </div>
        <div dojoType="dijit.MenuItem" id="monitorMenuDisable" iconClass="panoptesIconDisable" onClick="disableMonitor();">
            Disable
        </div>
        <div dojoType="dijit.MenuItem" id="monitorMenuEnable" iconClass="panoptesIconEnable" onClick="enableMonitor();">
            Enable
        </div>
        <div dojoType="dijit.MenuItem" id="monitorMenuDelete" iconClass="panoptesIconDelete" onClick="deleteMonitor();">
            Delete
        </div>
        <div dojoType="dijit.MenuItem" id="monitorMenuReschedule" iconClass="panoptesIconReschedule" onClick="rescheduleMonitor();">
            Reschedule
        </div>
        <div dojoType="dijit.MenuItem" id="monitorMenuAddNotification" iconClass="panoptesIconAddNotification" onClick="addNotification();">
            Add Notification
        </div>
        <div dojoType="dijit.MenuItem" id="monitorMenuManageNotifications" iconClass="panoptesIconReschedule" onClick="manageNotifications();">
            Manage Notification Schedule
        </div>
        <div dojoType="dijit.MenuItem" id="monitorMenuRemoveNotification" iconClass="panoptesIconRemoveNotification" onClick="removeNotification();">
            Remove Notification
        </div>
        <div dojoType="dijit.MenuItem" id="monitorMenuCopy" iconClass="dijitEditorIcon dijitEditorIconCopy" onClick="cloneMonitor();">
            Copy to another device
        </div>
    </div>

    <!-- Context menu for device objects in device tree //-->
    <div dojoType="dijit.Menu" id="device_tree_menu" style="display: none;">
        <div dojoType="dijit.MenuItem" iconClass="dijitIconTask" onClick="openDevice();">
            Open Device
        </div>
        <div dojoType="dijit.MenuItem" iconClass="panoptesIconAddGroup" onClick="addToGroup();">
	    Add to Group
        </div>
        <div dojoType="dijit.MenuItem" onClick="addParentDevice();">
            Add Parent Device
        </div>
        <div dojoType="dijit.MenuItem" iconClass="dijitIconEdit" onClick="editDeviceInfo();">
            Edit Device Info
        </div>
        <div dojoType="dijit.MenuItem" iconClass="panoptesIconDeleteGroup" onClick="removeFromGroup();">
            Remove from Group
        </div>
        <div dojoType="dijit.MenuItem" iconClass="panoptesIconReschedule" onClick="scheduleOutage();">
            Schedule Outage
        </div>
        <div dojoType="dijit.MenuItem" iconClass="panoptesIconDelete" onClick="deleteDevice();">
            Delete Device 
        </div>
        <div dojoType="dijit.MenuItem" iconClass="panoptesIconAddNotification" onClick="addDeviceNotification();">
            Add Notification
        </div>
        <div dojoType="dijit.MenuItem" iconClass="panoptesIconRemoveNotification" onClick="removeDeviceNotification();">
            Remove Notification
        </div>
        <div dojoType="dijit.MenuItem" iconClass="dijitEditorIcon dijitEditorIconCopy" onClick="applyDeviceTemplate();">
            Apply Template
        </div>
    </div>

    <!-- Context menu for group objects in device tree //-->
    <div dojoType="dijit.Menu" id="device_tree_group_menu" style="display: none;">
        <div dojoType="dijit.MenuItem" iconClass="panoptesIconAccess" onClick="manageDeviceGroupAccess();">
            Manage Access
        </div>
        <div dojoType="dijit.MenuItem" iconClass="panoptesIconDelete" onClick="deleteDeviceGroup();">
            Delete Group
        </div>
    </div>

    <!-- Context menu for auto discovery grid grid //-->
    <div dojoType="dijit.Menu" id="autoDiscoveryRowMenu" style="display: none;">
        <div dojoType="dijit.MenuItem" iconClass="dijitEditorIcon dijitEditorIconSave" onClick="monitorEntry('dst');">
            Monitor Entry
        </div>
        <div dojoType="dijit.MenuItem" iconClass="dijitIconDelete" onClick="ignoreEntry();">
            Ignore Entry
        </div>
    </div>

    <div id="master_layout" dojoType="dijit.layout.BorderContainer" style="width: 100%; height: 100%;">
        <div id="top_nav" region="top" dojoType="dijit.layout.ContentPane">
            <div id="loading_img" style="visibility: hidden;">
                <img src="images/loading.gif"/>
            </div>
            <div style="display: none;">
                <img src="images/panoptesIcons.png"/>
            </div>
        </div>
        <div id="left_nav" region="leading" dojoType="dijit.layout.AccordionContainer" style="width: 15%;" splitter="true">
            <div id="tools" title="Tools" dojoType="dijit.layout.AccordionPane">
                <div>
	        <a href="#" onClick="openPrefTab();">User Preferences</a><br/>
                </div>
                <div>
	        <a href="#" onClick="addPingable();">Add Pingable Device</a><br/>
                </div>
                <div>
	        <a href="#" onClick="openAutoDiscoveryTab();">Auto Discovery</a><br/>
                </div>
                <div>
	        <a href="#" onClick="openEditDashboardTab();">Edit Dashboard</a><br/>
                </div>
                <div>
	        <a href="#" onClick="openTemplateTab();">Manage Templates</a><br/>
                </div>
<?php
	  if ($panoptes->isAdmin($panoptes_current_user)) {
            echo '<div>' . "\n";
	    echo '<a href="#" onClick="uploadFile();">Upload Shell Script</a></br>' . "\n";
            echo '</div>' . "\n";
            echo '<div>' . "\n";
	    echo '<a href="#" onClick="openSecurityGroupTab();">Manage Security Groups</a></br>' . "\n";
            echo '</div>' . "\n";
	  }
?>
            </div>
            <div id="device_list" title="Device List" dojoType="dijit.layout.AccordionPane">
                <div id="device_tree_container"></div>
            </div>
        </div>

        <div id="panoptes_tab_container" region="center" dojoType="dijit.layout.TabContainer">
            <div id="dashboard_tab" title="Dashboard" dojoType="dijit.layout.ContentPane">
            </div>
<?php
	  if ($panoptes->isAdmin($panoptes_current_user)) {
            echo '           <div id="user_mgmt_tab" title="Manage Users" dojoType="dijit.layout.ContentPane" onShow="buildUserForm();" style="height: 100%; width: 100%;">' . "\n";
	    echo '           </div>' . "\n";
	  }
?>
    </div>
</body>
</html>
