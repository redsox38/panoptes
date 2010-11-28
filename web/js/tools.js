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

function xhrCreateSecurityGroup(name) {
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'createSecurityGroup',
	    data: '{ "group_name": "' + name + '" }'
	},
	load: function(data) {
	    if (data && !data.error) {
		// add to securitygroupstore
	    }
	},
    };
	
    dojo.xhrGet(xhrArgs);    
}

function xhrUploadFile(type, file) {
    file_contents = Base64.encode(file.getAsText(""));

    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'uploadFile',
	    data: '{ "type": "' + type + '", "name": "' +
	             file.fileName + '", "contents": "' +
	             file_contents + '" }'
	},
	load: function(data) {
	    if (data && data.error) {
		alert(data.error);
	    }
	},
    };
	
    dojo.xhrGet(xhrArgs);    
}

function createSecurityGroup() {
    tb = new dijit.form.TextBox({
	    id: 'add_security_group_name',
	    name: 'add_security_group_name',
	    style: 'width: 25em;',
	    placeHolder: 'Group Name'
	});

    sub = new dijit.form.Button({
	    id: 'add_security_group_submit',
	    label: 'Create',
	    onClick: function() {
		xhrCreateSecurityGroup(dijit.byId("add_security_group_name").get('displayedValue'));
		dijit.byId("add_security_group_name").destroy();
		dijit.byId("add_security_group_reset").destroy();
                dijit.byId("add_security_group_submit").destroy();
                document.body.removeChild(document.getElementById("add_security_group"));
	    }
	});
    
    rst = new dijit.form.Button({
	    id: 'add_security_group_reset',
            label: 'Cancel',
            onClick: function() {
		dijit.byId("add_security_group_name").destroy();
                dijit.byId("add_security_group_reset").destroy();
                dijit.byId("add_security_group_submit").destroy();
                document.body.removeChild(document.getElementById("add_security_group"));
            }
        });

    var items = [ tb.domNode, 
		  document.createElement("br"),
		  rst.domNode, sub.domNode ];

    createOverlayWindow("add_security_group", items);

}

function uploadFile() {
    file_sel = document.createElement("input");
    file_sel.type = 'file';
    file_sel.id = 'upload_file_filename';

    sub = new dijit.form.Button({
	    id: 'upload_file_submit',
	    label: 'Upload',
	    onClick: function() {
		xhrUploadFile('script', file_sel.files[0]);
		dijit.byId("upload_file_reset").destroy();
                dijit.byId("upload_file_submit").destroy();
                document.body.removeChild(document.getElementById("upload_file"));
	    }
	});
    
    rst = new dijit.form.Button({
	    id: 'upload_file_reset',
            label: 'Cancel',
            onClick: function() {
                dijit.byId("upload_file_reset").destroy();
                dijit.byId("upload_file_submit").destroy();
                document.body.removeChild(document.getElementById("upload_file"));
            }
        });

    var items = [ file_sel, 
		  document.createElement("br"),
		  rst.domNode, sub.domNode ];

    createOverlayWindow("upload_file", items);
}

function addPingable() {
    tb = new dijit.form.TextBox({
	    id: 'ping_device_ip',
	    name: 'ping_device_ip',
	});

    sub = new dijit.form.Button({
	    id: 'ping_device_submit',
	    label: 'Add',
	    onClick: function() {
		xhrAddPingable(dijit.byId('ping_device_ip').getValue());
                dijit.byId("ping_device_ip").destroy();
                dijit.byId("ping_device_reset").destroy();
                dijit.byId("ping_device_submit").destroy();
                document.body.removeChild(document.getElementById("add_ping_device"));
	    }
	});
    
    rst = new dijit.form.Button({
	    id: 'ping_device_reset',
            label: 'Cancel',
            onClick: function() {
                dijit.byId("ping_device_ip").destroy();
                dijit.byId("ping_device_reset").destroy();
                dijit.byId("ping_device_submit").destroy();
                document.body.removeChild(document.getElementById("add_ping_device"));
            }
        });

    var items = [ tb.domNode, rst.domNode, sub.domNode ];

    createOverlayWindow("add_ping_device", items);
}