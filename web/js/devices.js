
function xhrScheduleOutage(device_id) {
    start_date = dijit.byId("outage_start_date").attr('displayedValue');
    stop_date = dijit.byId("outage_stop_date").attr('displayedValue');
    start_time = dijit.byId("outage_start_time").attr('displayedValue');
    stop_time = dijit.byId("outage_stop_time").attr('displayedValue');

    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'scheduleDeviceOutage',
	    data: '{ "id": "' + device_id + '", "start_date": "' + 
	             start_date + '", "start_time": "' +
	             start_time + '", "stop_date": "' +
	             stop_date + '", "stop_time": "' + stop_time + '" }'
	    },
	load: function(data) {
	    if (data && data.error) {
		alert(data.error);
	    }
	},
    };
	
    dojo.xhrGet(xhrArgs);
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

    start_label = document.createElement("label");
    start_label.htmlFor = 'outage_start_date';
    start_label.appendChild(document.createTextNode('Outage Start'));

    start_date = new dijit.form.DateTextBox({
            id: 'outage_start_date',
            name: 'outage_start_date',
            closable: true,
            title: 'Start Date',
            constraints: { datePattern:'MM/dd/yyyy'}
        });

    start_time = new dijit.form.TimeTextBox({
            name: 'outage_start_time',
            id: 'outage_start_time',
            value: new Date(),
            constraints: {
                timePattern: 'HH:mm',
                clickableIncrement: 'T00:15:00',
                visibleIncrement: 'T00:15:00',
                visibleRange: 'T01:00:00'
            }});

    stop_label = document.createElement("label");
    stop_label.htmlFor = 'outage_stop_date';
    stop_label.appendChild(document.createTextNode('Outage Stop'));

    stop_date = new dijit.form.DateTextBox({
            id: 'outage_stop_date',
            name: 'outage_stop_date',
            closable: true,
            title: 'Stop Date',
            constraints: { datePattern:'MM/dd/yyyy'}
        });

    stop_time = new dijit.form.TimeTextBox({
            name: 'outage_stop_time',
            id: 'outage_stop_time',
            value: new Date(),
            constraints: {
                timePattern: 'HH:mm',
                clickableIncrement: 'T00:15:00',
                visibleIncrement: 'T00:15:00',
                visibleRange: 'T01:00:00'
            }});

    rst = new dijit.form.Button({
	    label: 'Cancel',
	    id: 'schedule_outage_reset',
	    onClick: function() {
		dijit.byId("outage_start_date").destroy();
		dijit.byId("outage_stop_date").destroy();
		dijit.byId("schedule_outage_reset").destroy();
		dijit.byId("schedule_outage_submit").destroy();
		dijit.byId("outage_start_time").destroy();
		dijit.byId("outage_stop_time").destroy();
		// destroy remaining dom nodes
		win = document.getElementById("schedule_outage_win");
		while (win.hasChildNodes() >= 1) {
		    win.removeChild(win.firstChild);
		}

		document.body.removeChild(win);
	    }
	});

    sub = new dijit.form.Button({
	    label: 'Add',
	    id: 'schedule_outage_submit',
	    onClick: function() {
		xhrScheduleOutage(id);
		dijit.byId("outage_start_date").destroy();
		dijit.byId("outage_stop_date").destroy();
		dijit.byId("outage_start_time").destroy();
		dijit.byId("outage_stop_time").destroy();
		dijit.byId("schedule_outage_reset").destroy();
		dijit.byId("schedule_outage_submit").destroy();
		// destroy remaining dom nodes
		win = document.getElementById("schedule_outage_win");
		while (win.hasChildNodes() >= 1) {
		    win.removeChild(win.firstChild);
		}

		document.body.removeChild(win);
	    }
	});

    var items = [ start_label,
		  start_date.domNode, 
		  start_time.domNode,
		  document.createElement("br"),
		  stop_label,
		  stop_date.domNode,
		  stop_time.domNode,
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
