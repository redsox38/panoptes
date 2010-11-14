// create new device that's only monitored via ping
function xhrAddPingable(ip_address) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'addPingMonitor',
	    data: '{ "address": "' + ip_address + '" }'
	    },
	load: function(data) {
	    if (data && !data.error) {
		// refresh device tree
		// if it's already been loaded
		if (deviceTree) {
		}
	    } else {
		alert(data.error);
	    }
	},
    };
	
    dojo.xhrGet(xhrArgs);    
}

function addPingable() {
    tb = new dijit.form.TextBox({
	    id: 'ping_device_ip',
	    name: 'ping_device_ip',
	});

    sub = new dijit.form.Button({
	    label: 'Add',
	    onClick: function() {
		xhrAddPingable(dijit.byId('ping_device_ip').getValue());
                dijit.byId("ping_device_ip").destroy();
                document.body.removeChild(document.getElementById("add_ping_device"));
	    }
	});
    
    rst = new dijit.form.Button({
            label: 'Cancel',
            onClick: function() {
                dijit.byId("ping_device_ip").destroy();
                document.body.removeChild(document.getElementById("add_ping_device"));
            }
        });

    var items = [ tb.domNode, rst.domNode, sub.domNode ];

    createOverlayWindow("add_ping_device", items);
}