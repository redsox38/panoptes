var deviceTree;
var deviceStore;
var deviceTreeSelectedItem;
var groupStore;
var portMonitorStore;
var perfMonitorStore;
var certificateMonitorStore;
var SNMPMonitorStore;
var shellMonitorStore;
var availableShellMonitorStore;
var urlMonitorStore;
var userStore;
var prefStore;

var dashboard_edit_mode = false;
var loading_count = 0;

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

function getSelectedTreeNode(item, node, e) {
    // set global variables for processing 
    // menu option later
    deviceTreeSelectedItem = item;
};

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
	dojo.connect(dijit.byId("device_list"), "onShow",
		     dojo.partial(createDeviceTree));

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
	loadDashboard();
    });

