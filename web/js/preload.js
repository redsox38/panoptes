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
		action: 'getGroups',
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
		    identifier: "id",
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
    });

