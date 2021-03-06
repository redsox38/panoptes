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
// xhrCloneMonitor - call server side code to copy a monitor from one device to another
// @param {String} device_id - source device id
// @param {Array} monitor_ids - ids of monitors to copy
// @param {String} type - monitor type
// @param {String} target_device_id - id of device to copy monitor to
// @return none
//
function xhrCloneMonitor(device_id, monitor_ids, type, target_device_id) {

    target_device_id = target_device_id.replace("d_", "");

    var args = {};
    args.target_device_id = target_device_id;

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
            action: 'cloneMonitor',
            data: dojo.toJson(args)
        },
        load: function(data) {
            if (data && ! data.error) {
		// see if there's a tab open for this device
		// if there is, update its data grid(s)
            } else {
                alert(data.error);
            }
        },
    };
        
    dojo.xhrGet(xhrArgs);
}

function cloneMonitor() {
    // figure out which grid we're working with
    selectedTab = dijit.byId('panoptes_tab_container').selectedChildWidget;
    id = selectedTab.id.replace("_tab", "");

    var monitor_ids = [];
    var table;
    var dataGrid;

    if (dijit.byId(id + '_port_mon_grid').selected) {
	table = 'port_monitors';
	dataGrid = dijit.byId(id + '_port_mon_grid');
    } else if (dijit.byId(id + '_cert_mon_grid').selected) {
	table = 'certificate_monitors';
	dataGrid = dijit.byId(id + '_cert_mon_grid');
    } else if (dijit.byId(id + '_snmp_mon_grid').selected) {
	table = 'snmp_monitors';
	dataGrid = dijit.byId(id + '_snmp_mon_grid');
    } else if (dijit.byId(id + '_shell_mon_grid').selected) {
	table = 'shell_monitors';
	dataGrid = dijit.byId(id + '_shell_mon_grid');
    } else if (dijit.byId(id + '_url_mon_grid').selected) {
	table = 'url_monitors';
	dataGrid = dijit.byId(id + '_url_mon_grid');
    }

    // get row ids
    var itms = dataGrid.selection.getSelected();
    dataGrid.selection.clear();
    
    if (itms.length) {
	dojo.forEach(itms, function(selectedItem) {
		if (selectedItem !== null) {
		    var entry_id = dataGrid.store.getValue(selectedItem, 
							 "id", null);
		    monitor_ids.push(entry_id);
		}
	    });
    }

    var label = dojo.create("label", { htmlFor: 'tgt_device' });
    label.appendChild(document.createTextNode('Target Device'));

    tgt_device = new dijit.form.FilteringSelect({
   	    id: 'tgt_device',
   	    name: 'tgt_device',
    	    store: deviceStore,
	    title: 'Target',
            autoComplete: true,
            query: {
                type: "device"
            },	    
	    required: true,
    	    searchAttr: 'name'
    	});    

    rst = new dijit.form.Button({
            label: 'Cancel',
            id: 'clone_reset',
            onClick: function() {
                dijit.byId("tgt_device").destroy();
                dijit.byId("clone_reset").destroy();
                dijit.byId("clone_submit").destroy();
                // destroy remaining dom nodes
                win = document.getElementById("clone_win");
                while (win.hasChildNodes() >= 1) {
                    win.removeChild(win.firstChild);
                }

                document.body.removeChild(win);
            }
        });

    sub = new dijit.form.Button({
            label: 'Copy',
            id: 'clone_submit',
            onClick: function() {
		    xhrCloneMonitor(id, monitor_ids, table, dijit.byId('tgt_device').attr('value'));
		    dijit.byId("tgt_device").destroy();
		    dijit.byId("clone_reset").destroy();
		    dijit.byId("clone_submit").destroy();
		    // destroy remaining dom nodes
		    win = document.getElementById("clone_win");
		    while (win.hasChildNodes() >= 1) {
			win.removeChild(win.firstChild);
		    }
		    
		    document.body.removeChild(win);
            }
        });


    items = [ label, tgt_device.domNode, 
	      dojo.create("br"),
	      rst.domNode, sub.domNode ];
    
    createOverlayWindow("clone_win", items);
    
}

function addNotification() {
    // figure out which grid we're working with
    selectedTab = dijit.byId('panoptes_tab_container').selectedChildWidget;
    id = selectedTab.id.replace("_tab", "");

    var monitor_ids = [];
    var table;
    var dataGrid;

    if (dijit.byId(id + '_port_mon_grid').selected) {
	table = 'port_monitors';
	dataGrid = dijit.byId(id + '_port_mon_grid');
    } else if (dijit.byId(id + '_cert_mon_grid').selected) {
	table = 'certificate_monitors';
	dataGrid = dijit.byId(id + '_cert_mon_grid');
    } else if (dijit.byId(id + '_snmp_mon_grid').selected) {
	table = 'snmp_monitors';
	dataGrid = dijit.byId(id + '_snmp_mon_grid');
    } else if (dijit.byId(id + '_shell_mon_grid').selected) {
	table = 'shell_monitors';
	dataGrid = dijit.byId(id + '_shell_mon_grid');
    } else if (dijit.byId(id + '_url_mon_grid').selected) {
	table = 'url_monitors';
	dataGrid = dijit.byId(id + '_url_mon_grid');
    }

    // get row ids
    var itms = dataGrid.selection.getSelected();
    dataGrid.selection.clear();
    
    if (itms.length) {
	dojo.forEach(itms, function(selectedItem) {
		if (selectedItem !== null) {
		    var entry_id = dataGrid.store.getValue(selectedItem, 
							 "id", null);
		    monitor_ids.push(entry_id);
		}
	    });
    }

    xhrAddNotification(id, monitor_ids, table);
}

function manageNotifications() {
    // figure out which grid we're working with
    selectedTab = dijit.byId('panoptes_tab_container').selectedChildWidget;
    id = selectedTab.id.replace("_tab", "");

    var monitor_ids = [];
    var table;
    var dataGrid;

    if (dijit.byId(id + '_port_mon_grid').selected) {
	table = 'port_monitors';
	dataGrid = dijit.byId(id + '_port_mon_grid');
    } else if (dijit.byId(id + '_cert_mon_grid').selected) {
	table = 'certificate_monitors';
	dataGrid = dijit.byId(id + '_cert_mon_grid');
    } else if (dijit.byId(id + '_snmp_mon_grid').selected) {
	table = 'snmp_monitors';
	dataGrid = dijit.byId(id + '_snmp_mon_grid');
    } else if (dijit.byId(id + '_shell_mon_grid').selected) {
	table = 'shell_monitors';
	dataGrid = dijit.byId(id + '_shell_mon_grid');
    } else if (dijit.byId(id + '_url_mon_grid').selected) {
	table = 'url_monitors';
	dataGrid = dijit.byId(id + '_url_mon_grid');
    }

    // get row ids
    var itms = dataGrid.selection.getSelected();
    dataGrid.selection.clear();
    
    if (itms.length) {
	dojo.forEach(itms, function(selectedItem) {
		if (selectedItem !== null) {
		    var entry_id = dataGrid.store.getValue(selectedItem, 
							 "id", null);
		    monitor_ids.push(entry_id);
		}
	    });
    }

    // get existing notification schedules and display them in an overlay window
    start_time = new dijit.form.TimeTextBox({
            name: 'manage_start_time_new',
            id: 'manage_start_time_new',
            constraints: {
                timePattern: 'HH:mm',
                clickableIncrement: 'T00:15:00',
                visibleIncrement: 'T00:15:00',
                visibleRange: 'T01:00:00'
            },
	    placeHolder: 'start time'
	});

    stop_time = new dijit.form.TimeTextBox({
            name: 'manage_stop_time_new',
            id: 'manage_stop_time_new',
            constraints: {
                timePattern: 'HH:mm',
                clickableIncrement: 'T00:15:00',
                visibleIncrement: 'T00:15:00',
                visibleRange: 'T01:00:00'
            },
	    placeHolder: 'stop time'
	});

    sub = new dijit.form.Button({
	    label: 'Save',
	    id: 'manage_notifications_submit',
	    onClick: function() {
		xhrAddNotificationBlackout(monitor_ids, table, 
					   start_time.attr('displayedValue'), stop_time.attr('displayedValue'));

		// destroy dijits
		dijit.byId("manage_start_time_new").destroy();
		dijit.byId("manage_stop_time_new").destroy();
		dijit.byId("manage_notifications_reset").destroy();
		dijit.byId("manage_notifications_submit").destroy();
		
		// there's probably a better way to do this
		for (var i = 0; i < 24; i++) {
		    var this_dijit = dijit.byId('blackout_list_' + i);
		    if (this_dijit) {
			this_dijit.destroy();
			dijit.byId('remove_notification_' + i).destroy();
		    }
		}

		// destroy remaining dom nodes
		win = document.getElementById("manage_notifications");
		while (win.hasChildNodes() >= 1) {
		    win.removeChild(win.firstChild);
		}
		
		document.body.removeChild(win);
	    }
	});
    
    rst = new dijit.form.Button({
	    label: 'Cancel',
	    id: 'manage_notifications_reset',
	    onClick: function() {
		// destroy dijits
		dijit.byId("manage_start_time_new").destroy();
		dijit.byId("manage_stop_time_new").destroy();
		dijit.byId("manage_notifications_reset").destroy();
		dijit.byId("manage_notifications_submit").destroy();

		// there's probably a better way to do this
		for (var i = 0; i < 24; i++) {
		    var this_dijit = dijit.byId('blackout_list_' + i);
		    if (this_dijit) {
			this_dijit.destroy();
			dijit.byId('remove_notification_' + i).destroy();
		    }
		}
		
		// destroy remaining dom nodes
		win = document.getElementById("manage_notifications");
		while (win.hasChildNodes() >= 1) {
		    win.removeChild(win.firstChild);
		}
		
		document.body.removeChild(win);
	    }
	});
    
    var blackout_list_div = dojo.create("div", { id: 'blackout_list_div' });

    items = [ blackout_list_div, start_time.domNode, stop_time.domNode,
	      dojo.create("br"), rst.domNode, sub.domNode ];

    createOverlayWindow("manage_notifications", items);

    // load existing notifications once window has been created
    xhrGetNotificationBlackout(monitor_ids, table);
}

