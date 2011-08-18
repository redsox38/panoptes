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

//
// applyDeviceTemplate - apply a device template to the selected deviceTree
//                       item.
// @param none
// @return none
//
function applyDeviceTemplate() {
    template_data = {
	label: "name",
	identifier: "id",
	items: []
    };

    templateStore = new dojo.data.ItemFileWriteStore({ 
	    data: template_data
	});	      

    // display overlay window to select template from
    var ts = new dijit.form.FilteringSelect({
   	    id: 'template_selector',
   	    name: 'template_selector',
    	    store: templateStore,
	    title: 'template',	    
    	    searchAttr: 'name',
	    labelFunc: function(itm, str) {
		var label = str.getValue(itm, 'name');
		return label;
	    },
	    labelAttr: 'name'
    	});

    lbl = document.createElement("label");
    lbl.htmlFor = 'template_selector';

    rst = new dijit.form.Button({
	    label: 'Cancel',
	    id: 'apply_template_reset',
	    onClick: function() {
		destroyAll("apply_template_win");
	    }
	});

    sub = new dijit.form.Button({
	    label: 'Apply',
	    id: 'apply_template_submit',
	    onClick: function() {
		// get selected device
		var dev_id = deviceStore.getValues(deviceTreeSelectedItem, 'id').toString();
		dev_id = dev_id.replace("d_", "");

		// get selected template
		var tpl_id = dijit.byId('template_selector').get('value');
		var tpl_name = dijit.byId('template_selector').get('displayedValue');

		xhrApplyDeviceTemplate(dev_id, tpl_id, tpl_name);
		destroyAll("apply_template_win");
	    }
	});

    var items = [ lbl, ts.domNode, 
		  document.createElement("br"),
		  rst.domNode, sub.domNode ];
    
    createOverlayWindow("apply_template_win", items);

    // load list of available templates 
    var xhrArgs = {
        url: '/panoptes/',
        handleAs: 'json',
        content: {
            action: 'getDeviceTemplates',
            data: '{}'
        },
        load: function(data) {
            if (data && !data.error) {          
                // populate grid
                if (data.data && (data.data.length > 0)) {
                    dojo.forEach(data.data, function(oneEntry) {
                            templateStore.newItem(oneEntry);
                        });

                    templateStore.save();
                }
            } else {
                alert(data.error);
            }
            hideLoading();
        },      
    };
       
    showLoading();
    var resp = dojo.xhrGet(xhrArgs);
}

//
// xhrApplyDeviceTemplate - call server side code to actually apply the 
//                          template to the device
// @param {String} device_id id of the device to apply the tempalte to
// @param {String} template_id id of the template to apply
// @param {String} template_name name of the template to display in error 
//                 messages
// @return none
//
function xhrApplyDeviceTemplate(device_id, template_id, template_name) {

    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'applyDeviceTemplate',
	    data: '{ "device_id": "' + device_id + '", "template_id": "' + template_id + '" }'
	},
	load: function(data) {
	    if (data && ! data.error) {
		alert("Template " + template_name + " has been applied.");
	    } else {
		alert(data.error);
	    }
	},
    };
	
    dojo.xhrGet(xhrArgs);
}

//
// xhrAddNotification - call serer side code to add notification for the logged in user for the 
//                      requested monitor
// @param {String} device_id id of the device to add notifications for.  If null, then monitor_ids
//                           parameter is checked instead for specific entries to be notified for.
// @param {Array} monitor_ids array of monitor_ids from the given device id to add notifications
//                            for.  Not checked if a device id is supplied.
// @param {String} type if monitoring individual monitors, this parameter specifies the type of
//                      monitor (url/snmp/certificate/shell/etc...)
// @return none
//
function xhrAddNotification(device_id, monitor_ids, type) {

    var args = {};
    if (!device_id) { 
	args.device_id = device_id;
    } else {
	args.type = type;
	args.monitor_ids = monitor_ids;
    }

    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'AddNotification',
	    data: dojo.toJson(args)
	},
	load: function(data) {
	    if (data && ! data.error) {
		alert("Your notification(s) have been added");
	    } else {
		alert(data.error);
	    }
	},
    };
	
    dojo.xhrGet(xhrArgs);
}

