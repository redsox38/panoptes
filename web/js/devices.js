
function xhrUpdatePermissions(type, src, tgt, level) {
    src = src.replace("g_", "");
    tgt = tgt.replace("g_", "");

    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'updatePermission',
	    data: '{ "type": "' + type + '", "security_group": "' +
	          src + '", "device_group": "' + tgt +
	          '", "access": "' + level + 
	          '" }'
	},
	load: function(data) {
	    if (data && data.error) {
		alert(data.error);
	    }
	},
    };
	
    dojo.xhrGet(xhrArgs);
}

function manageDeviceGroupAccess() {
    var id = deviceStore.getValues(deviceTreeSelectedItem, 'id').toString();
    var name = deviceStore.getValues(deviceTreeSelectedItem, 'name').toString();

    typeStore = new dojo.data.ItemFileReadStore({
            data: {
                identifier: 'type',
                label: 'display',
                items: [
                        { type: 'grant', display: 'Grant' },
                        { type: 'revoke', display: 'Revoke' },
                        ]
            }
        });

    type = new dijit.form.FilteringSelect({
            id: 'security_group_type',
            name: 'security_group_type',
            style: 'width: 7em;',
            store: typeStore,
            title: 'Type',        
            searchAttr: 'display',
	    placeHolder: 'Operation'
        });

    src = new dijit.form.FilteringSelect({
            id: 'security_group_src',
            name: 'security_group_src',
            style: 'width: 12em;',
            store: userStore,
            query: { type: 'group' },
            serchAttr: 'id',
            placeHolder: 'group to grant access'
        });

    opStore = new dojo.data.ItemFileReadStore({
            data: {
                identifier: 'level',
                label: 'display',
                items: [
                         { level: 'read', display: 'read access' },
                         { level: 'write', display: 'write access' },
                        ]
            }
        });

    op = new dijit.form.FilteringSelect({
            id: 'security_group_op',
            name: 'security_group_op',
            style: 'width: 9em;',
            store: opStore,
            title: 'Op',        
            searchAttr: 'display',
	    placeHolder: 'Access Type'
        });

    lbl = document.createElement("label");
    lbl.htmlFor = 'security_group_tgt';
    lbl.appendChild(document.createTextNode(' access to '));

    tgt = new dijit.form.FilteringSelect({
            id: 'security_group_tgt',
            name: 'security_group_tgt',
            style: 'width: 15em;',
            store: deviceStore,
            query: { type: 'group', name: new RegExp("/((?!ungrouped).)/") },
            serchAttr: 'id',
            value: id
        });

    rst = new dijit.form.Button({
	    label: 'Cancel',
	    id: 'security_group_reset',
	    onClick: function() {
		dijit.byId("security_group_type").destroy();
		dijit.byId("security_group_src").destroy();
		dijit.byId("security_group_op").destroy();
		dijit.byId("security_group_tgt").destroy();
		dijit.byId("security_group_reset").destroy();
		dijit.byId("security_group_submit").destroy();
		// destroy remaining dom nodes
		win = document.getElementById("manage_device_win");
		while (win.hasChildNodes() >= 1) {
		    win.removeChild(win.firstChild);
		}

		document.body.removeChild(win);
	    }
	});

    sub = new dijit.form.Button({
	    label: 'Update',
	    id: 'security_group_submit',
	    onClick: function() {
		xhrUpdatePermissions(dijit.byId('security_group_type').get('value'), 
				     dijit.byId('security_group_src').get('value'),
				     dijit.byId('security_group_tgt').get('value'),
				     'write');
		dijit.byId("security_group_type").destroy();
		dijit.byId("security_group_src").destroy();
		dijit.byId("security_group_op").destroy();
		dijit.byId("security_group_tgt").destroy();
		dijit.byId("security_group_reset").destroy();
		dijit.byId("security_group_submit").destroy();
		// destroy remaining dom nodes
		win = document.getElementById("manage_device_win");
		while (win.hasChildNodes() >= 1) {
		    win.removeChild(win.firstChild);
		}

		document.body.removeChild(win);
	    }
	});

    var items = [ type.domNode, src.domNode, 
		  lbl, tgt.domNode, 
		  document.createElement("br"),
		  rst.domNode, sub.domNode ];
    
    createOverlayWindow("manage_device_win", items);
}

function deleteDeviceGroup() {
    var id = deviceStore.getValues(deviceTreeSelectedItem, 'id').toString();
    var name = deviceStore.getValues(deviceTreeSelectedItem, 'name').toString();
    id = id.replace("g_", "");

    var r = confirm('Are you sure you want to delete ' + name);

    if (r) {
	var xhrArgs = {
	    url: '/panoptes/',
	    handleAs: 'json',
	    content: {
		action: 'deleteDeviceGroup',
		data: '{ "id": "' + id + '" }'
	    },
	load: function(data) {
	    if (data && ! data.error) {
		// remove from tree
		var req = deviceStore.fetch({ query: { id: 'g_' + id }, 
					      onComplete: function(items, req) {
			    for (var i = 0; i < items.length; i++) {
				deviceStore.deleteItem(items[i]);
			    }
			    deviceStore.save();
			}});
	    } else {
		alert(data.error);
	    }
	},
    };
	
    dojo.xhrGet(xhrArgs);
    }
}

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
					  onComplete: function(items, req) {
			    if (items.length == 0) {
				// add group
				itm = {
				    type: 'group',
				    name: grp,
				    id: data.data['group_id'],
				    children: []
				};
	
				deviceStore.newItem(itm);
			    } else {
				// add device to group
			    }

			    deviceStore.save();
			}});
		deviceStore.save();
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
		    var req = deviceStore.fetch({ query: { id: 'd_' + id }, 
						  onComplete: function(items, req) {
				for (var i = 0; i < items.length; i++) {
				    deviceStore.deleteItem(items[i]);
				}
				deviceStore.save();
			    }});
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

function xhrRemoveGroupMember(group_id, device_id) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'removeGroupMember',
	    data: '{ "group_id": "' + group_id + '", "device_id": "' +
	    device_id + '" }'
	},
	load: function(data) {
	    if (data && !data.error) {
		// delete from group
	    } else {
		alert(data.error);
	    }
	},
    };
	
    dojo.xhrGet(xhrArgs);
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
						      // found parent
						      // send remove request
						      id = id.replace("d_", "");
						      g_id = deviceStore.getValue(grp, 'id');
						      g_id = g_id.replace("g_", "");
						      xhrRemoveGroupMember(g_id, id);
						  }
					      });
				      });
	    }
	});
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