function removeNotification() {
    // figure out which grid we're working with
    selectedTab = dijit.byId('panoptes_tab_container').selectedChildWidget;
    id = selectedTab.id.replace("_tab", "");

    var monitor_ids = [];
    var table;
    var dataGrid;

    if (dijit.byId(id + '_port_mon_grid').selected) {
	table = 'port_monitors';
	dataGrid = dijit.byId(id + '_port_mon_grid');
    } else if (dijit.byId(id + '_cert_mon_grid').selected) {
	table = 'certificate_monitors';
	dataGrid = dijit.byId(id + '_cert_mon_grid');
    } else if (dijit.byId(id + '_snmp_mon_grid').selected) {
	table = 'snmp_monitors';
	dataGrid = dijit.byId(id + '_snmp_mon_grid');
    } else if (dijit.byId(id + '_shell_mon_grid').selected) {
	table = 'shell_monitors';
	dataGrid = dijit.byId(id + '_shell_mon_grid');
    } else if (dijit.byId(id + '_url_mon_grid').selected) {
	table = 'url_monitors';
	dataGrid = dijit.byId(id + '_url_mon_grid');
    }

    // get row ids
    var itms = dataGrid.selection.getSelected();
    dataGrid.selection.clear();
    
    if (itms.length) {
	dojo.forEach(itms, function(selectedItem) {
		if (selectedItem !== null) {
		    var entry_id = dataGrid.store.getValue(selectedItem, 
							 "id", null);
		    monitor_ids.push(entry_id);
		}
	    });
    }

    xhrRemoveNotification(id, monitor_ids, table);
}

function xhrAddNotificationBlackout(monitor_ids, table, start, stop) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'addNotificationBlackout',
	    data: '{ "type": "' + table + '", "start": "' + start + '", ' +
	    '"stop": "' + stop + '", ' + '"monitor_ids": ' + dojo.toJson(monitor_ids) + ' }'
	},
	load: function(data) {
	    if (data && !data.error) {          
		alert('Notification blackout added');
	    } else {
		alert(data.error);
	    }
	}
    };

    var resp = dojo.xhrGet(xhrArgs);
}

function xhrRemoveNotificationBlackout(index, table, id, blackout_id) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'removeNotificationBlackout',
	    data: '{ "type": "' + table + '", "blackout_id": ' + blackout_id + ', "id": ' + id + ' }'
	},
	load: function(data) {
	    if (data && !data.error) {          
		// remove dijits
                dijit.byId("blackout_list_" + index).destroy();
                dijit.byId("remove_notification_" + index).destroy();
	    } else {
		alert(data.error);
	    }
	}
    };

    var resp = dojo.xhrGet(xhrArgs);
}

function xhrGetNotificationBlackout(monitor_ids, table) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getNotificationBlackout',
	    data: '{ "type": "' + table + '", "monitor_ids": ' + dojo.toJson(monitor_ids) + ' }'
	},
	load: function(data) {
	    if (data && !data.error) {          
		if (data.data && data.data.length) {
		    // add entries to "manage_notifications" overlay window
		    for (var i = 0; i < data.data.length; i++) {
			var this_entry = data.data[i];
			this_entry['index'] = i;

			var this_div = dojo.create('div', { id: 'blackout_list_div_' + i });

			var tb = new dijit.form.TextBox({
				id: 'blackout_list_' + i,
				style: 'width: 15em;',
				value: this_entry['start'] + ' - ' + this_entry['stop'],
				disabled: true
			    });

			var rb = new dijit.form.Button({
				label: 'Remove Blackout',
				id: 'remove_notification_' + i,
				onClick: function() {
				    xhrRemoveNotificationBlackout(this_entry['index'], table, this_entry['device_id'], 
								  this_entry['id']);
				}
			    });
    			
			this_div.appendChild(tb.domNode);
			this_div.appendChild(rb.domNode);
			
			dojo.place(this_div, 'blackout_list_div', 'first');
		    }
		}
	    } else {
		alert(data.error);
	    }
	}
    };

    var resp = dojo.xhrGet(xhrArgs);
}

function xhrRescheduleMonitor(dataGrid, dev_id, params, monitor_ids) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'rescheduleMonitorEntry',
	    data: '{ "device_id": "' + dev_id + '", "params": ' + dojo.toJson(params) + ', ' +
	    '"monitor_ids": ' + dojo.toJson(monitor_ids) + ' }'
	},
	load: function(data) {
	    if (data && !data.error) {          
		// update items
		for (i = 0; i < monitor_ids.length; i++) {		    
		    dataGrid.store.fetchItemByIdentity({
			identity: monitor_ids[i],
			onItem: function(item, req) {
				dataGrid.store.setValue(item, 'next_check', data.data['time']);

				dataGrid.store.save();
				dataGrid.setStore(dataGrid.store);
				dataGrid.update();		

			    }
			});
		    // schedule reload
		    if (params.type == "port_monitors") {
			timerId = reloadMonitorEntry(updatePortMonitorEntry, dev_id, monitor_ids[i], 
						     dataGrid, data.data['time']);
		    } else if (params.type == "snmp_monitors") {
			timerId = reloadMonitorEntry(updateSNMPMonitorEntry, dev_id, monitor_ids[i], 
						     dataGrid, data.data['time']);
		    } else if (params.type == "url_monitors") {
			timerId = reloadMonitorEntry(updateUrlMonitorEntry, dev_id, monitor_ids[i], 
						     dataGrid, data.data['time']);
		    } else if (params.type == "shell_monitors") {
			timerId = reloadMonitorEntry(updateShellMonitorEntry, dev_id, monitor_ids[i], 
						     dataGrid, data.data['time']);
		    }

		    // add to timer list for this device
		    timers[dev_id + '_tab'].push(timerId);
		}
	    } else {
		alert(data.error);
	    }
	}
    };

    var resp = dojo.xhrGet(xhrArgs);
}

function updatePortMonitorEntry(dev_id, ent_id, container) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getPortMonitorEntry',
	    data: '{ "device_id": "' + dev_id + '", "entry_id": "' + ent_id + '" }'
	},
	load: function(data) {
	    if (data && !data.error) {          
		// find this one entry in the data store and update it's values
		portMonitorStore.fetchItemByIdentity({
			identity: ent_id,
			onItem: function(item, req) {
			    portMonitorStore.setValue(item, 'status', data.data['status']);
			    portMonitorStore.setValue(item, 'status_string', data.data['status_string']);
			    portMonitorStore.setValue(item, 'last_check', data.data['last_check']);
			    portMonitorStore.setValue(item, 'next_check', data.data['next_check']);

			    portMonitorStore.save();
			    container.setStore(portMonitorStore);
			    container.update();		
			}
		    });

		// schedule reload
		timerId = reloadMonitorEntry(updatePortMonitorEntry, dev_id, ent_id, 
					     container, data.data['next_check']);
		// add to timer list for this device
		timers[dev_id + '_tab'].push(timerId);

	    } else {
		alert(data.error);
	    }
	},	
    };
       
    var resp = dojo.xhrGet(xhrArgs);
}

function updateUrlMonitorEntry(dev_id, ent_id, container) {    
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getUrlMonitorEntry',
	    data: '{ "device_id": "' + dev_id + '", "entry_id": "' + ent_id + '" }'
	},
	load: function(data) {
	    if (data && !data.error) {          
		// find this one entry in the data store and update it's values
		urlMonitorStore.fetchItemByIdentity({
			identity: ent_id,
			onItem: function(item, req) {
			    urlMonitorStore.setValue(item, 'status', data.data['status']);
			    urlMonitorStore.setValue(item, 'status_string', data.data['status_string']);
			    urlMonitorStore.setValue(item, 'last_check', data.data['last_check']);
			    urlMonitorStore.setValue(item, 'next_check', data.data['next_check']);

			    urlMonitorStore.save();
			    container.setStore(urlMonitorStore);
			    container.update();		
			}
		    });

		// schedule reload
		timerId = reloadMonitorEntry(updateUrlMonitorEntry, dev_id, ent_id, 
					     container, data.data['next_check']);
		// add to timer list for this device
		timers[dev_id + '_tab'].push(timerId);
	    } else {
		alert(data.error);
	    }
	},	
    };
       
    var resp = dojo.xhrGet(xhrArgs);
}

function updateSNMPMonitorEntry(dev_id, ent_id, container) {    
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getSNMPMonitorEntry',
	    data: '{ "device_id": "' + dev_id + '", "entry_id": "' + ent_id + '" }'
	},
	load: function(data) {
	    if (data && !data.error) {          
		// find this one entry in the data store and update it's values
		SNMPMonitorStore.fetchItemByIdentity({
			identity: ent_id,
			onItem: function(item, req) {
			    SNMPMonitorStore.setValue(item, 'status', data.data['status']);
			    SNMPMonitorStore.setValue(item, 'status_string', data.data['status_string']);
			    SNMPMonitorStore.setValue(item, 'last_check', data.data['last_check']);
			    SNMPMonitorStore.setValue(item, 'next_check', data.data['next_check']);

			    SNMPMonitorStore.save();
			    container.setStore(SNMPMonitorStore);
			    container.update();		
			}
		    });

		// schedule reload
		timerId = reloadMonitorEntry(updateSNMPMonitorEntry, dev_id, ent_id, 
					     container, data.data['next_check']);
		// add to timer list for this device
		timers[dev_id + '_tab'].push(timerId);
	    } else {
		alert(data.error);
	    }
	},	
    };
       
    var resp = dojo.xhrGet(xhrArgs);
}

function updateShellMonitorEntry(dev_id, ent_id, container) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getShellMonitorEntry',
	    data: '{ "device_id": "' + dev_id + '", "entry_id": "' + ent_id + '" }'
	},
	load: function(data) {
	    if (data && !data.error) {          
		// find this one entry in the data store and update it's values
		shellMonitorStore.fetchItemByIdentity({
			identity: ent_id,
			onItem: function(item, req) {
			    shellMonitorStore.setValue(item, 'status', data.data['status']);
			    shellMonitorStore.setValue(item, 'status_string', data.data['status_string']);
			    shellMonitorStore.setValue(item, 'last_check', data.data['last_check']);
			    shellMonitorStore.setValue(item, 'next_check', data.data['next_check']);

			    shellMonitorStore.save();
			    container.setStore(shellMonitorStore);
			    container.update();		
			}
		    });

		// schedule reload
		timerId = reloadMonitorEntry(updateShellMonitorEntry, dev_id, ent_id, 
					     container, data.data['next_check']);
		// add to timer list for this device
		timers[dev_id + '_tab'].push(timerId);
	    } else {
		alert(data.error);
	    }
	},	
    };
       
    var resp = dojo.xhrGet(xhrArgs);
}
 
