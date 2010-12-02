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
var userStore;

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

function createDeviceTree(){
    if (!deviceTree) {

	//load functions for device view
	var handle = dojo.xhrGet({
		url: '/panoptes/js/device_view.js',
		handleAs: 'javascript',
		sync: true
	    });

	var xhrArgs = {
	    url: '/panoptes/',
	    handleAs: 'json',
	    //sync: 'true',
	    content: {
		action: 'getDeviceList',
		data: '{}'
	    },
	    load: function(data) {
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
			    showRoot: false,			
			    onClick: getSelectedTreeNode
			},
			"device_tree");		    
		    
		    // connect context menu to tree
		    dojo.connect(dijit.byId("device_tree"), "onLoad", function() {
			    var device_menu = dijit.byId("device_tree_menu");
			    device_menu.bindDomNode(this.domNode);
			});

		} else {
		    alert(data.error);
		}
	    },
	};
	
	var resp = dojo.xhrGet(xhrArgs);
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

	all_src_user_data = {
	    label: "name",
	    identifier: "id",
	    items: []
	};

	loadUsers();
	loadGroups();
    });

