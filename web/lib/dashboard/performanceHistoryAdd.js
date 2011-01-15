// add device group selector

var perf_hist_add_counter = 0;
var perf_hist_rrd_store = [];

function get_device_RRD(id) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'getRRDs',
	    data: '{ "id": "' + id + '" }'
	},
	load: function(data) {
	    hideLoading();
	    if (data && !data.error) {
		// populate data store
		dojo.forEach(data.data, function(oneEntry) {
			perf_hist_rrd_store[id].newItem(oneEntry);
		    });
		perf_hist_rrd_store[id].save();
	    } else {
		alert(data.error);
	    }
	},

    };

    showLoading();
    var resp = dojo.xhrGet(xhrArgs);
}

function loadPerfHistSelector() {
    dev_sel = new dijit.form.FilteringSelect({
	    id: 'new_widget_device',
	    store: deviceStore,
	    query: { type: 'device' },
	    style: 'width: 150px;',
	    searchAttr: 'id',
	    labelAttr: 'name',
	    labelFunc: function(itm, str) {
		var label = str.getValue(itm, 'name');
		return label;
	    },
	    onChange: function(e) {
		// pull a list of rrds for this device and add a new selector
		var dev_id = dijit.byId('new_widget_device').get('value');
		dev_id = dev_id.replace("d_", "");
		
		if (!perf_hist_rrd_store[dev_id]) {
		    data = {
			label: "label",
			identifier: "metric",
			items: []
		    };
		
		    perf_hist_rrd_store[dev_id] = new dojo.data.ItemFileWriteStore({ 
			    data: data 
			});	      

		    get_device_RRD(dev_id);
		}

		// delete dijit if it already exists 
		var sb = dijit.byId('new_widget_metric');
		if (sb) {
		    sb.destroy();
		}
		
		sb = new dijit.form.FilteringSelect({
			id: 'new_widget_metric',
			store: perf_hist_rrd_store[dev_id],
			style: 'width: 150px;',
			searchAttr: 'metric',
			labelAttr: 'label',
			labelFunc: function(itm, str) {
			    var label = str.getValue(itm, 'label');
			    return label;
			},
			onChange: function(e) {
			    // save device and metric data and delete those widgets
			    // then add a new device widget for the next metric to graph
			    var metric = dijit.byId('new_widget_metric').get('value');
			    var inp = document.createElement('input');
			    inp.type = "hidden";
			    inp.id = "perf_hist_input_" + perf_hist_add_counter;
			    inp.value = dev_id + ":" + metric;
			    var this_node = dojo.byId("new_widget_box");    
			    this_node.appendChild(document.createTextNode(dijit.byId('new_widget_device').get('displayedValue') + " " + dijit.byId('new_widget_metric').get('displayedValue')));
			    this_node.appendChild(inp);
			    this_node.appendChild(document.createElement('br'));
			    dijit.byId('new_widget_metric').destroy();
			    dijit.byId('new_widget_device').destroy();

			    loadPerfHistSelector();
			    perf_hist_add_counter++;
			},
			placeHolder: 'Select a metric'
		    });
		var this_node = dojo.byId("new_widget_box");    
		sb.placeAt(this_node);
	    },
	    placeHolder: 'Select a device'	
	});
    var this_node = dojo.byId("new_widget_box");    
    dev_sel.placeAt(this_node);
}

loadPerfHistSelector();