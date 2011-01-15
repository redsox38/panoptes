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

	    data = {
		label: "label",
		identifier: "metric",
		items: []
	    };

	    perf_hist_rrd_store[dev_id] = new dojo.data.ItemFileWriteStore({ 
		    data: data 
		});	      

	    get_device_RRD(dev_id);

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
		    placeHolder: 'Select a metric'
		});
	    sb.placeAt(node);
	},
	placeHolder: 'Select a device'	
    });
dev_sel.placeAt(node);

perf_hist_add_counter++;