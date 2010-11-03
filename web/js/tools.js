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

    // create new div 
    // with transparent background 
    // defined in css

    var dv1 = document.createElement("div");
    dv1.id = "add_ping_device";
    dv1.innerHTML = "";
    
    // create white background div 
    // to hold form elements
    var dv2 = document.createElement("div");
    dv2.id = "add_ping_device_bg";
    dv2.style.backgroundColor = "white";
    dv2.style.color = "black";
    dv2.style.border = "solid";
    dv2.style.marginTop = "75px";
    dv2.style.marginBottom = "50px";
    dv2.style.marginLeft = "250px";
    dv2.style.marginRight = "250px";
    dv2.style.align = "center";
  
    // needs to be on top of transparent overlay,
    dv2.zIndex = 51;

    dv2.appendChild(tb.domNode);
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