//
// xhrRemoveNotification - call serer side code to remove notification for the logged in user for the 
//                      requested monitor
// @param {String} device_id id of the device to remove notifications for.  If null, 
//                           then monitor_ids parameter is checked instead for specific 
//                           entries to remove notification from.
// @param {Array} monitor_ids array of monitor_ids from the given device id to remove notifications
//                            for.  Not checked if a device id is supplied.
// @param {String} type if removing notifications for individual monitors, this parameter 
//                      specifies the type of monitor (url/snmp/certificate/shell/etc...)
// @return none
//
function xhrRemoveNotification(device_id, monitor_ids, type) {

    var args = {};
    if (!device_id) { 
	args.device_id = device_id;
    } else {
	args.type = type;
	args.monitor_ids = monitor_ids;
    }

    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'RemoveNotification',
	    data: dojo.toJson(args)
	},
	load: function(data) {
	    if (data && ! data.error) {
		alert("Your notification(s) have been removed");
	    } else {
		alert(data.error);
	    }
	},
    };
	
    dojo.xhrGet(xhrArgs);
}

function addDeviceNotification() {
    var id = deviceStore.getValues(deviceTreeSelectedItem, 'id').toString();
    xhrAddNotification(id, null, null);
}

function removeDeviceNotification() {
    var id = deviceStore.getValues(deviceTreeSelectedItem, 'id').toString();
    xhrRemoveNotification(id, null, null);
}

//
// xhrUpdatePermissions - call server side code to update security permissions on a 
//                        device group
// @param {String} type add or remove
// @param {String} src security group to apply permissions for
// @param {String} tgt device group to apply permissions to
// @param {String} level access level to apply to group
// @return none
//
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
	    hideLoading();
	    if (data && data.error) {
		alert(data.error);
	    }
	},
    };
	
    showLoading();
    dojo.xhrGet(xhrArgs);
}

//
// manageDeviceGroupAccess - draw form for managing device group access
// @param none
// @return none
//
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
            searchAttr: 'id',
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
            searchAttr: 'id',
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