function loadMibs(id, community, dndNode) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getMIBS',
	    data: '{ "id": "' + id + '", "community": "' +
	          community + '"}'
	},
	load: function(data) {
	    if (data && data.data) {          
		// populate dnd container
		dndNode.insertNodes(false, data.data);
	    } else if (data.error) {
		alert(data.error);
	    }
	    hideLoading();
	},	
    };
    
    showLoading();
    var resp = dojo.xhrGet(xhrArgs);
}

function updatePerformanceGraph(id) {
    // get selected metic
    metric = dijit.byId(id + '_perf_metric').get('value');
    start_dt = dijit.byId(id + '_perf_start_date').get('value');
    stop_dt = dijit.byId(id + '_perf_stop_date').get('value');

    var cp = new dijit.layout.ContentPane({
	    id: id + '_perf_' + metric + '_cp',
	    title: 'Chart 1',
	    content: '',
	    closable: true
	});

    cp.placeAt(dijit.byId(id + '_tc_perf').domNode);

    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getPerformanceChartData',
	    data: '{ "device_id": "' + id + '", "metric": "' + metric +
	    '", "start": "' + start_dt  +
	    '", "stop": "' + stop_dt + '" }'
	},
	load: function(data) {
	    if (data && !data.error) {
		// create container div
		var dv = dojo.create("div", { id: id + '_' + metric + '_graph_div',
					      style: { height: '250px', width: '600px' }},
		    cp.domNode, 'last');

		var req = prefStore.fetch({ query: { pref_name: 'general_prefs_chart_theme' },
					    onComplete: function(items, req) {
			    var chrt_theme = null;
			    if (items.length) {
				var v = prefStore.getValue(items[0], 
							   'pref_value');
				chrt_theme = eval('(' + 
						  "dojox.charting.themes." + 
						  v + ')');
			    }			    

			    var days_span = (data.data.end - data.data.start) / 86400;

			    // draw graph		
			    var chrt = new dojox.charting.Chart2D(id + '_' + metric + 
								  '_graph_div', {
								      title: data.data.title,
								      titleFont: "normal normal bold 12pt Helvetica",
								  });

					    
			    if (chrt_theme) {
				chrt.setTheme(chrt_theme);
			    }

			    chrt.addPlot('default', { type: 'Lines', markers: true });
			    chrt.addAxis('x', { natural: true,
					htmlLabels: true,
					labelFunc: function(value) {
					var v = value;
					var dt = new Date();
					// dojo sticks commas in the labels 
					// which messes up my juju
					dt.setTime(v.replace(/\,/g,'') * 1000);

					if (days_span > 2) {
					    return(dt.toLocaleDateString());
					} else {
					    var h = dt.getHours();
					    h = (h < 10 ? "0" + h : h); 
					    var m = dt.getMinutes();
					    m = (m < 10 ? "0" + m : m); 
					    return(h + ':' + m);
					}
				    },
					microTicks: false,
					min: data.data.start,
					max: data.data.end,
					minorTickSpan: data.data.step
					});
			    
			    chrt.addAxis('y', { vertical: true,
					min: 0,
					max: Math.max.apply(0, data.data.data),
					includeZero: true,
					title: data.data.info[0].vlabel,
					font: "normal normal bold 8pt Helvetica"
				});
			    
			    var info = data.data.info;
			    
			    for (j = 0; j < data.data.info.length; j++) {
				var plot_data = [];
				var total = 0;
				var max = 0;
				var min = Math.max.apply(0, data.data.data);
				for(i = j; i < data.data.data.length; i += data.data.info.length) {
				    
				    var xval = data.data.start + 
					(Math.floor(i / data.data.info.length) * 
					 data.data.step);
				    var yval = data.data.data[i];
				    if (yval > max) { max = yval; }
				    if (yval < min) { min = yval; }
				    
				    plot_data.push({ x: xval, 
						y: yval.toFixed(4), 
						tooltip: yval.toFixed(2) });
				}
				
				var metric_info = 'Max: ' + max + ' Min: ' + 
				    min + ' Avg: ' + (total / data.data.info.length);
				chrt.addSeries(info[j].label + " " + metric_info, 
					       plot_data);
			    }
			    
			    f = new dojox.charting.action2d.Tooltip(chrt, "default");
			    
 			    chrt.render();
			    
			    var lgnd_dv = dojo.create("div", { id: id + '_' + metric + '_legend_div', 
							       style: { height: '50px',
									width: '600px' }} , 
				cp.domNode, 'last');
			    
			    f = new dojox.charting.widget.Legend({ chart: chrt }, 
								 id + '_' + metric + '_legend_div');
			}});
 	    } else {
		alert(data.error);
	    }
	    hideLoading();
	},	
    };
       
    showLoading();
    var resp = dojo.xhrGet(xhrArgs);
}

function addAlertData(id, container, start, stop) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getAlertHistory',
	    data: '{ "device_id": "' + id + '", "start": "' + start  +
	    '", "stop": "' + stop + '" }'
	},
	load: function(data) {
	    if (data && !data.error) {
		if (data.data.length) {
		    // populate grid       		
		    dojo.forEach(data.data, function(oneEntry) {
			    alertStore.newItem(oneEntry);
			});
		    
		    alertStore.save();
		    container.setStore(alertStore);
		    container.update();		
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

function addPortMonitorData(id, container) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getPortMonitorData',
	    data: '{ "id": "' + id + '" }'
	},
	load: function(data) {
	    if (data && !data.error) {          
		// populate grid
		dojo.forEach(data.data, function(oneEntry) {
			portMonitorStore.newItem(oneEntry);
			timerId = reloadMonitorEntry(updatePortMonitorEntry, id, oneEntry['id'], 
						     container, oneEntry['next_check']);
			// add to timer list for this device
			timers[id + '_tab'].push(timerId);
		    });

		portMonitorStore.save();
		container.setStore(portMonitorStore);
		container.update();		
	    } else {
		alert(data.error);
	    }
	    hideLoading();
	},	
    };
       
    showLoading();
    var resp = dojo.xhrGet(xhrArgs);
}

