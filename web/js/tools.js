
function openAutoDiscoveryTab() {
    // create tab
    var cp = new dijit.layout.ContentPane({
            id: 'auto_discovery_tab',
            title: 'Auto Discovery',
	    closable: true,
            style: "width: 100%; height: 100%;"
        });

    dijit.byId("panoptes_tab_container").addChild(cp);
    dijit.byId("panoptes_tab_container").selectChild(cp);

    // create grid
    createAutoDiscoveryGrid();

}

function getPrefValue(scope, name) {
    showLoading();
    var req = prefStore.fetch({ query: { pref_name: name },
                                onComplete: function(items, req) {
                // there should only be one item
                for (var i = 0; i < items.length; i++) {
		    // set value of dijit
		    dijit.byId(name).setValue(prefStore.getValue(items[i], 'pref_value'));
                }
		hideLoading();
            }});
    
}

function loadUserPrefs() {
    var xhrArgs = {
        url: '/panoptes/',
        handleAs: 'json',
        content: {
            action: 'getAllPrefs',
            data: '{ }'
        },
        load: function(data) {
            if (data && !data.error) {
                // fill in data store
                dojo.forEach(data.data, function(item) {
                        prefStore.newItem(item);
                    });
                prefStore.save();
            } else {
                alert(data.error);
            }
        },
    };

    dojo.xhrGet(xhrArgs);        
}

function createPrefTab(name, dijits, labels) {

    var cp = new dijit.layout.ContentPane({
            id: 'pref_tab_' + name,
            title: name,
            content: '',            
        });

    for (i = 0; i < dijits.length; i++) {
	l = document.createElement("label");
	l.htmlFor = dijits[i].id;
	l.appendChild(document.createTextNode(labels[i]));
	cp.domNode.appendChild(l);

	dijits[i].placeAt(cp.domNode);
	cp.domNode.appendChild(document.createElement("br"));
    }

    var sub = new dijit.form.Button({
	    id: 'pref_tab_' + name + '_submit',
	    label: 'Save',
	    onClick: function() {
		var params = {};
		chld = cp.getChildren();
		dojo.forEach(chld, function(item) {
			if (item.declaredClass != 'dijit.form.Button') {
			    // add to params for xhr call
			    params[item.id] = item.get('value');
			}
		    });

		// now that we got all of the values from the form, 
		// pass them back to the server
		var xhrArgs = {
		    url: '/panoptes/',
		    handleAs: 'json',
		    content: {
			action: 'savePrefs',
			data: '{ "scope": "' + name + '", "prefs": ' +
			      dojo.toJson(params) + '}'
		    },
		    load: function(data) {
			if (data && data.error) {
			    alert(data.error);
			}
		    },
		};
		
		dojo.xhrGet(xhrArgs);    
	    }
	});

    sub.placeAt(cp.domNode);

    return(cp);
}