//
// deleteDeviceGroup - call server side code to remove a device group (not the actual devices in
//                     the group though
// @param none
// @return none
//
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
		hideLoading();
	    if (data && ! data.error) {
		// remove from tree
		var deleted_items = [];
		var req = deviceStore.fetch({ query: { id: 'g_' + id }, 
					      onComplete: function(items, req) {
			    for (var i = 0; i < items.length; i++) {
				var chldrn = deviceStore.getValues(items[i], 'children');
				deleted_items = deleted_items.concat(chldrn);
				deviceStore.deleteItem(items[i]);
			    }

			    deviceStore.save();
			}});

		// put any child devices back into ungrouped 
		// if they aren't already in another group
		for (a = 0; a < deleted_items.length; a++) {
		    var device_id = deviceStore.getValue(deleted_items[a], 'id');
		    var req2 = deviceStore.fetch({ query: { id: device_id, type: 'device' },
						   onComplete: function(items, req2) {
				if (items && (items.length < 2)) {
				    // add to ungrouped
				    var req3 = deviceStore.fetch({ query: { name: 'ungrouped',
									    type: 'group'}, 
								   onComplete: function(inner_items, req3) {
						if (inner_items && inner_items.length) {	
						    var chldrn = deviceStore.getValues(inner_items[0], 'children');
						    if (chldrn && chldrn.length) {
							chldrn.push(items[0]);
						    } else {
							chldrn = [ items[0] ];
						    }

						    deviceStore.setValues(inner_items[0], 'children', chldrn);
						}
					    }});
				}
			    }});	
		}

		// remove from device group store
		var req = groupStore.fetch({ query: { id: id }, 
					      onComplete: function(items, req) {
			    for (var i = 0; i < items.length; i++) {
				groupStore.deleteItem(items[i]);
			    }
			    groupStore.save();
			}});
	    } else {
		alert(data.error);
	    }
	},
    };
	
    showLoading();
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
	    hideLoading();
	    if (data && data.error) {
		alert(data.error);
	    }
	},
    };
	
    showLoading();
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
	    hideLoading();
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
				    id: 'g_' + data.data['id'],
				    children: [],
				};
	
				grpItem = deviceStore.newItem(itm);
				deviceStore.save();

				// bind group menu to item
				var device_group_menu = dijit.byId('device_tree_group_menu');
				var itemNode = deviceTree.getNodesByItem(deviceTree.model.getIdentity(grpItem));
				for (i = 0; i < itemNode.length; i++) {
				    device_group_menu.bindDomNode(itemNode[i].domNode);
				}
			    } else {
				grpItem = items[0];
			    }

			    // add device to group
			    req2 = deviceStore.fetch({ query: { id: 'd_' + device_id,
							       type: 'device'}, 
						      onComplete: function(items, req2) {
					if (items && items.length) {
					    var chldrn = deviceStore.getValues(grpItem, 'children');
					    if (chldrn && chldrn.length) {
						chldrn.push(items[0]);
					    } else {
						chldrn = [ items[0] ];
					    }
					    deviceStore.setValues(grpItem, 'children', chldrn);
					    deviceStore.save();

					    // bind device menu to item
					    var device_menu = dijit.byId('device_tree_menu');
					    var itemNode = deviceTree.getNodesByItem(deviceTree.model.getIdentity(items[0]));
					    for (i = 0; i < itemNode.length; i++) {
						device_menu.bindDomNode(itemNode[i].domNode);
					    }
					}
				    }});
			    			    
			}});

		// and remove from ungrouped if it is a member of that group
		req = deviceStore.fetch({ query: { name: 'ungrouped',
						   type: 'group'}, 
					  onComplete: function(items, req) {
			    if (items && items.length) {
				var chldrn = deviceStore.getValues(items[0], 'children');
				for (i = 0; i < chldrn.length; i++) {
				    // get device id from this child
				    this_device_id = deviceStore.getValues(chldrn[i], 'id');
				    if (this_device_id == ('d_' + device_id)) {
					chldrn.splice(i, 1);
				    }				    
				}
				deviceStore.setValues(items[0], 'children', chldrn);
				deviceStore.save();
			    }
			}});
		
		deviceStore.save();

		// add item to groupStore if a new group was created	       
		if (data.data && data.data.id) {
		    groupStore.newItem(data.data);
		}
	    } else {
		alert(data.error);
	    }
	},
    };
	
    showLoading();
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
		hideLoading();
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
	
	showLoading();
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
	    hideLoading();
	    if (data && !data.error) {
		// delete from group
		var deleted_items = [];
		var req = deviceStore.fetch({ query: { id: 'g_' + group_id }, 
					      onComplete: function(items, req) {
			    if (items && items.length) {
				var chldrn = deviceStore.getValues(items[0], 'children');
				for (i = 0; i < chldrn.length; i++) {
				    this_device_id = deviceStore.getValues(chldrn[i], 'id');
				    if (this_device_id == ('d_' + device_id)) {
					deleted_items.push(chldrn[i]);
					chldrn.splice(i, 1);
				    }
				}
				deviceStore.setValues(items[0], 'children', chldrn);
			    }
			    deviceStore.save();
			}});
		// see if it is in another group, if it isn't then
		// add it to ungrouped
		var req2 = deviceStore.fetch({ query: { id: 'd_' + device_id, type: 'device' },
					       onComplete: function(items, req2) {
			    if (items && (items.length < 2)) {
				// add to ungrouped
				var req3 = deviceStore.fetch({ query: { name: 'ungrouped', type: 'group' },
							       onComplete: function(items, req3) {
					    if (items) {
						var chldrn = deviceStore.getValues(items[0], 'children');
						var c;
						if (chldrn && chldrn.length) {
						    c = chldrn.concat(deleted_items);
						} else {
						    c = deleted_items;
						}
						deviceStore.setValues(items[0], 'children', c);
						deviceStore.save();

						// bind device menu to item(s)
						var device_menu = dijit.byId('device_tree_menu');
						for (j = 0; j < deleted_items.length; j++) {
						    var itemNode = deviceTree.getNodesByItem(deviceTree.model.getIdentity(deleted_items[j]));
						    for (i = 0; i < itemNode.length; i++) {
							device_menu.bindDomNode(itemNode[i].domNode);
						    }	
						}
					    }
					}});
			    }
			}});					     
	    } else {
		alert(data.error);
	    }
	},
    };
	
    showLoading();
    dojo.xhrGet(xhrArgs);
}

function xhrAddParentDevice(child_id, parent_id) {
    child_id = child_id.replace("d_", "");
    parent_id = parent_id.replace("d_", "");

    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'addParentDevice',
	    data: '{ "child_id": "' + child_id + '", "parent_id": "' +
	    parent_id + '" }'
	},
	load: function(data) {
	    hideLoading();
	    if (data && ! data.error) {
		alert("Relationship has been added");
	    } else {
		alert(data.error);
	    }
	},
    };
	
    showLoading();
    dojo.xhrGet(xhrArgs);
}

