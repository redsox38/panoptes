var deviceTree;
var deviceStore;
var deviceTreeSelectedItem;
var groupStore;

function getSelectedTreeNode(item, node, e) {
    // set global variables for processing 
    // menu option later
    deviceTreeSelectedItem = item;
};

function createDeviceTree(){
    if (!deviceTree) {

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
			    showRoot: false
			},
			"device_tree");		    

		    deviceTree.onClick = getSelectedTreeNode;
		    
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

function openDevice() {
    // get selected tree item
    var id = deviceStore.getValues(deviceTreeSelectedItem, 'id').toString();
    id = id.replace("d_", "");
    var name = deviceStore.getValues(deviceTreeSelectedItem, 'name');
						
    // border container to hold the content for the tab for this
    // device
    var bc = new dijit.layout.BorderContainer({
	    id: id + '_tab',
	    title: name,
	    style: "width: 100%; height: 100%;",
	    closable: true
	});

    // info pane for new tab
    var ic = new dijit.layout.ContentPane({
	    id: id + '_info',
	    title: ' Device Info',
	    region: 'leading',
	    style: 'width: 15%',
	    content: 'info',	    
	});

    // header for new tab
    var hc = new dijit.layout.ContentPane({
	    id: id + '_hdr',
	    region: 'top',
	    title: 'Device Header',
	    content: '<b>' + name + '</b>'
	});

    // tab container for new tab
    var tc = new dijit.layout.TabContainer({
            id: id + '_tc',
	    region: 'center',
	    style: "height: 100%; width: 100%;"
	});

    // tabs for new tab tab container
    var tc_1 = new dijit.layout.ContentPane({
	    id: id + '_tc_avail',
	    title: 'Availability',
	    content: 'availability monitors',	    
	});
    
    var tc_2 = new dijit.layout.ContentPane({
	    id: id + '_tc_perf',
	    title: 'Performance',
	    content: 'performance monitors',	    
	});
    
    // put all of the components together in border container
    // and append to parent tab
    tc.addChild(tc_1);
    tc.addChild(tc_2);
    bc.addChild(ic);
    bc.addChild(hc);
    bc.addChild(tc);
    
    dijit.byId("panoptes_tab_container").addChild(bc);
    dijit.byId("panoptes_tab_container").selectChild(bc);
}

function xhdrGroupAdd(attr_name, device_id) {

    grp = dijit.byId(attr_name).attr('value');
    
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
	    } else {
		alert(data.error);
	    }
	},
    };
	
    dojo.xhrGet(xhrGrpArgs);
    
    dijit.byId(attr_name).destroy();
    
    document.body.removeChild(document.getElementById("add_to_device_group_win")
);
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
		xhdrGroupAdd("group_to_add", id);
	    }
	});

    // create new div 
    // with transparent background 
    // defined in css

    var dv1 = document.createElement("div");
    dv1.id = "add_to_device_group_win";
    dv1.innerHTML = "";
    
    // create white background div 
    // to hold form elements
    var dv2 = document.createElement("div");
    dv2.id = "add_to_device_group_win_bg";
    dv2.style.backgroundColor = "white";
    dv2.style.color = "black";
    dv2.style.border = "solid";
    dv2.style.marginTop = "50px";
    dv2.style.marginBottom = "50px";
    dv2.style.marginLeft = "250px";
    dv2.style.marginRight = "250px";
    dv2.style.align = "center";
    dv2.zIndex = 51;

    dv2.appendChild(cb.domNode);
    dv2.appendChild(rst.domNode);
    dv2.appendChild(sub.domNode);

    // make the div big enough to display
    dv2.appendChild(document.createElement("br"));
    dv2.appendChild(document.createElement("br"));
    dv2.appendChild(document.createElement("br"));
    dv2.appendChild(document.createElement("br"));
    dv1.appendChild(dv2);

    document.body.appendChild(dv1);    
}

dojo.addOnLoad(function(){
	dojo.connect(dijit.byId("device_list"), "onShow",
		     dojo.partial(createDeviceTree));
    });

