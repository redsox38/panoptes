function updatePerformanceGraph(id) {
    // get selected metic
    metric = dijit.byId(id + '_perf_metric').get('displayedValue');
    start_dt = dijit.byId(id + '_perf_start_date').get('value');
    stop_dt = dijit.byId(id + '_perf_stop_date').get('value');

    var cp = new dijit.layout.ContentPane({
	    id: id + '_perf_' + metric + '_cp',
	    title: 'Chart 1',
	    content: '',
	    closable: true
	});

    cp.placeAt(dijit.byId(id + '_tc_perf').domNode);

    graphImg = new Image();
    graphImg.src = '/panoptes/graph.php?id=' + id + '&metric=' + metric +
	'&start=' + encodeURIComponent(start_dt) + 
	'&stop=' + encodeURIComponent(stop_dt);
    graphImg.id = id + '_' + metric + '_graph';

    dojo.place(graphImg, cp.domNode, 'last');

    dojo.style(graphImg.id, "opacity", "0");

    fadeArgs = {
	node: graphImg.id,
	duration: 1000
    };
    dojo.fadeIn(fadeArgs).play();
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
		    });

		portMonitorStore.save();
		container.setStore(portMonitorStore);
		container.update();		
	    } else {
		alert(data.error);
	    }
	},	
    };
       
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
	},	
    };
       
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
		new_data = '<b>name : </b>' + data.data.name + '<br/>' +
		'<b>IP : </b>' + data.data.address + '<br/>';
		container.set('content', new_data);
	    } else {
		alert(data.error);
	    }
	},

    };
	
    var resp = dojo.xhrGet(xhrArgs);
}

function createPerformanceHistoryTab(id) {

    perf_monitor_data = {
	label: "perfmon",
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
    	    searchAttr: 'metric'
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
	    width: '90px'
	},
	{            
	    field: 'status_string', 
	    name: 'Monitor Output',
	    width: 'auto'
	},
	];

    port_monitor_data = {
	label: "portmon",
	identifier: "id",
	items: []
    };

    portMonitorStore = new dojo.data.ItemFileWriteStore({ 
	    data: port_monitor_data 
	});		

    var tc_1 = new dojox.grid.EnhancedGrid({
	    id: id + '_port_mon_grid',
	    title: 'Port Monitors',
	    store: portMonitorStore,
	    structure: port_monitor_layout,
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
	}, document.createElement('div'));                  
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
    // load data for availability tab
    addPortMonitorData(id, tc_1);
    
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
	    width: '90px'
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
	    title: 'SSL Certificate Monitors',
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
	}, document.createElement('div'));                  
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
    // load data for tab
    addCertificateMonitorData(id, tc_1);
    
    return(tc_1);
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

    // add info data to info container
    addInfoData(id, ic);

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

    // tabs for new tab container
    tc_1 = createPortMonitorTab(id);
    tc_2 = createPerformanceHistoryTab(id);
    tc_3 = createCertificateTab(id);

    // put all of the components together in border container
    // and append to parent tab
    tc.addChild(tc_1);
    tc.addChild(tc_2);
    tc.addChild(tc_3);
    bc.addChild(ic);
    bc.addChild(hc);
    bc.addChild(tc);
    
    dijit.byId("panoptes_tab_container").addChild(bc);
    dijit.byId("panoptes_tab_container").selectChild(bc);
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
    }
}

function ackMonitor() {
    // figure out which grid we're working with
    selectedTab = dijit.byId('panoptes_tab_container').selectedChildWidget;
    id = selectedTab.id.replace("_tab", "");

    if (dijit.byId(id + '_port_mon_grid').selected) {
	_ackMonitor(dijit.byId(id + '_port_mon_grid'), 'port_monitors');
    } else if (dijit.byId(id + '_cert_mon_grid').selected) {
	_ackMonitor(dijit.byId(id + '_cert_mon_grid'), 'certificate_monitors');
    }
}

function disableMonitor() {
    // figure out which grid we're working with
    selectedTab = dijit.byId('panoptes_tab_container').selectedChildWidget;
    id = selectedTab.id.replace("_tab", "");

    if (dijit.byId(id + '_port_mon_grid').selected) {
	_disableMonitor(dijit.byId(id + '_port_mon_grid'), 'port_monitors');
    } else if (dijit.byId(id + '_cert_mon_grid').selected) {
	_disableMonitor(dijit.byId(id + '_cert_mon_grid'), 'certificate_monitors');
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
    }
}

function _addMonitor(dataGrid, type, id) {

    var items;
    if (type == "certificate_monitors") {
	tb_label = document.createElement("label");
	tb_label.htmlFor = 'add_monitor_url';
	tb_label.appendChild(document.createTextNode('URL'));

	tb = new dijit.form.TextBox({
		id: 'add_monitor_url',
		name: 'add_monitor_url',
		style: 'width: 25em;',
		value: 'https://'
	    });

	sub = new dijit.form.Button({
		label: 'Add',
		onClick: function() {
		    var params = { 
			type: 'certificate_monitors',
			url: dijit.byId('add_monitor_url').getValue() 
		    };
		    xhrAddMonitor(dataGrid, id, params);
		    dijit.byId("add_monitor_url").destroy();
		    document.body.removeChild(document.getElementById("add_monitor"));
	    }
	});
    
	rst = new dijit.form.Button({
		label: 'Cancel',
		onClick: function() {
		    dijit.byId("add_monitor_url").destroy();
		    document.body.removeChild(document.getElementById("add_monitor"));
		}
	    });

        items = [ tb_label, tb.domNode, rst.domNode, sub.domNode ];
    } else if (type == "port_monitors") {
	tb1_label = document.createElement("label");
	tb1_label.htmlFor = 'add_monitor_port';
	tb1_label.appendChild(document.createTextNode('Port'));

	tb1 = new dijit.form.NumberSpinner({
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

	tb2_label = document.createElement("label");
	tb2_label.htmlFor = 'add_monitor_proto';
	tb2_label.appendChild(document.createTextNode('Protocol'));

	protoStore = new dojo.data.ItemFileReadStore({ 
		data: {
		    identifier: 'value',
		    label: 'label',
		    items: [
	                    { value: 'tcp', label: 'tcp' },
	                    { value: 'udp', label: 'udp' },
			    ],
		} 
	});		

	tb2 = new dijit.form.FilteringSelect({
		id: 'add_monitor_proto',
		name: 'add_monitor_proto',	
		store: protoStore,
		searchAttr: 'value',
		value: 'tcp'
	    });

	sub = new dijit.form.Button({
		label: 'Add',
		onClick: function() {
		    var params = { 
			type: 'port_monitors',
			port: dijit.byId('add_monitor_port').getValue() 
		    };
		    xhrAddMonitor(dataGrid, id, params);
		    dijit.byId("add_monitor_port").destroy();
		    document.body.removeChild(document.getElementById("add_monitor"));
	    }
	});
    
	rst = new dijit.form.Button({
		label: 'Cancel',
		onClick: function() {
		    dijit.byId("add_monitor_port").destroy();
		    document.body.removeChild(document.getElementById("add_monitor"));
		}
	    });

        items = [ tb1_label, tb1.domNode, tb2_label, tb2.domNode,
		  document.createElement("br"), rst.domNode, sub.domNode ];
    }

    createOverlayWindow("add_monitor", items);
}

function _ackMonitor(dataGrid, type) {
    alert('Function not yet implemented');
}

function _disableMonitor(dataGrid, type) {
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
		action: 'disableMonitorEntry',
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