function openPrefTab() {
    
    var bc = new dijit.layout.BorderContainer({
            id: 'prefs_tab',
            title: 'User Preferences',
            style: "width: 100%; height: 100%;",
            closable: true
        });

    // tab container for preference tabs
    var tc = new dijit.layout.TabContainer({
            id: 'prefs_tc',
            region: 'center',
            style: "height: 100%; width: 100%;"
        });

    bc.addChild(tc);

    themeStore = new dojo.data.ItemFileReadStore({
	    data: {
		identifier: 'theme_name',
		label: 'theme_name',
		items: [
                        {theme_name: 'claro'},
                        {theme_name: 'tundra'},
		        {theme_name: 'nihilo'},
		        {theme_name: 'soria'}
			]
	    }
	});

    sb = new dijit.form.FilteringSelect({
            id: 'general_prefs_theme',
            name: 'theme_name',
            store: themeStore,
            title: 'Theme',        
            searchAttr: 'theme_name'
        });

    tb = new dijit.form.TextBox({
	    id: 'notification_prefs_addr',
	    name: 'notification_prefs_addr',
	    style: 'width: 25em;',
	    placeHolder: 'Notification email address'
	});

    getPrefValue('general', 'general_prefs_theme');
    getPrefValue('notifications', 'notification_prefs_addr');
    
    // add pref tabs
    tc.addChild(createPrefTab('general', [sb], ['theme']));
    tc.addChild(createPrefTab('notifications', [tb], ['address']));

    dijit.byId("panoptes_tab_container").addChild(bc);
    dijit.byId("panoptes_tab_container").selectChild(bc);
}

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
		    // add item to device store
		    itm = deviceStore.newItem(data.data);
		    
		    // add item to ungrouped group
		    req = deviceStore.fetch({ query: { name: 'ungrouped',
						       type: 'group'}, 
					      onComplete: function(items, req) {
				if (items.length) {
				    var chldrn = deviceStore.getValues(items[0], 'children');
				    if (chldrn && chldrn.length) {
					chldrn.push(itm);				       
				    } else {
					chldrn = [ itm ];
				    }
				    deviceStore.setValues(items[0], 'children', chldrn);
				    deviceStore.save();
			
				    // bind device menu to tree node
				    var device_menu = dijit.byId('device_tree_menu');
				    var itemNode = deviceTree.getNodesByItem(deviceTree.model.getIdentity(itm));

				    for (i = 0; i < itemNode.length; i++) {
					device_menu.bindDomNode(itemNode[0].domNode);
				    }

				}
			    }});

		    deviceStore.save();
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
		// add to user store
                dojo.forEach(data.data, function(item) {
                        userStore.newItem(item);
                    });
                userStore.save();
	    }
	},
    };
	
    dojo.xhrGet(xhrArgs);    
}


function xhrDeleteSecurityGroup(id) {
    
    var g_id = id.replace('g_', '');

    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'deleteSecurityGroup',
	    data: '{ "group_id": "' + g_id + '" }'
	},
	load: function(data) {
	    if (data && !data.error) {
		// delete item from store
		userStore.fetchItemByIdentity({
			identity: id,
			onItem: function(item, req) {
			    userStore.deleteItem(item);
			    userStore.save();
			}
		    });
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
	    if (data && !data.error) {
		if (type == 'script') {
		    // upload datastore
		    item = { 'script': file.fileName, 'params': '' };
		    availableShellMonitorStore.newItem(item);
		}
	    } else {
		alert(data.error);
	    }
	},
    };
	
    dojo.xhrGet(xhrArgs);    
}

function deleteSecurityGroup() {
    tb = new dijit.form.FilteringSelect({
	    id: 'del_security_group_name',
	    name: 'del_security_group_name',
	    style: 'width: 15em;',
	    store: userStore,
	    query: { type: 'group' },
	    searchAttr: 'name',
	    placeHolder: 'group to delete'
	});

    sub = new dijit.form.Button({
	    id: 'del_security_group_submit',
	    label: 'Delete',
	    onClick: function() {
		xhrDeleteSecurityGroup(dijit.byId("del_security_group_name").get('value'));
		dijit.byId("del_security_group_name").destroy();
		dijit.byId("del_security_group_reset").destroy();
                dijit.byId("del_security_group_submit").destroy();
                document.body.removeChild(document.getElementById("del_security_group"));
	    }
	});
    
    rst = new dijit.form.Button({
	    id: 'del_security_group_reset',
            label: 'Cancel',
            onClick: function() {
		dijit.byId("del_security_group_name").destroy();
                dijit.byId("del_security_group_reset").destroy();
                dijit.byId("del_security_group_submit").destroy();
                document.body.removeChild(document.getElementById("del_security_group"));
            }
        });

    var items = [ tb.domNode,
		  document.createElement("br"),
		  rst.domNode, sub.domNode ];

    createOverlayWindow("del_security_group", items);
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