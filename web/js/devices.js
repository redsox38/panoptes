var deviceTree;
var deviceStore;
var deviceTreeSelectedItem;
var groupStore;
var portMonitorStore;
var perfMonitorStore;
var certificateMonitorStore;
var SNMPMonitorStore;

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

function xhrScheduleOurage(device_id) {
}

function xhrGroupAdd(attr_name, device_id) {

    grp = dijit.byId(attr_name).attr('value');
    
    // add group to groupStore if it's a new group


    var xhrGrpArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'addGroupMember',
	    data: '{ "id": "' + device_id + '", "name": "' + grp + '" }'
	    },
	load: function(data) {
	    if (data && !data.error) {
		// update group store and refresh device tree
		req = deviceStore.fetch({ query: { name: grp,
						   type: 'group'}, 
					  onItem: function (itm) {
			}});
	    } else {
		alert(data.error);
	    }
	},
    };
	
    dojo.xhrGet(xhrGrpArgs);
    
    dijit.byId(attr_name).destroy();
    
    document.body.removeChild(document.getElementById("add_to_device_group_win"));
}

function deleteDevice() {
    var id = deviceStore.getValues(deviceTreeSelectedItem, 'id').toString();
    id = id.replace("d_", "");
    var name = deviceStore.getValues(deviceTreeSelectedItem, 'name');

    if (confirm('All historical data will be lost.\nReally delete ' + name + '?')) {
        var xhrArgs = {
       	    url: '/panoptes/',
	    handleAs: 'json',
	    content: {
	        action: 'deleteDevice',
	        data: '{ "id": "' + id + '" }'
	    },
	    load: function(data) {
	        if (data && !data.error) {
                    // update data store
	        } else {
	    	    alert(data.error);
	        }
	    },
        };
	
        dojo.xhrGet(xhrArgs);
    }
}

function scheduleOutage() {
    var id = deviceStore.getValues(deviceTreeSelectedItem, 'id').toString();
    id = id.replace("d_", "");

    start_date = new dijit.form.DateTextBox({
            id: 'outage_start_date',
            name: 'outage_start_date',
            closable: true,
            title: 'Start Date',
            constraints: { datePattern:'MM/dd/yyyy'}
        });

    stop_date = new dijit.form.DateTextBox({
            id: 'outage_stop_date',
            name: 'outage_stop_date',
            closable: true,
            title: 'Stop Date',
            constraints: { datePattern:'MM/dd/yyyy'}
        });

    rst = new dijit.form.Button({
	    label: 'Cancel',
	    id: 'schedule_outage_reset',
	    onClick: function() {
		dijit.byId("outage_start_date").destroy();
		dijit.byId("outage_stop_date").destroy();
		dijit.byId("schedule_outage_reset").destroy();
		dijit.byId("schedule_outage_submit").destroy();
		document.body.removeChild(document.getElementById("schedule_outage_win"));
	    }
	});

    sub = new dijit.form.Button({
	    label: 'Add',
	    id: 'schedule_outage_submit',
	    onClick: function() {
		xhrScheduleOutage(id);
		dijit.byId("outage_start_date").destroy();
		dijit.byId("outage_stop_date").destroy();
		dijit.byId("schedule_outage_reset").destroy();
		dijit.byId("schedule_outage_submit").destroy();
		document.body.removeChild(document.getElementById("schedule_outage_win"));
	    }
	});

    var items = [ start_date.domNode, 
		  stop_date.domNode,
		  document.createElement("br"),
		  rst.domNode, sub.domNode ];
    
    createOverlayWindow("schedule_outage_win", items);
}

function removeFromGroup() {
    var id = deviceStore.getValues(deviceTreeSelectedItem, 'id').toString();
    var name = deviceStore.getValues(deviceTreeSelectedItem, 'name');

    req = deviceStore.fetch({ query: { type: 'group' },
			      onItem: function (grp) {
		                  // see if this is the parent of the selected node
		                  deviceTree.model.getChildren(grp, function(items) { 
					  dojo.forEach(items, function(chld) { 
						  if ((chld) && 
						      (chld == deviceTreeSelectedItem)) {
						      alert(chld);
						  }
					      });
				      });
	    }
	});

    id = id.replace("d_", "");
    alert('Function not yet implemented');
}

function addToGroup() {
    var id = deviceStore.getValues(deviceTreeSelectedItem, 'id').toString();
    id = id.replace("d_", "");
    var name = deviceStore.getValues(deviceTreeSelectedItem, 'name');

    // create combo box and buttons
    cb = new dijit.form.ComboBox({
	    id: "group_to_add",
	    name: "group_to_add",
	    store: groupStore,
	    searchAttr: "name"
	}, "group_to_add");

    rst = new dijit.form.Button({
	    label: 'Cancel',
	    onClick: function() {
		dijit.byId("group_to_add").destroy();

		document.body.removeChild(document.getElementById("add_to_device_group_win"));
	    }
	});

    sub = new dijit.form.Button({
	    label: 'Add',
	    onClick: function() {
		xhrGroupAdd("group_to_add", id);
	    }
	});

    var items = [ cb.domNode, rst.domNode, sub.domNode ];
    
    createOverlayWindow("add_to_device_group_win", items);

}

dojo.addOnLoad(function(){
	dojo.connect(dijit.byId("device_list"), "onShow",
		     dojo.partial(createDeviceTree));
    });

