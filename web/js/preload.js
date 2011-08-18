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

var deviceTree;
var deviceStore;
var deviceTreeSelectedItem;
var groupStore;
var alertStore;
var portMonitorStore;
var perfMonitorStore;
var certificateMonitorStore;
var SNMPMonitorStore;
var shellMonitorStore;
var availableShellMonitorStore;
var urlMonitorStore;
var userStore;
var prefStore;
var templateStore;
var timers = [];

var dashboard_edit_mode = false;
var loading_count = 0;
var dojoVersion;

v = dojo.version;
dojoVersion = (v.major * 100) + (v.minor * 10) + v.patch;

//
// loadUsers - load users from server into userStore
// @param none
// @return none
//
function loadUsers() {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getUser',
	    data: '{ }'
	},
	load: function(data) {
	    if (data && !data.error) {
		// fill in data store
		dojo.forEach(data.data, function(item) {
			userStore.newItem(item);
		    });
		userStore.save();
	    } else {
		alert(data.error);
	    }
	},
    };

    dojo.xhrGet(xhrArgs);    
}

//
// loadGroups - load users from server into groupStore
// @param none
// @return none
//
function loadGroups() {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getSecurityGroups',
	    data: '{ }'
	},
	load: function(data) {
	    if (data && !data.error) {
		if (data.data) {
		    // fill in data store
		    dojo.forEach(data.data, function(item) {
		        userStore.newItem(item);
		    	});
		    userStore.save();
		}
	    } else {
		alert(data.error);
	    }
	},
    };

    dojo.xhrGet(xhrArgs);    
}

//
// getSelectedTreeNode - function passed to onSelect of device tree
//                       sets global variable to the current selected item
// @param {Object} item dojo item represented by this node in the device tree
// @param {Object} node tree node of selected item, ignored
// @param {Event} e event that selected the item, ignored
// @return none
//
function getSelectedTreeNode(item, node, e) {
    // set global variables for processing 
    // menu option later
    deviceTreeSelectedItem = item;
};

//
// reloadDeviceTree - called when a new device is added to add the device
//                    to the device store and add a new node to the tree
// @param none
// @return none
//
function reloadDeviceTree() {

    if (dijit.byId('device_tree')) {
	dijit.byId('device_tree').destroy();
    }

    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getDeviceList',
	    data: '{}'
	},
	load: function(data) {
	    hideLoading();
	    if (data && !data.error) {
		var device_data = {
		    label: "name",
		    identifier: "id",
		    items: data.data
		};

		deviceStore = new dojo.data.ItemFileWriteStore({
			data: device_data
		    });

		var treeModel = new dijit.tree.ForestStoreModel({
			store: deviceStore,
			query: { "type" : "group" },
			rootId: "root",
			rootLabel: "Devices",
			childrenAttrs: ["children"]
		    });

		deviceTree = new dijit.Tree({
			model: treeModel,
			id: 'device_tree',
			showRoot: false,
			getIconClass: function(itm, opened) {
			    if (itm !== undefined && itm !== null) {
				if (itm.type == 'group') {
				    return(opened ? "dijitFolderOpened" : 
					   "dijitFolderClosed");
				}
				if (itm.os == 'Linux') {
				    return("panoptesIconOSLinux");
				} else if (itm.os == 'Windows') {
				    return("panoptesIconOSWin");
				} else {
				    return("dijitLeaf");
				}
			    }
			},
			onClick: getSelectedTreeNode
		    });		    
		
		deviceTree.placeAt(document.getElementById('device_tree_container'));

		// bind  group menu to groups
		deviceStore.fetch({
			query: { type: 'group' },
			    onItem: function(item, req) {
			    var device_group_menu = dijit.byId('device_tree_group_menu');
			    
			    // get group name
			    var name = deviceStore.getValue(item, "name");
			    
			    if (name != "ungrouped") {
				// set group menu on group nodes
				var itemNode = deviceTree.getNodesByItem(deviceTree.model.getIdentity(item));
				if (itemNode[0]) {
				    device_group_menu.bindDomNode(itemNode[0].domNode);
				}
			    }
			}
		    });
		
		// bind device menu to devices
		deviceStore.fetch({
			query: { type: 'device' },
			    onItem: function(item, req) {
			    var device_menu = dijit.byId('device_tree_menu');
			    
			    // get device name
			    var name = deviceStore.getValue(item, "name");
			    
			    if (name != "") {
				// set device menu
				var itemNode = deviceTree.getNodesByItem(deviceTree.model.getIdentity(item));
				if (itemNode[0]) {
				    device_menu.bindDomNode(itemNode[0].domNode);
				}
			    }
			}
		    });
	    } else {
		alert(data.error);
	    }
	},
    };

    showLoading();
    var resp = dojo.xhrGet(xhrArgs);

    // run again in 15 minutes in case somebody else has made modifications
    setTimeout(reloadDeviceTree, 900000);
}

//
// createDeviceTree - create and populate device tree
// @param none
// @return none
//
function createDeviceTree(){
    if (!deviceTree) {

	//load functions for device view
	var handle = dojo.xhrGet({
		url: '/panoptes/js/device_view.js',
		handleAs: 'javascript',
		sync: true
	    });

	reloadDeviceTree();	
    }

    // load groups while we're here for combobox later

    if (!groupStore) {
	var xhrGrpArgs = {
	    url: '/panoptes/',
	    handleAs: 'json',
	    content: {
		action: 'getDeviceGroups',
		data: '{}'
	    },
	    load: function(data) {
		if (data && !data.error) {
		    var group_data = {
			label: "name",
			identifier: "id",
			items: data.data
		    };
		    
		    groupStore = new dojo.data.ItemFileWriteStore({
			    data: group_data
			});
		} else {
		    alert(data.error);
		}
	    },
	};
	
	dojo.xhrGet(xhrGrpArgs);
    }
}

// 
// loadAvailableShellScripts - retrieve a list of current shell script 
//                             monitors installed on the server
// @param none
// @return none
//
function loadAvailableShellScripts() {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getShellMonitors',
	    data: '{ }'
	},
	load: function(data) {
	    if (data && !data.error) {
		// fill in data store
		all_shell_data = {
		    label: "all_shell_data",
		    identifier: "script",
		    items: data.data
		};

		availableShellMonitorStore = new dojo.data.ItemFileWriteStore({
			data: all_shell_data
		    });
	    } else {
		alert(data.error);
	    }
	},
    };

    dojo.xhrGet(xhrArgs);    
}

dojo.addOnLoad(function(){
	loadAvailableShellScripts();

	all_user_data = {
	    label: "name",
	    identifier: "id",
	    items: []
	};

	userStore = new dojo.data.ItemFileWriteStore({
		data: all_user_data
	    });

	pref_data = {
	    label: 'pref_name',
	    identifier: 'id',
	    items: []
	};

	prefStore = new dojo.data.ItemFileWriteStore({
		data: pref_data
	    });

	loadUsers();
	loadUserPrefs();
	loadGroups();
	createDeviceTree();
	loadDashboard();
    });