function addUrlMonitorData(id, container) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getUrlMonitorData',
	    data: '{ "id": "' + id + '" }'
	},
	load: function(data) {
	    if (data && !data.error) {          
		if (data.data.length > 0) {
		    // populate grid		
		    dojo.forEach(data.data, function(oneEntry) {
			    urlMonitorStore.newItem(oneEntry);
			    timerId = reloadMonitorEntry(updateUrlMonitorEntry, id, oneEntry['id'], 
							 container, oneEntry['next_check']);
			    // add to timer list for this device
			    timers[id + '_tab'].push(timerId);
 			});

		    urlMonitorStore.save();
		    container.setStore(urlMonitorStore);
		    container.update();	
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

function addCertificateMonitorData(id, container) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getCertificateMonitorData',
	    data: '{ "id": "' + id + '" }'
	},
	load: function(data) {
	    if (data && !data.error) {          
		if (data.data.length > 0) {
		    // populate grid		
		    dojo.forEach(data.data, function(oneEntry) {
			    certificateMonitorStore.newItem(oneEntry);
			});

		    certificateMonitorStore.save();
		    container.setStore(certificateMonitorStore);
		    container.update();	
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

function addShellMonitorData(id, container) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getShellMonitors',
	    data: '{ "id": "' + id + '" }'
	},
	load: function(data) {
	    if (data && !data.error) {          
		// populate grid
		if (data.data && (data.data.length > 0)) {
		    dojo.forEach(data.data, function(oneEntry) {
			    shellMonitorStore.newItem(oneEntry);
			    timerId = reloadMonitorEntry(updateShellMonitorEntry, id, oneEntry['id'], 
							 container, oneEntry['next_check']);
			    // add to timer list for this device
			    timers[id + '_tab'].push(timerId);
			});

		    shellMonitorStore.save();
		    container.setStore(shellMonitorStore);
		    container.update();		
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

function addSNMPMonitorData(id, container) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getSNMPMonitorData',
	    data: '{ "id": "' + id + '" }'
	},
	load: function(data) {
	    if (data && !data.error) {          
		if (data.data.length > 0) {
		    // populate grid		
		    dojo.forEach(data.data, function(oneEntry) {
			    SNMPMonitorStore.newItem(oneEntry);
			    timerId = reloadMonitorEntry(updateSNMPMonitorEntry, id, oneEntry['id'], 
							 container, oneEntry['next_check']);
			    // add to timer list for this device
			    timers[id + '_tab'].push(timerId);
			});

		    SNMPMonitorStore.save();
		    container.setStore(SNMPMonitorStore);
		    container.update();	
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

function addRRDData(id) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getRRDs',
	    data: '{ "id": "' + id + '" }'
	},
	load: function(data) {
	    if (data && !data.error) {
		// populate data store
		dojo.forEach(data.data, function(oneEntry) {
			perfMonitorStore.newItem(oneEntry);
		    });

		perfMonitorStore.save();
	    } else {
		alert(data.error);
	    }
	},

    };
	
    var resp = dojo.xhrGet(xhrArgs);
}

function addInfoData(id, container) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getDeviceInfo',
	    data: '{ "id": "' + id + '" }'
	},
	load: function(data) {
	    if (data && !data.error) {
		// color host name
		var clr = null;

		if (data.data.max_status == "critical") {
		    new_data = '<font color="#a62434">';
		} else if (data.data.max_status == "warn") {
		    new_data = '<font color="#b3511d">';
		} else {
		    new_data = '<font color="#000000">';
		}

		// name info
		new_data += '<b>name : </b>' + data.data.name + '<br/>' +
		'<b>IP : </b>' + data.data.address + '<br/>';

		// OS info
		new_data += '<b>OS type : </b>' + data.data.os_type + '<br/>' +
		'<b>OS details : </b>' + data.data.os_detail + '<br/>';

		if (data.data.ping_data) {
		    new_data += '<b>icmp response : </b>' +
			data.data.ping_data + ' ms <br/>';
		}
		if (data.data.outage_data) {
		    new_data += '<b>scheduled outage : </b>' +
			data.data.outage_data + '<br/>';
		}
		new_data += "</font/>";

		container.set('content', new_data);
	    } else {
		alert(data.error);
	    }
	    hideLoading();
	},

    };
	
    showLoading();
    var resp = dojo.xhrGet(xhrArgs);
}

function createAlertHistoryTab(id) {
    // create grid
    var alert_layout = [{
	    field: 'id',
	    name: 'ID',
	    width: '45px'	    
	},
	{
	    field: 'id_string',
	    name: 'Identifier',
	    width: '300px'
	},
	{
	    field: 'timestamp',
	    name: 'Timestamp',
	    width: '150px'	    
	},
	{
	    field: 'status',
	    name: 'Status',
	    width: '80px'	    
	},
	{
	    field: 'message',
	    name: 'Message',
	    width: 'auto'	    
	}];

    alert_data = {
	label: "alert",
	identifier: "id",
	items: []
    };

    alertStore = new dojo.data.ItemFileWriteStore({ 
	    data: alert_data 
	});		

    var tc_1 = new dojox.grid.EnhancedGrid({
	    id: id + '_alert_grid',
	    title: 'Alerts',
	    store: alertStore,
	    structure: alert_layout,
	    clientSort: true,
	    rowSelector: '10px',
	    selectionMode: 'multiple',
	    plugins: {
		nestedSorting: true,
	    }
	}, dojo.create('div'));                  
    tc_1.startup();                

    // retrieve first 10 alerts
    addAlertData(id, tc_1, 0, 10);
    return(tc_1);    
}

function createPerformanceHistoryTab(id) {

    perf_monitor_data = {
	label: "label",
	identifier: "metric",
	items: []
    };

    perfMonitorStore = new dojo.data.ItemFileWriteStore({ 
	    data: perf_monitor_data 
	});	      

    // load data for performance monitor tab
    addRRDData(id);

    // load available historical data
    // for selectbox
    
    var tc_2 = new dijit.layout.ContentPane({
	    id: id + '_tc_perf',
	    title: 'Performance History',
	    content: '',	    
	});
    
    // create combo box, date selectors, and buttons for performance
    // history tab
    sb = new dijit.form.FilteringSelect({
   	    id: id + '_perf_metric',
   	    name: 'perf_metric',
    	    store: perfMonitorStore,
	    title: 'Metric',	    
    	    searchAttr: 'metric',
	    labelFunc: function(itm, str) {
		var label = str.getValue(itm, 'label');
		return label;
	    },
	    labelAttr: 'label'
    	}, dijit.byId(id + '_tc_perf'));

    sb.placeAt(tc_2.domNode);

    start_dt = new dijit.form.DateTextBox({
	    id: id + '_perf_start_date',
	    name: id + '_perf_start_date',
	    closable: true,
	    title: 'Start Date',
 	    constraints: { datePattern:'MM/dd/yyyy'}
	});

    start_dt.placeAt(tc_2.domNode);

    stop_dt = new dijit.form.DateTextBox({
	    id: id + '_perf_stop_date',
	    name: id + '_perf_stop_date',
	    closable: true,
	    title: 'Stop Date',
	    constraints: { datePattern:'MM/dd/yyyy'}
	});
    
    stop_dt.placeAt(tc_2.domNode);

    sub = new dijit.form.Button({
	    label: 'Graph',
	    onClick: function() {
		updatePerformanceGraph(id);
	    }
	});
    
    sub.placeAt(tc_2.domNode);

    // create reset button that destroys all
    // content panes below the perf tab
    rst = new dijit.form.Button({
	    label: 'Clear Graphs',
	    onClick: function() {
		dojo.query(dijit.byId(id + '_tc_perf').getDescendants().forEach(function(i) {
			    p = /_cp$/;
			    if (i.id.match(p)) {
				dijit.byId(i.id).destroyRecursive();
			    }
			}));
	    }
	});
    
    rst.placeAt(tc_2.domNode);

    return(tc_2);
}

function createPortMonitorTab(id) {
    // create data  grid 
    var port_monitor_layout = [{
	    field: 'port',
	    name: 'Port',
	    width: '45px'
	},      
	{   
	    field: 'proto', 
	    name: 'Protocol',
	    width: '65px'
	},
	{            
	    field: 'last_check', 
	    name: 'Last Check',
	    width: '150px'
	},
	{            
	    field: 'next_check', 
	    name: 'Next Check',
	    width: '150px'
	},
	{            
	    field: 'status', 
	    name: 'Status',
	    width: '80px'
	},
	{            
	    field: 'status_string', 
	    name: 'Monitor Output',
	    width: 'auto'
	},
	];

    port_monitor_data = {
	label: "port",
	identifier: "id",
	items: []
    };

    portMonitorStore = new dojo.data.ItemFileWriteStore({ 
	    data: port_monitor_data 
	});		

    var tc_1 = new dojox.grid.EnhancedGrid({
	    id: id + '_port_mon_grid',
	    title: 'Ports',
	    store: portMonitorStore,
	    structure: port_monitor_layout,
	    clientSort: true,
	    rowSelector: '10px',
	    selectionMode: 'multiple',
	    plugins: {
		nestedSorting: true,
		menus: { 
		    rowMenu: 'monitorMenu',
		    headerMenu: 'monitorMenu'
		}
	    }
	}, dojo.create('div'));                  
    tc_1.startup();                
    
    // set color coding for grid rows based on monitor status
    dojo.connect(tc_1, 'onStyleRow', function(row) {
	    var item = tc_1.getItem(row.index);
	    if (item) {
		var status = tc_1.store.getValue(item, "status", null);

		if (status == "critical") {
		    row.customStyles += 'color: #a62434;';
		} else if (status == "warn") {
		    row.customStyles += 'color: #b3511d;';
		}
		
	    }
	});

    dojo.connect(tc_1, 'onRowMouseOver', function(e) {
	    var item = tc_1.getItem(e.rowIndex);
	    var who = tc_1.store.getValue(item, "ack_by", null);
	    var what = tc_1.store.getValue(item, "ack_msg", null);
	    var msg = null;
	    if (who && what) {
		msg = who + ": " + what;
	    }
	    
	    if (msg) {
		dijit.showTooltip(msg, e.cellNode);
	    }
	});

    dojo.connect(tc_1, 'onRowMouseOut', function(e) {
	    dijit.hideTooltip(e.cellNode);
	});

    dojo.connect(tc_1, 'onRowContextMenu', function(e) {
	    var item = tc_1.getItem(e.rowIndex);
	    var notify = tc_1.store.getValue(item, "notify", null);
	    var disabled = tc_1.store.getValue(item, "disabled", null);

	    if (notify) {
		dijit.byId('monitorMenuAddNotification').attr('disabled','true');
		dijit.byId('monitorMenuRemoveNotification').attr('disabled', null);
	    } else {
 		dijit.byId('monitorMenuAddNotification').attr('disabled', null);
		dijit.byId('monitorMenuRemoveNotification').attr('disabled','true');
	    }

	    if (disabled && (disabled == 1)) {
 		dijit.byId('monitorMenuEnable').attr('disabled', null);
		dijit.byId('monitorMenuDisable').attr('disabled','true');
	    } else {
 		dijit.byId('monitorMenuEnable').attr('disabled', 'true');
		dijit.byId('monitorMenuDisable').attr('disabled', null);
	    }
	});

    // load data for availability tab
    addPortMonitorData(id, tc_1);
    
    return(tc_1);
}

function createSNMPTab(id) {
    // create data  grid 
    var snmp_layout = [{
	    field: 'name',
	    name: 'Name',
	    width: '70px'
	},      
	{
	    field: 'oid',
	    name: 'OID',
	    width: '150px'
	},      
	{            
	    field: 'last_check', 
	    name: 'Last Check',
	    width: '150px'
	},
	{            
	    field: 'next_check', 
	    name: 'Next Check',
	    width: '150px'
	},
	{            
	    field: 'status', 
	    name: 'Status',
	    width: '80px'
	},
	{            
	    field: 'status_string', 
	    name: 'Monitor Output',
	    width: 'auto'
	},
	];

    snmp_data = {
	label: "snmpmon",
	identifier: "id",
	items: []
    };

    SNMPMonitorStore = new dojo.data.ItemFileWriteStore({ 
	    data: snmp_data 
	});		

    var tc_1 = new dojox.grid.EnhancedGrid({
	    id: id + '_snmp_mon_grid',
	    title: 'SNMP',
	    store: SNMPMonitorStore,
	    structure: snmp_layout,
	    clientSort: true,
	    rowSelector: '10px',
	    selectionMode: 'multiple',
	    plugins: {
		nestedSorting: true,
		menus: { 
		    rowMenu: 'monitorMenu',
		    headerMenu: 'monitorMenu',
		}
	    }
	}, dojo.create('div'));                  
    tc_1.startup();                
    
    // set color coding for grid rows based on monitor status
    dojo.connect(tc_1, 'onStyleRow', function(row) {
	    var item = tc_1.getItem(row.index);
	    if (item) {
		var status = tc_1.store.getValue(item, "status", null);

		if (status == "critical") {
		    row.customStyles += 'color: #a62434;';
		} else if (status == "warn") {
		    row.customStyles += 'color: #b3511d;';
		}
		
	    }
	});

    dojo.connect(tc_1, 'onRowMouseOver', function(e) {
	    var item = tc_1.getItem(e.rowIndex);
	    var who = tc_1.store.getValue(item, "ack_by", null);
	    var what = tc_1.store.getValue(item, "ack_msg", null);
	    var msg = null;
	    if (who && what) {
		msg = who + ": " + what;
	    }
	    
	    if (msg) {
		dijit.showTooltip(msg, e.cellNode);
	    }
	});

    dojo.connect(tc_1, 'onRowMouseOut', function(e) {
	    dijit.hideTooltip(e.cellNode);
	});

    dojo.connect(tc_1, 'onRowContextMenu', function(e) {
	    var item = tc_1.getItem(e.rowIndex);
	    var notify = tc_1.store.getValue(item, "notify", null);
	    var disabled = tc_1.store.getValue(item, "disabled", null);

	    if (notify) {
		dijit.byId('monitorMenuAddNotification').attr('disabled','true');
		dijit.byId('monitorMenuRemoveNotification').attr('disabled', null);
	    } else {
 		dijit.byId('monitorMenuAddNotification').attr('disabled', null);
		dijit.byId('monitorMenuRemoveNotification').attr('disabled','true');
	    }

	    if (disabled && (disabled == 1)) {
 		dijit.byId('monitorMenuEnable').attr('disabled', null);
		dijit.byId('monitorMenuDisable').attr('disabled','true');
	    } else {
 		dijit.byId('monitorMenuEnable').attr('disabled', 'true');
		dijit.byId('monitorMenuDisable').attr('disabled', null);
	    }
	});

    // load data for tab
    addSNMPMonitorData(id, tc_1);
    
    return(tc_1);
}

function createShellTab(id) {
    // create data  grid 
    var shell_layout = [{
	    field: 'script',
	    name: 'Script',
	    width: '70px'
	},      
	{
	    field: 'params',
	    name: 'Parameters',
	    width: '150px'
	},      
	{            
	    field: 'last_check', 
	    name: 'Last Check',
	    width: '150px'
	},
	{            
	    field: 'next_check', 
	    name: 'Next Check',
	    width: '150px'
	},
	{            
	    field: 'status', 
	    name: 'Status',
	    width: '80px'
	},
	{            
	    field: 'status_string', 
	    name: 'Monitor Output',
	    width: 'auto'
	},
	];

    shell_data = {
	label: "script",
	identifier: "id",
	items: []
    };

    shellMonitorStore = new dojo.data.ItemFileWriteStore({ 
	    data: shell_data 
	});		

    var tc_1 = new dojox.grid.EnhancedGrid({
	    id: id + '_shell_mon_grid',
	    title: 'Shell Scripts',
	    store: shellMonitorStore,
	    structure: shell_layout,
	    clientSort: true,
	    rowSelector: '10px',
	    selectionMode: 'multiple',
	    plugins: {
		nestedSorting: true,
		menus: { 
		    rowMenu: 'monitorMenu',
		    headerMenu: 'monitorMenu',
		}
	    }
	}, dojo.create('div'));                  
    tc_1.startup();                
    
    // set color coding for grid rows based on monitor status
    dojo.connect(tc_1, 'onStyleRow', function(row) {
	    var item = tc_1.getItem(row.index);
	    if (item) {
		var status = tc_1.store.getValue(item, "status", null);

		if (status == "critical") {
		    row.customStyles += 'color: #a62434;';
		} else if (status == "warn") {
		    row.customStyles += 'color: #b3511d;';
		}
		
	    }
	});

    dojo.connect(tc_1, 'onRowMouseOver', function(e) {
	    var item = tc_1.getItem(e.rowIndex);
	    var who = tc_1.store.getValue(item, "ack_by", null);
	    var what = tc_1.store.getValue(item, "ack_msg", null);
	    var msg = null;
	    if (who && what) {
		msg = who + ": " + what;
	    }
	    
	    if (msg) {
		dijit.showTooltip(msg, e.cellNode);
	    }
	});

    dojo.connect(tc_1, 'onRowMouseOut', function(e) {
	    dijit.hideTooltip(e.cellNode);
	});

    dojo.connect(tc_1, 'onRowContextMenu', function(e) {
	    var item = tc_1.getItem(e.rowIndex);
	    var notify = tc_1.store.getValue(item, "notify", null);
	    var disabled = tc_1.store.getValue(item, "disabled", null);

	    if (notify) {
		dijit.byId('monitorMenuAddNotification').attr('disabled','true');
		dijit.byId('monitorMenuRemoveNotification').attr('disabled', null);
	    } else {
 		dijit.byId('monitorMenuAddNotification').attr('disabled', null);
		dijit.byId('monitorMenuRemoveNotification').attr('disabled','true');
	    }

	    if (disabled && (disabled == 1)) {
 		dijit.byId('monitorMenuEnable').attr('disabled', null);
		dijit.byId('monitorMenuDisable').attr('disabled','true');
	    } else {
 		dijit.byId('monitorMenuEnable').attr('disabled', 'true');
		dijit.byId('monitorMenuDisable').attr('disabled', null);
	    }
	});

    // load data for tab
    addShellMonitorData(id, tc_1);
    
    return(tc_1);
}

function createUrlTab(id) {
    // create data  grid 
    var url_layout = [{
	    field: 'url',
	    name: 'URL',
	    width: '190px'
	},      
	{
	    field: 'request_method',
	    name: 'Method',
	    width: '60px'
	},
	{
	    field: 'expect_http_status',
	    name: 'Expect Code',
	    width: '70px'
	},      
	{
	    field: 'expect_http_content',
	    name: 'Expect Content',
	    width: '140px'
	},      
	{            
	    field: 'last_check', 
	    name: 'Last Check',
	    width: '150px'
	},
	{            
	    field: 'next_check', 
	    name: 'Next Check',
	    width: '150px'
	},
	{            
	    field: 'status', 
	    name: 'Status',
	    width: '70px'
	},
	{            
	    field: 'status_string', 
	    name: 'Monitor Output',
	    width: 'auto'
	},
	];

    url_data = {
	label: "url",
	identifier: "id",
	items: []
    };

    urlMonitorStore = new dojo.data.ItemFileWriteStore({ 
	    data: url_data 
	});		

    var tc_1 = new dojox.grid.EnhancedGrid({
	    id: id + '_url_mon_grid',
	    title: 'URLs',
	    store: urlMonitorStore,
	    structure: url_layout,
	    clientSort: true,
	    rowSelector: '10px',
	    selectionMode: 'multiple',
	    plugins: {
		nestedSorting: true,
		menus: { 
		    rowMenu: 'monitorMenu',
		    headerMenu: 'monitorMenu',
		}
	    }
	}, dojo.create('div'));                  
    tc_1.startup();                
    
    // set color coding for grid rows based on monitor status
    dojo.connect(tc_1, 'onStyleRow', function(row) {
	    var item = tc_1.getItem(row.index);
	    if (item) {
		var status = tc_1.store.getValue(item, "status", null);

		if (status == "critical") {
		    row.customStyles += 'color: #a62434;';
		} else if (status == "warn") {
		    row.customStyles += 'color: #b3511d;';
		}
		
	    }
	});

    dojo.connect(tc_1, 'onRowMouseOver', function(e) {
	    var item = tc_1.getItem(e.rowIndex);
	    var who = tc_1.store.getValue(item, "ack_by", null);
	    var what = tc_1.store.getValue(item, "ack_msg", null);
	    var msg = null;
	    if (who && what) {
		msg = who + ": " + what;
	    }
	    
	    if (msg) {
		dijit.showTooltip(msg, e.cellNode);
	    }
	});

    dojo.connect(tc_1, 'onRowMouseOut', function(e) {
	    dijit.hideTooltip(e.cellNode);
	});

    dojo.connect(tc_1, 'onRowContextMenu', function(e) {
	    var item = tc_1.getItem(e.rowIndex);
	    var notify = tc_1.store.getValue(item, "notify", null);
	    var disabled = tc_1.store.getValue(item, "disabled", null);

	    if (notify) {
		dijit.byId('monitorMenuAddNotification').attr('disabled','true');
		dijit.byId('monitorMenuRemoveNotification').attr('disabled', null);
	    } else {
 		dijit.byId('monitorMenuAddNotification').attr('disabled', null);
		dijit.byId('monitorMenuRemoveNotification').attr('disabled','true');
	    }

	    if (disabled && (disabled == 1)) {
 		dijit.byId('monitorMenuEnable').attr('disabled', null);
		dijit.byId('monitorMenuDisable').attr('disabled','true');
	    } else {
 		dijit.byId('monitorMenuEnable').attr('disabled', 'true');
		dijit.byId('monitorMenuDisable').attr('disabled', null);
	    }
	});

    // load data for tab
    addUrlMonitorData(id, tc_1);
    
    return(tc_1);
}

function createCertificateTab(id) {
    // create data  grid 
    var certificate_layout = [{
	    field: 'url',
	    name: 'Url',
	    width: '170px'
	},      
	{            
	    field: 'last_check', 
	    name: 'Last Check',
	    width: '150px'
	},
	{            
	    field: 'next_check', 
	    name: 'Next Check',
	    width: '150px'
	},
	{            
	    field: 'status', 
	    name: 'Status',
	    width: '80px'
	},
	{            
	    field: 'status_string', 
	    name: 'Monitor Output',
	    width: 'auto'
	},
	];

    certificate_data = {
	label: "certmon",
	identifier: "id",
	items: []
    };

    certificateMonitorStore = new dojo.data.ItemFileWriteStore({ 
	    data: certificate_data 
	});		

    var tc_1 = new dojox.grid.EnhancedGrid({
	    id: id + '_cert_mon_grid',
	    title: 'SSL Certificates',
	    store: certificateMonitorStore,
	    structure: certificate_layout,
	    clientSort: true,
	    rowSelector: '10px',
	    selectionMode: 'multiple',
	    plugins: {
		nestedSorting: true,
		menus: { 
		    rowMenu: 'monitorMenu',
		    headerMenu: 'monitorMenu',
		}
	    }
	}, dojo.create('div'));                  
    tc_1.startup();                
    
    // set color coding for grid rows based on monitor status
    dojo.connect(tc_1, 'onStyleRow', function(row) {
	    var item = tc_1.getItem(row.index);
	    if (item) {
		var status = tc_1.store.getValue(item, "status", null);

		if (status == "critical") {
		    row.customStyles += 'color: #a62434;';
		} else if (status == "warn") {
		    row.customStyles += 'color: #b3511d;';
		}
		
	    }
	});

    dojo.connect(tc_1, 'onRowMouseOver', function(e) {
	    var item = tc_1.getItem(e.rowIndex);
	    var who = tc_1.store.getValue(item, "ack_by", null);
	    var what = tc_1.store.getValue(item, "ack_msg", null);
	    var msg = null;
	    if (who && what) {
		msg = who + ": " + what;
	    }
	    
	    if (msg) {
		dijit.showTooltip(msg, e.cellNode);
	    }
	});

    dojo.connect(tc_1, 'onRowMouseOut', function(e) {
	    dijit.hideTooltip(e.cellNode);
	});

    dojo.connect(tc_1, 'onRowContextMenu', function(e) {
	    var item = tc_1.getItem(e.rowIndex);
	    var notify = tc_1.store.getValue(item, "notify", null);
	    var disabled = tc_1.store.getValue(item, "disabled", null);

	    if (notify) {
		dijit.byId('monitorMenuAddNotification').attr('disabled','true');
		dijit.byId('monitorMenuRemoveNotification').attr('disabled', null);
	    } else {
 		dijit.byId('monitorMenuAddNotification').attr('disabled', null);
		dijit.byId('monitorMenuRemoveNotification').attr('disabled','true');
	    }

	    if (disabled && (disabled == 1)) {
 		dijit.byId('monitorMenuEnable').attr('disabled', null);
		dijit.byId('monitorMenuDisable').attr('disabled','true');
	    } else {
 		dijit.byId('monitorMenuEnable').attr('disabled', 'true');
		dijit.byId('monitorMenuDisable').attr('disabled', null);
	    }
	});

    // load data for tab
    addCertificateMonitorData(id, tc_1);
    
    return(tc_1);
}

function openDevice() {
    // get selected tree item
    var id = deviceStore.getValues(deviceTreeSelectedItem, 'id').toString();
    id = id.replace("d_", "");
    var name = deviceStore.getValues(deviceTreeSelectedItem, 'name');

    // see if tab is open already
    // if it is just select it
    // otherwise open it up
    this_tc = dijit.byId(id + '_tab');
    if (this_tc) {
	dijit.byId("panoptes_tab_container").selectChild(this_tc);
    } else {
	// add array element to timers array to hold timer ids of reload timers
	timers[id + '_tab'] = [];

	// border container to hold the content for the tab for this
	// device
	var bc = new dijit.layout.BorderContainer({
		id: id + '_tab',
		title: name,
		style: "width: 100%; height: 100%;",
		closable: true,
		onClose: function() {
		    // cancel all of the timer ids for this tab
		    for (i = 0; i < timers[id + '_tab'].length; i++) {
			clearTimeout(timers[id + '_tab'][i]);
		    }
		    delete(timers[id + '_tab']);
		    return(true);
		}
	    });

	dojo.connect(bc, 'onClose', function() {
	    });

	// info pane for new tab
	var ic = new dijit.layout.ContentPane({
		id: id + '_info',
		title: ' Device Info',
		region: 'leading',
		style: 'width: 15%',
		closable: true,
		content: 'info',	    
	    });

	// add info data to info container
	addInfoData(id, ic);

	// header for new tab
	var hc = new dijit.layout.ContentPane({
		id: id + '_hdr',
		region: 'top',
		title: 'Device Header',
		closable: true,
		content: '<b>' + name + '</b>'
	    });

	// tab container for new tab
	var tc = new dijit.layout.TabContainer({
		id: id + '_tc',
		region: 'center',
		closable: true,
		style: "height: 100%; width: 100%;"
	    });
	
	// tabs for new tab container
	tc_1 = createPortMonitorTab(id);
	tc_2 = createPerformanceHistoryTab(id);
	tc_3 = createCertificateTab(id);
	tc_4 = createSNMPTab(id);
	tc_5 = createShellTab(id);
	tc_6 = createUrlTab(id);
	tc_7 = createAlertHistoryTab(id);

	// put all of the components together in border container
	// and append to parent tab
	tc.addChild(tc_1);
	tc.addChild(tc_2);
	tc.addChild(tc_3);
	tc.addChild(tc_4);
	tc.addChild(tc_5);
	tc.addChild(tc_6);
	tc.addChild(tc_7);
	bc.addChild(ic);
	bc.addChild(hc);
	bc.addChild(tc);
    
	dijit.byId("panoptes_tab_container").addChild(bc);
	dijit.byId("panoptes_tab_container").selectChild(bc);
    }
}

function addMonitor() {
    // figure out which grid we're working with
    selectedTab = dijit.byId('panoptes_tab_container').selectedChildWidget;
    id = selectedTab.id.replace("_tab", "");

    if (dijit.byId(id + '_port_mon_grid').selected) {
	_addMonitor(dijit.byId(id + '_port_mon_grid'), 'port_monitors', id);
    } else if (dijit.byId(id + '_cert_mon_grid').selected) {
	_addMonitor(dijit.byId(id + '_cert_mon_grid'), 'certificate_monitors', 
		    id);
    } else if (dijit.byId(id + '_snmp_mon_grid').selected) {
	_addMonitor(dijit.byId(id + '_snmp_mon_grid'), 'snmp_monitors', 
		    id);
    } else if (dijit.byId(id + '_shell_mon_grid').selected) {
	_addMonitor(dijit.byId(id + '_shell_mon_grid'), 'shell_monitors', 
		    id);
    } else if (dijit.byId(id + '_url_mon_grid').selected) {
	_addMonitor(dijit.byId(id + '_url_mon_grid'), 'url_monitors', 
		    id);
    }
}

function ackMonitor() {
    // figure out which grid we're working with
    selectedTab = dijit.byId('panoptes_tab_container').selectedChildWidget;
    id = selectedTab.id.replace("_tab", "");

    if (dijit.byId(id + '_port_mon_grid').selected) {
	_ackMonitor(dijit.byId(id + '_port_mon_grid'), id, 'port_monitors');
    } else if (dijit.byId(id + '_cert_mon_grid').selected) {
	_ackMonitor(dijit.byId(id + '_cert_mon_grid'), id, 
		    'certificate_monitors');
    } else if (dijit.byId(id + '_snmp_mon_grid').selected) {
	_ackMonitor(dijit.byId(id + '_snmp_mon_grid'), id, 
		    'snmp_monitors');
    } else if (dijit.byId(id + '_shell_mon_grid').selected) {
	_ackMonitor(dijit.byId(id + '_shell_mon_grid'), id, 
		    'shell_monitors');
    } else if (dijit.byId(id + '_url_mon_grid').selected) {
	_ackMonitor(dijit.byId(id + '_url_mon_grid'), id, 
		    'url_monitors');
    }
}

function disableMonitor() {
    // figure out which grid we're working with
    selectedTab = dijit.byId('panoptes_tab_container').selectedChildWidget;
    id = selectedTab.id.replace("_tab", "");

    if (dijit.byId(id + '_port_mon_grid').selected) {
	_disableMonitor(dijit.byId(id + '_port_mon_grid'), 'port_monitors', 'disable');
    } else if (dijit.byId(id + '_cert_mon_grid').selected) {
	_disableMonitor(dijit.byId(id + '_cert_mon_grid'), 'certificate_monitors', 'disable');
    } else if (dijit.byId(id + '_snmp_mon_grid').selected) {
	_disableMonitor(dijit.byId(id + '_snmp_mon_grid'), 'snmp_monitors', 'disable');
    } else if (dijit.byId(id + '_shell_mon_grid').selected) {
	_disableMonitor(dijit.byId(id + '_shell_mon_grid'), 'shell_monitors', 'disable');
    } else if (dijit.byId(id + '_url_mon_grid').selected) {
	_disableMonitor(dijit.byId(id + '_url_mon_grid'), 'url_monitors', 'disable');
    }
}

function rescheduleMonitor() {
    // figure out which grid we're working with
    selectedTab = dijit.byId('panoptes_tab_container').selectedChildWidget;
    id = selectedTab.id.replace("_tab", "");

    if (dijit.byId(id + '_port_mon_grid').selected) {
	_rescheduleMonitor(dijit.byId(id + '_port_mon_grid'), 'port_monitors', id);
    } else if (dijit.byId(id + '_cert_mon_grid').selected) {
	_rescheduleMonitor(dijit.byId(id + '_cert_mon_grid'), 'certificate_monitors', id);
    } else if (dijit.byId(id + '_snmp_mon_grid').selected) {
	_rescheduleMonitor(dijit.byId(id + '_snmp_mon_grid'), 'snmp_monitors', id);
    } else if (dijit.byId(id + '_shell_mon_grid').selected) {
	_rescheduleMonitor(dijit.byId(id + '_shell_mon_grid'), 'shell_monitors', id);
    } else if (dijit.byId(id + '_url_mon_grid').selected) {
	_rescheduleMonitor(dijit.byId(id + '_url_mon_grid'), 'url_monitors', id);
    }
}

function enableMonitor() {
    // figure out which grid we're working with
    selectedTab = dijit.byId('panoptes_tab_container').selectedChildWidget;
    id = selectedTab.id.replace("_tab", "");

    if (dijit.byId(id + '_port_mon_grid').selected) {
	_disableMonitor(dijit.byId(id + '_port_mon_grid'), 'port_monitors', 'enable');
    } else if (dijit.byId(id + '_cert_mon_grid').selected) {
	_disableMonitor(dijit.byId(id + '_cert_mon_grid'), 'certificate_monitors', 'enable');
    } else if (dijit.byId(id + '_snmp_mon_grid').selected) {
	_disableMonitor(dijit.byId(id + '_snmp_mon_grid'), 'snmp_monitors', 'enable');
    } else if (dijit.byId(id + '_shell_mon_grid').selected) {
	_disableMonitor(dijit.byId(id + '_shell_mon_grid'), 'shell_monitors', 'enable');
    } else if (dijit.byId(id + '_url_mon_grid').selected) {
	_disableMonitor(dijit.byId(id + '_url_mon_grid'), 'url_monitors', 'enable');
    }
}

function deleteMonitor() {
    // figure out which grid we're working with
    selectedTab = dijit.byId('panoptes_tab_container').selectedChildWidget;
    id = selectedTab.id.replace("_tab", "");

    if (dijit.byId(id + '_port_mon_grid').selected) {
	_deleteMonitor(dijit.byId(id + '_port_mon_grid'), 'port_monitors');
    } else if (dijit.byId(id + '_cert_mon_grid').selected) {
	_deleteMonitor(dijit.byId(id + '_cert_mon_grid'), 'certificate_monitors');
    } else if (dijit.byId(id + '_snmp_mon_grid').selected) {
	_deleteMonitor(dijit.byId(id + '_snmp_mon_grid'), 'snmp_monitors');
    } else if (dijit.byId(id + '_shell_mon_grid').selected) {
	_deleteMonitor(dijit.byId(id + '_shell_mon_grid'), 'shell_monitors');
    } else if (dijit.byId(id + '_url_mon_grid').selected) {
	_deleteMonitor(dijit.byId(id + '_url_mon_grid'), 'url_monitors');
    }
}

function _rescheduleMonitor(dataGrid, type, device_id) {
    var items;

    var ids = [];
    // get row ids
    var itms = dataGrid.selection.getSelected();
    dataGrid.selection.clear();
    
    if (itms.length) {
	dojo.forEach(itms, function(selectedItem) {
		if (selectedItem !== null) {
		    var ent_id = dataGrid.store.getValue(selectedItem, 
							 "id", null);
		    ids.push(ent_id);
		}
	    });
    }

    var label = dojo.create("label", { htmlFor: 'resched_date' });
    label.appendChild(document.createTextNode('New Check Time'));

    date = new dijit.form.DateTextBox({
	    id: 'resched_date',
	    name: 'resched_date',
	    closable: true,
	    title: 'New Check Date',
	    constraints: { datePattern:'MM/dd/yyyy'}
	    });

    time = new dijit.form.TimeTextBox({
            name: 'resched_time',
            id: 'resched_time',
            value: new Date(),
            constraints: {
                timePattern: 'HH:mm',
                clickableIncrement: 'T00:15:00',
                visibleIncrement: 'T00:15:00',
                visibleRange: 'T01:00:00'
            }});

    rst = new dijit.form.Button({
            label: 'Cancel',
            id: 'resched_reset',
            onClick: function() {
                dijit.byId("resched_date").destroy();
                dijit.byId("resched_reset").destroy();
                dijit.byId("resched_submit").destroy();
                dijit.byId("resched_time").destroy();
                // destroy remaining dom nodes
                win = document.getElementById("resched_win");
                while (win.hasChildNodes() >= 1) {
                    win.removeChild(win.firstChild);
                }

                document.body.removeChild(win);
            }
        });

    sub = new dijit.form.Button({
            label: 'Reschedule',
            id: 'resched_submit',
            onClick: function() {
		    var params = { 
			type: type,
			time: dijit.byId('resched_time').attr('displayedValue'),
			date: dijit.byId('resched_date').attr('displayedValue'),
		    };
		    xhrRescheduleMonitor(dataGrid, device_id, params, ids);
		    dijit.byId("resched_date").destroy();
		    dijit.byId("resched_time").destroy();
		    dijit.byId("resched_reset").destroy();
		    dijit.byId("resched_submit").destroy();
		    // destroy remaining dom nodes
		    win = document.getElementById("resched_win");
		    while (win.hasChildNodes() >= 1) {
			win.removeChild(win.firstChild);
		    }
		    
		    document.body.removeChild(win);
            }
        });

    items = [ label, date.domNode, time.domNode, 
	      dojo.create("br"),
	      rst.domNode, sub.domNode ];
    
    createOverlayWindow("resched_win", items);

}

function _addMonitor(dataGrid, type, id) {

    var items;
    if (type == "certificate_monitors") {
	var tb_label = dojo.create("label", { htmlFor: 'add_monitor_url' });
	tb_label.appendChild(document.createTextNode('URL'));

	var tb = new dijit.form.TextBox({
		id: 'add_monitor_url',
		name: 'add_monitor_url',
 		style: 'width: 25em;',
		placeHolder: 'https://'
	    });

	var sub = new dijit.form.Button({
		label: 'Add',
		id: 'add_monitor_submit',
		onClick: function() {
		    var params = { 
			type: 'certificate_monitors',
			url: dijit.byId('add_monitor_url').getValue() 
		    };
		    xhrAddMonitor(dataGrid, id, params);
		    destroyAll("add_monitor");
	    }
	});
    
	var rst = new dijit.form.Button({
		label: 'Cancel',
		id: 'add_monitor_reset',
		onClick: function() {
		    destroyAll("add_monitor");
		}
	    });

        items = [ tb_label, tb.domNode, rst.domNode, sub.domNode ];
    } else if (type == "url_monitors") {
	var tb_label = dojo.create("label", { htmlFor: 'add_monitor_url' });
	tb_label.appendChild(document.createTextNode('URL'));

	var tb = new dijit.form.TextBox({
		id: 'add_monitor_url',
		name: 'add_monitor_url',
		style: 'width: 25em;',
		placeHolder: 'http://'
	    });

	var tb2_label = dojo.create("label", { htmlFor: 'add_monitor_code'});
	tb2_label.appendChild(document.createTextNode('Expected HTTP Status Code'));

	var tb2 = new dijit.form.TextBox({
		id: 'add_monitor_code',
		name: 'add_monitor_code',
		style: 'width: 5em;',
		required: true,
		placeHolder: '200'
	    });

	var tb3_label = dojo.create("label", { htmlFor: 'add_monitor_content' });
	tb3_label.appendChild(document.createTextNode('Expected Content'));

	var tb3 = new dijit.form.TextBox({
		id: 'add_monitor_content',
		name: 'add_monitor_content',
		style: 'width: 20em;',
		required: false,
		placeHolder: 'optional text in web page'
	    });

	var httpMethodStore = new dojo.data.ItemFileReadStore({
		data: {
		    identifier: 'value',
		    label: 'label',
		    items: [
	                    { value: 'GET', label: 'get' },
	                    { value: 'POST', label: 'post' },
	                    { value: 'HEAD', label: 'head' },
			    ],
		} 
	});		

	var tb4_label = dojo.create("label", { htmlFor: 'add_monitor_method' });
	tb4_label.appendChild(document.createTextNode('Request Method'));

	var tb4 = new dijit.form.FilteringSelect({
		id: 'add_monitor_method',
		name: 'add_monitor_method',	
		store: httpMethodStore,
		searchAttr: 'value',
		labelFunc: function(itm, str) {
		    var label = str.getValue(itm, 'label');
		    return label;
		},
		labelAttr: 'label',
		value: 'get'
	    });
	

	var tb5_label = dojo.create("label", { htmlFor: 'add_monitor_post_vars' });
	tb5_label.appendChild(document.createTextNode('Post Variables'));

	var tb5 = new dijit.form.TextBox({
		id: 'add_monitor_post_vars',
		name: 'add_monitor_post_vars',
		style: 'width: 20em;',
		required: false,
		placeHolder: 'var1=val1,var2=val2...'
	    });

	
	var sub = new dijit.form.Button({
		label: 'Add',
		id: 'add_monitor_submit',
		onClick: function() {
		    var params = { 
			type: 'url_monitors',
			url: dijit.byId('add_monitor_url').getValue(),
			expect_http_status: dijit.byId('add_monitor_code').getValue(),
			expect_http_content: dijit.byId('add_monitor_content').getValue(),
			request_method: dijit.byId('add_monitor_method').getValue(),
			http_post_vars: dijit.byId('add_monitor_post_vars').getValue()
		    };
		    xhrAddMonitor(dataGrid, id, params);
		    destroyAll("add_monitor");
	    }
	});
    
	var rst = new dijit.form.Button({
		label: 'Cancel',
		id: 'add_monitor_reset',
		onClick: function() {
		    destroyAll("add_monitor");
		}
	    });

        items = [ tb_label, tb.domNode, tb2_label, tb2.domNode,
		  dojo.create("br"),
		  tb3_label, tb3.domNode, 
		  dojo.create("br"),
		  tb4_label, tb4.domNode, 
		  dojo.create("br"),
		  tb5_label, tb5.domNode, 
		  dojo.create("br"), rst.domNode, sub.domNode ];
    } else if (type == "port_monitors") {
	var tb1_label = dojo.create("label", { htmlFor: 'add_monitor_port' });
	tb1_label.appendChild(document.createTextNode('Port'));

	var tb1 = new dijit.form.NumberSpinner({
		id: 'add_monitor_port',
		name: 'add_monitor_port',
		value: 80,
		style: 'width: 100px;',
		constraints: {
		    min: 4,
		    max: 65536,
		    places: 0
		}
	    });

	var tb2_label = dojo.create("label", { htmlFor: 'add_monitor_proto' });
	tb2_label.appendChild(document.createTextNode('Protocol'));

	var protoStore = new dojo.data.ItemFileReadStore({ 
		data: {
		    identifier: 'value',
		    label: 'label',
		    items: [
	                    { value: 'tcp', label: 'tcp' },
	                    { value: 'udp', label: 'udp' },
			    ],
		} 
	});		

	var tb2 = new dijit.form.FilteringSelect({
		id: 'add_monitor_proto',
		name: 'add_monitor_proto',	
		store: protoStore,
		searchAttr: 'value',
		value: 'tcp'
	    });

	var sub = new dijit.form.Button({
		label: 'Add',
		id: 'add_monitor_submit',
		onClick: function() {
		    var params = { 
			type: 'port_monitors',
			port: dijit.byId('add_monitor_port').getValue(),
			proto: dijit.byId('add_monitor_proto').getValue() 
		    };
		    xhrAddMonitor(dataGrid, id, params);
		    destroyAll("add_monitor");
	    }
	});
    
	var rst = new dijit.form.Button({
		label: 'Cancel',
		id: 'add_monitor_reset',
		onClick: function() {
		    destroyAll("add_monitor");
		}
	    });

        items = [ tb1_label, tb1.domNode, tb2_label, tb2.domNode,
		  dojo.create("br"), rst.domNode, sub.domNode ];
    } else if (type == "shell_monitors") {
	var sb1_label = dojo.create("label", { htmlFor: 'add_monitor_script' });
	sb1_label.appendChild(document.createTextNode('Script '));

	var sb1 = new dijit.form.FilteringSelect({
		id: 'add_monitor_script',
		store: availableShellMonitorStore,
		title: 'Monitor',	    
		searchAttr: 'script',
		onChange: function(val) {
		    sb = dijit.byId('add_monitor_script');

		    document.getElementById('add_monitor_param_div_label').style.display='none';
		    // remove existing parameter list if any
		    // and add appropriate ones for this script
		    pr = dijit.byId('add_monitor_script_param');
		    if (pr) {
			pr.destroy();
		    }
		   
		    // get item from store
		    var handleGet = function(item) {
			param = availableShellMonitorStore.getValue(item, 'param');
			if (param) {
			    // create param input
			    tb = new dijit.form.TextBox({
				    id: 'add_monitor_script_param',
				    name: 'add_monitor_script_param',
				    style: 'width: 25em;',
				    placeHolder: param
				});
			    
			    document.getElementById('add_monitor_param_div_label').style.display='block';
			    tb.placeAt(document.getElementById('add_monitor_param_div'));
			}
		    };

		    availableShellMonitorStore.fetchItemByIdentity({
			    identity: val,
			    onItem: handleGet
			});
		}
	    });

	var param_label = dojo.create("label", { id: 'add_monitor_param_div_label',
						 htmlFor: 'add_monitor_param_div',
						 style: { display: 'none' }});
	param_label.appendChild(document.createTextNode('Parameter '));

	var param_div = dojo.create("div", { id: 'add_monitor_param_div' });

	var sub = new dijit.form.Button({
		label: 'Add',
		id: 'add_monitor_submit',
		onClick: function() {
		    prms = dijit.byId('add_monitor_script_param');
		    if (prms) {
			scr_parms = Base64.encode(prms.getValue()); 
		    } else {
			scr_parms = '';
		    }
		    
		    var params = { 
			type: 'shell_monitors',
			script: dijit.byId('add_monitor_script').get('displayedValue'),
			params: scr_parms 
		    };
		    xhrAddMonitor(dataGrid, id, params);
		    if (prms) {
			prms.destroy();
		    }
		    destroyAll("add_monitor");
	    }
	});
    
	var rst = new dijit.form.Button({
		label: 'Cancel',
		id: 'add_monitor_reset',
		onClick: function() {
		    prms = dijit.byId('add_monitor_script_param');
		    if (prms) {
			prms.destroy();
		    }
		    destroyAll("add_monitor");
		}
	    });

        items = [ sb1_label, sb1.domNode,
		  dojo.create("br"), 
		  param_label, param_div,
		  dojo.create("br"), 
		  rst.domNode, sub.domNode ];
    } else if (type == "snmp_monitors") {
	var tb1_label = dojo.create("label", { htmlFor: 'add_monitor_community' });
	tb1_label.appendChild(document.createTextNode('SNMP Community '));

	var tb1 = new dijit.form.TextBox({
		id: 'add_monitor_community',
		name: 'add_monitor_community',
		style: 'width: 100px;'
	    });

	var tb2_label = dojo.create("label", { htmlFor: 'add_monitor_name' });
	tb2_label.appendChild(document.createTextNode('Group Name '));

	var tb2 = new dijit.form.TextBox({
		id: 'add_monitor_name',
		name: 'add_monitor_name',
		style: 'width: 100px;'
	    });

	var sub = new dijit.form.Button({
		label: 'Load MIBs',
		id: 'add_monitor_submit',
		onClick: function() {
		    var params = { 
			type: 'snmp_monitors',
			community: dijit.byId('add_monitor_community').getValue(),
			name: dijit.byId('add_monitor_name').getValue()
		    };
		    // destroy dijits
		    destroyAll("add_monitor");

		    snmpMonitorStep2(dataGrid, id, params);
		}
	});
    
	var rst = new dijit.form.Button({
		label: 'Cancel',
		id: 'add_monitor_reset',
		onClick: function() {
		    // destroy dijits
		    destroyAll("add_monitor");
		}
	    });

        items = [ tb1_label, tb1.domNode,
		  dojo.create("br"),
		  tb2_label, tb2.domNode,
		  dojo.create("br"),
		  rst.domNode, sub.domNode ];
    }

    createOverlayWindow("add_monitor", items);
}

function snmpMonitorStep2(dataGrid, id, params) {

    dnd_src = dojo.create("div", { id: 'add_monitor_dnd_src', 
				   style: { border: ' 1px solid black', align: 'left',
					    height: '200px', width: '350px', cssFloat: 'left',
					    marginRight: '200px', overflow: 'scroll' }});

    srcMibs = new dojo.dnd.Source(dnd_src, {
	    accept: ['mib'],
	    creator: function(item, hint) { 
		var type = ['mib'];
                var node = dojo.create("div", { id: dojo.dnd.getUniqueId(), 
						innerHTML: item.mib_txt,
						title: item.mib });
            
                return({ node: node, data: item, type: type });
            }
	});

    dnd_tgt = dojo.create("div", { id: 'add_monitor_dnd_tgt',
				   style: { border: '1px solid black', align: 'right',
					    height: '200px', width: '350px', cssFloat: 'right',
					    overflow: 'scroll' }});

    tgtMibs = new dojo.dnd.Source(dnd_tgt, {
	    accept: ['mib'],
	    creator: function(item, hint) {
                var type = ['mib'];
                var node = dojo.create("div", { id: dojo.dnd.getUniqueId(),
						innerHTML: item.mib_txt,
						title: item.mib });
            
                return({ node: node, data: item, type: type });
            }
	});

    // kick off snmp walk to load available mibs
    loadMibs(id, params['community'], srcMibs);

    sub = new dijit.form.Button({
	    label: 'Add',
	    id: 'add_monitor_submit',
	    onClick: function() {
		var a = [];

		tgtMibs.forInItems(function (obj, id, map) {
			a.push(obj.data.mib);
		    });

		params['oids'] = a;

		xhrAddMonitor(dataGrid, id, params);		    
		srcMibs.destroy();
		tgtMibs.destroy();
		
		// destroy remaining dom nodes
		win = document.getElementById("add_monitor");
		while (win.hasChildNodes() >= 1) {
		    win.removeChild(win.firstChild);
		}

		document.body.removeChild(document.getElementById("add_monitor"));
	    }
	});
    
    rst = new dijit.form.Button({
	    label: 'Cancel',
	    id: 'add_monitor_reset',
	    onClick: function() {
		srcMibs.destroy();
		tgtMibs.destroy();
		
		// destroy remaining dom nodes
		win = document.getElementById("add_monitor");
		while (win.hasChildNodes() >= 1) {
		    win.removeChild(win.firstChild);
		}
		
		document.body.removeChild(document.getElementById("add_monitor"));
	    }
	});

    createOverlayWindow("add_monitor", [ dnd_src, dnd_tgt,
					 dojo.create("br"),
					 rst.domNode, sub.domNode ]);
}

function _ackMonitor(dataGrid, device_id, type) {
    var ids = [];
    // get row ids
    var items = dataGrid.selection.getSelected();
    dataGrid.selection.clear();
    
    if (items.length) {
	dojo.forEach(items, function(selectedItem) {
		if (selectedItem !== null) {
		    // add acked flag maybe ?
		    var ent_id = dataGrid.store.getValue(selectedItem, 
							 "id", null);
		    ids.push(ent_id);
		}
	    });
    }

    tb_label = dojo.create("label", { htmlFor: 'ack_monitor_msg' });
    tb_label.appendChild(document.createTextNode('Comment '));
    
    tb = new dijit.form.TextBox({
	    id: 'ack_monitor_msg',
	    name: 'ack_monitor_msg',
	    style: 'width: 25em;'
	});


    sub = new dijit.form.Button({
	    label: 'Acknowledge',
	    onClick: function() {
		xhrAckMonitor(device_id, ids, type, 
			      dijit.byId('ack_monitor_msg').getValue());
		dijit.byId("ack_monitor_msg").destroy();
		document.body.removeChild(document.getElementById("ack_monitor"));
	    }
	});
    
    rst = new dijit.form.Button({
	    label: 'Cancel',
	    onClick: function() {
		dijit.byId("ack_monitor_msg").destroy();
		document.body.removeChild(document.getElementById("ack_monitor"));
	    }
	});

    items = [ tb_label, tb.domNode, rst.domNode, sub.domNode ];
    
    createOverlayWindow("ack_monitor", items);
}

function _disableMonitor(dataGrid, type, status) {
    var ids = [];
    // get row ids
    var items = dataGrid.selection.getSelected();
    dataGrid.selection.clear();
    
    if (items.length) {
	dojo.forEach(items, function(selectedItem) {
		if (selectedItem !== null) {
		    var id = dataGrid.store.getValues(selectedItem, 'id');
		    ids.push(id);
		    // update device status for context menu
		    if (status == 'disable') {
			dataGrid.store.setValue(selectedItem, 'disabled', 1);
		    } else {
			dataGrid.store.setValue(selectedItem, 'disabled', 0);
		    }
		}
	    });
	dataGrid.store.save();

	// send xml request to actually disable them
	var xhrArgs = {
	    url: '/panoptes/',
	    handleAs: 'json',
	    content: {
		action: 'disableMonitorEntry',
		data: '{ "id" : [' + ids + '], "type" : "' + type + 
		'", "status" : "' + status + '" }'
	    },
	    load: function(data) {
		if (data && data.error) {
		    alert(data.error);
		}
	    },
	};
	
	var deferred = dojo.xhrGet(xhrArgs);
    }
}

function _deleteMonitor(dataGrid, type) {
    var ids = [];
    // get row ids
    var items = dataGrid.selection.getSelected();
    dataGrid.selection.clear();
    
    if (items.length) {
	dojo.forEach(items, function(selectedItem) {
		if (selectedItem !== null) {
		    var id = dataGrid.store.getValues(selectedItem, 'id');
		    ids.push(id);
		    dataGrid.store.deleteItem(selectedItem);
		}
	    });
	dataGrid.store.save();

	// send xml request to actually delete them
	var xhrArgs = {
	    url: '/panoptes/',
	    handleAs: 'json',
	    content: {
		action: 'deleteMonitorEntry',
		data: '{ "id" : [' + ids + '], "type" : "' + type + '" }'
	    },
	    load: function(data) {
		if (data && data.error) {
		    alert(data.error);
		}
	    },
	};
	
	var deferred = dojo.xhrGet(xhrArgs);
    }
}

function xhrAckMonitor(device_id, ids, type, msg) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'ackMonitorEntry',
	    data: '{ "id" : ' + dojo.toJson(ids) + ', ' +
	              '"type" : "' + type + '", "msg" : "' +
	              msg + '", "device_id" : "' + 
	              device_id + '" }'
	    },
	    load: function(data) {
		if (data && data.error) {
		    alert(data.error);
		}
	    },
	};
    
    var deferred = dojo.xhrGet(xhrArgs);
}

function xhrAddMonitor(dataGrid, device_id, params) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'addMonitorEntry',
		data: '{ "id" : "' + device_id + '", ' +
	              '"params" : ' + dojo.toJson(params) + ' }'
	    },
	    load: function(data) {
		if (data && !data.error) {
		    // update data grid
		    for (i = 0; i < data.data.length; i++) {
			dataGrid.store.newItem(data.data[i]);
		    }
		    dataGrid.store.save();
		    dataGrid.setStore(dataGrid.store);
		    dataGrid.update();
		} else {
		    alert(data.error);
		}
	    },
	};
	
	var deferred = dojo.xhrGet(xhrArgs);
}