function editDeviceInfo() {
    var id = deviceStore.getValues(deviceTreeSelectedItem, 'id').toString();

    tb1_label = document.createElement("label");
    tb1_label.htmlFor = 'edit_device_name';
    tb1_label.appendChild(document.createTextNode('Name'));
    
    tb1 = new dijit.form.TextBox({
	    id: 'edit_device_name',
	    name: 'edit_device_name',
	    style: 'width: 25em;',
	    placeHolder: 'device name'
	});

    tb2_label = document.createElement("label");
    tb2_label.htmlFor = 'edit_device_os_type';
    tb2_label.appendChild(document.createTextNode('OS Type'));
    
    tb2 = new dijit.form.TextBox({
	    id: 'edit_device_os_type',
	    name: 'edit_device_os_type',
	    style: 'width: 25em;',
	    placeHolder: 'OS Type (ie Linux)'
	});

    tb3_label = document.createElement("label");
    tb3_label.htmlFor = 'edit_device_os_detail';
    tb3_label.appendChild(document.createTextNode('OS Detail'));
    
    tb3 = new dijit.form.TextBox({
	    id: 'edit_device_os_detail',
	    name: 'edit_device_os_detail',
	    style: 'width: 25em;',
	    placeHolder: 'OS Detail (ie 2.6.32)'
	});

    rst = new dijit.form.Button({
	    label: 'Cancel',
	    onClick: function() {
		dijit.byId("edit_device_name").destroy();
		dijit.byId("edit_device_os_type").destroy();
		dijit.byId("edit_device_os_detail").destroy();
		// destroy remaining dom nodes
		win = document.getElementById("edit_device_win");
		while (win.hasChildNodes() >= 1) {
		    win.removeChild(win.firstChild);
		}

		document.body.removeChild(win);
	    }
	});

    sub = new dijit.form.Button({
	    label: 'Save',
	    onClick: function() {
		var params = {
		    name: dijit.byId('edit_device_name').get('value'),
		    os_type: dijit.byId('edit_device_os_type').get('value'),
		    os_detail: dijit.byId('edit_device_os_detail').get('value'),
		    device_id: id.replace("d_", "")
		};
		xhrEditDeviceInfo(params);
		dijit.byId("edit_device_name").destroy();
		dijit.byId("edit_device_os_type").destroy();
		dijit.byId("edit_device_os_detail").destroy();
		// destroy remaining dom nodes
		win = document.getElementById("edit_device_win");
		while (win.hasChildNodes() >= 1) {
		    win.removeChild(win.firstChild);
		}

		document.body.removeChild(win);
	    }
	});

    var items = [ tb1_label, tb1.domNode, 
		  document.createElement("br"),
		  tb2_label, tb2.domNode,
		  document.createElement("br"),
		  tb3_label, tb3.domNode,
		  document.createElement("br"),		  
		  rst.domNode, sub.domNode ];
    
    createOverlayWindow("edit_device_win", items);
}

function xhrEditDeviceInfo(params) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'editDeviceInfo',
	    data: dojo.toJson(params)
	},
	load: function(data) {
	    hideLoading();
	    if (data && data.error) {
		alert(data.error);
	    }
	},
    };
	
    showLoading();
    dojo.xhrGet(xhrArgs);
}

function addParentDevice() {
    var id = deviceStore.getValues(deviceTreeSelectedItem, 'id').toString();
    
    parent = new dijit.form.FilteringSelect({
            id: 'parent_device',
            name: 'parent_device',
            style: 'width: 25em;',
            store: deviceStore,
            title: 'Parent',        
            query: { type: 'device' },
	    labelAttr: 'name',
            searchAttr: 'id',
	    labelFunc: function(itm, str) {
		var label = str.getValue(itm, 'name');
		return label;
	    },
	    placeHolder: 'Parent Device'
        });

    rst = new dijit.form.Button({
	    label: 'Cancel',
	    onClick: function() {
		dijit.byId("parent_device").destroy();
		// destroy remaining dom nodes
		win = document.getElementById("add_parent_device_win");
		while (win.hasChildNodes() >= 1) {
		    win.removeChild(win.firstChild);
		}

		document.body.removeChild(win);
	    }
	});

    sub = new dijit.form.Button({
	    label: 'Add',
	    onClick: function() {
		xhrAddParentDevice(id, dijit.byId("parent_device").attr('value'));
		dijit.byId("parent_device").destroy();
		// destroy remaining dom nodes
		win = document.getElementById("add_parent_device_win");
		while (win.hasChildNodes() >= 1) {
		    win.removeChild(win.firstChild);
		}

		document.body.removeChild(win);
	    }
	});

    var items = [ parent.domNode, rst.domNode, sub.domNode ];
    
    createOverlayWindow("add_parent_device_win", items);
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
