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

var dashboards_loaded = false;
var dashboardWidgetStore = null;
var widget_counter = 0;
var monitorTypeStore = new dojo.data.ItemFileReadStore({
	data: {
	    identifier: 'monitor_name',
	    label: 'monitor_name',
	    items: [
{ monitor_name: 'ICMP' },
{ monitor_name: 'Port' },
{ monitor_name: 'SSL Certificate' },
{ monitor_name: 'Shell Script' },
{ monitor_name: 'URL' },
		    ]
	}
    });

//
// _createTemplateParam_internal - called when the previous template parameter has been completely filled out on 
//                                 the add template form to add the right form elements for the particular input type
// @param {String} type - type of monitor being added to the template
// @param {Integer} idx - position in list for naming elements
// @param {String} param_val - default value for the newly created parameter
// @return none
//
function _createTemplateParam_internal(type, idx, param_val) {
    var param = null;

    if (type == "ICMP") {
	// no further data needed
    } else if (type == "Port") {
	// add port spinner
	if (param_val == null) {
	    // default to port 80
	    param_val = 80;
	}

        param = new dijit.form.NumberSpinner({
                id: 'create_template_param' + idx,
                name: 'create_template_param' + idx,
                value: param_val,
                style: 'width: 100px;',
                constraints: {
                    min: 4,
                    max: 65536,
                    places: 0
                }
            });
    } else if (type == "SSL Certificate") {
	// no further data needed
    } else if (type == "Shell Script") {
	param = new dijit.form.FilteringSelect({
		id: 'create_template_param' + idx,
		name: 'create_template_param' + idx,
		store: availableShellMonitorStore,
		title: 'Monitor',	    
		searchAttr: 'script',
	    });
	if (param_val != null) {
	    param.set('value', param_val);
	}
    } else if (type == "URL") {
	param_a = new dijit.form.TextBox({
		id: 'create_template_param_a_' + idx,
		name: 'create_template_param_a_' + idx,
		style: 'width: 25em;',
		placeHolder: 'http://%PANOPTES_MONITOR_ADDR%/some_url'
	    });
	dojo.place(param_a.domNode, "create_template_br" + idx, "before");

	param_b = new dijit.form.TextBox({
		id: 'create_template_param_b_' + idx,
		name: 'create_template_param_b_' + idx,
		style: 'width: 5em;',
		required: true,
		placeHolder: '200'
	    });
	dojo.place(param_b.domNode, "create_template_br" + idx, "before");

	param = new dijit.form.TextBox({
		id: 'create_template_param' + idx,
		name: 'create_template_param' + idx,
		style: 'width: 20em;',
		required: false,
		placeHolder: 'optional text in web page'
	    });
	if (param_val != null) {
	    param_a.set('value', param_val[0]);
	    param_b.set('value', param_val[1]);
	    if (param_val.length > 2) {
		param.set('value', param_val[2]);
	    }
	}
    } else {
	alert("Unknown type: " + type);
    }

    if (param) {
	dojo.place(param.domNode, "create_template_br" + idx, "before");
    }

    // create image node for delete button
    img = new Image();
    img.src = '/panoptes/images/delete.png';
    img.id = 'create_template_delete' + idx;
    img.className = 'panoptesTemplateDeleteIcon';
    img.onclick = Function("_deleteTemplateObject(" + idx + ")");
    dojo.place(img, "create_template_br" + idx, "before");
}

//
// _deleteTemplateObject - remove an item and its associated parameters from a device template
// @param {Integer} id - index of item to remove
// @return none
//
function _deleteTemplateObject(id) {
    // delete dijits and delete image
    var dijits = [ 'create_template_param_b_' + id,
		   'create_template_param_a_' + id,
		   'create_template_param' + id,
		   'create_template_obj' + id ];

    dojo.forEach(dijits, function(d) {
	    // delete dijit
	    var t = dijit.byId(d);
	    if (t) { 
		t.destroy();    
	    }
	});

    // destroy non widgets
    dojo.destroy('create_template_delete' + id);
    dojo.destroy('create_template_br' + id);
}

//
// _createTemplateParam - called by createTemplate when the previous element has been filled out
// @param {Event} e - the onChange dojo event object
// @return none
//
function _createTemplateParam (e) {
    var type = this.get('value');

    var idx = this.get('name').match(/\d+$/);

    _createTemplateParam_internal(type, idx, null);
    _createTemplateObject(null);
}

//
// _createTemplateObject - called to create a new input in the create template process 
// @param {Event} e - the dojo onChange event
// @return none
//
function _createTemplateObject (e) {
    // find next object that hasn't been created yet
    var done = false;
    var i = 0;
    var obj;

    while (!done) {
	obj = dijit.byId("create_template_obj" + i);
	if (!obj) {
	    done = true;
	} else {
	    i++;
	}
    }

    t = new dijit.form.FilteringSelect({
	    id: 'create_template_obj' + i,
	    name: 'create_template_obj' + i,
	    store: monitorTypeStore,
	    title: 'Monitor Type',        
	    searchAttr: 'monitor_name',
	    placeHolder: 'Monitor Type'
	});

    dojo.connect(t, "onChange", dijit.byId('create_template_obj' + i), _createTemplateParam);

    // if i is 0, then the parent is template_name_br, otherwise it's obj i - 1
    var prnt;
    if (!i) { 
	prnt = dojo.byId("template_name_br"); 
    } else {
	prnt = dojo.byId("create_template_br" + (i - 1));
    }
    var b = document.createElement("br");
    b.id = "create_template_br" + i;
    dojo.place(t.domNode, prnt, "after");
    dojo.place(b, t.domNode, "after");
}

//
// loadDashboard - loads the dashboard javascript if it hasn't been loaded and then loads/renders the 
//                 dashboard widgets for the logged in user
// @param none
// @return none
//
function loadDashboard() {
    if (!dashboards_loaded) {
	//load functions for dashboard    
	var handle = dojo.xhrGet({
		url: '/panoptes/js/dashboards.js',
		handleAs: 'javascript',
		sync: true
	    });
	dashboards_loaded = true;
    }

    // get list of widgets this user has added
    var xhrArgs = {
	url: '/panoptes/dashboardWidget.php',
	handleAs: 'json',
	content: {
	    action: 'getUserWidgets',
	    data: '{ }'
	},
	load: function(data) {
	    if (data && !data.error) {
		dojo.forEach(data.data, function(widget) {
			// render widget
			renderWidget(widget);
			widget_counter++;
		    });
	    } else {
		alert(data.error);
	    }
	},
    };
    
    dojo.xhrGet(xhrArgs);       
}

//
// openEditDashboardTab - makes the dashboard editable to add/remove widgets
// @param none
// @return none
//
function openEditDashboardTab() {

    if (!dashboards_loaded) {
	//load functions for dashboard    
	var handle = dojo.xhrGet({
		url: '/panoptes/js/dashboards.js',
		handleAs: 'javascript'
	    });
	dashboards_loaded = true;
    }

    // move focus to dashboard tab
    dijit.byId("panoptes_tab_container").selectChild(dijit.byId("dashboard_tab"));

    // skip the rest if already in edit mode
    if (dashboard_edit_mode) {
	return;
    }

    dashboard_edit_mode = true;

    if (!dashboardWidgetStore) {
	dashboardWidgetStore = new dojo.data.ItemFileWriteStore({
		data: {
		    identifier: 'id',
		    label: 'name',
		    items: []
		}
	    });

	var xhrArgs = {
	    url: '/panoptes/dashboardWidget.php',
	    handleAs: 'json',
	    content: {
		action: 'getDashboardWidgets',
		data: '{ }'
	    },
	    load: function(data) {
		if (data && !data.error) {
		    // fill in data store
		    dojo.forEach(data.data, function(item) {
			    dashboardWidgetStore.newItem(item);
			});
		    dashboardWidgetStore.save();
		} else {
		    alert(data.error);
		}
	    },
	};
	
	dojo.xhrGet(xhrArgs);       
    }

    // add cancel, save, and add new buttons to top of tab
    var cncl_btn = new dijit.form.Button({
	    id: 'dashboard_cancel',
	    label: 'Done',
	    onClick: function() {
		dashboard_edit_mode = false;
		dijit.byId("dashboard_add").destroy();
		dijit.byId("dashboard_save").destroy();
		dijit.byId("dashboard_cancel").destroy();

		var type_val = dijit.byId('new_widget_type');
		if (type_val && type_val.get('value')) {
		    widget_counter--;
		    var xhrArgs = {
			url: '/panoptes/dashboardWidget.php',
			handleAs: 'json',
			content: {
			    action: 'getWidgetFormCleanup',
			    data: '{ "widget_id": "' + type_val.get('value') + '" }'
			},
			load: function(data) {
			    if (data && !data.error) {
				eval(data.data);
			    } else {
				alert(data.error);
			    }
			},
		    };
		    
		    dojo.xhrGet(xhrArgs);       
		}
		
		var prnt = dojo.byId("dashboard_tab");
                // destroy remaining dom nodes/dijits if present
                win = dojo.byId("new_widget_box");
		if (win) {
		    dijit.byId('new_widget_type').destroy();
		    prnt.removeChild(win);
		}
		
		// delete delete icons
		for (i = 0; i < widget_counter; i++) {
		    img = dojo.byId('widget_delete_icon_' + i);
		    if (img) {
			prnt.removeChild(img);
		    }
		}
	    }
	}).placeAt("dashboard_tab", "first");

    var sv_btn = new dijit.form.Button({
	    id: 'dashboard_save',
	    label: 'Save',
	    onClick: function() {
                win = dojo.byId("new_widget_box");
		var params = {};
		if (win) {
		    for (i = 0; i < win.childNodes.length; i++) {
			var my_id = win.childNodes[i].id;
			if (my_id) {
			    var item_id = my_id.replace("widget_","");
			    var thisDijit = dijit.byId(item_id);
			    if (thisDijit) {
				params[item_id] = thisDijit.get('value');
			    } else {
				// not a dijit, just a form element
				params[item_id] = dojo.byId(item_id).value;
			    }
			}
		    }
		}

		// call save function
		var type_val = dijit.byId('new_widget_type');
		if (type_val) {
		    var xhrArgs = {
			url: '/panoptes/dashboardWidget.php',
			handleAs: 'json',
			content: {
			    action: 'saveWidget',
			    data: '{ "widget_id": "' + type_val.get('value') + '", "params": ' +
			    dojo.toJson(params) + ' }'
			},
			load: function(data) {
			    if (data && !data.error) {
				dojo.forEach(data.data, function(widget) {
					// render widget
					renderWidget(widget);
					widget_counter++;
				    });
			    } else {
				alert(data.error);
			    }
			},
		    };
		    
		    dojo.xhrGet(xhrArgs);       

		    // destroy remaining dom nodes/dijits if present
		    win = dojo.byId("new_widget_box");
		    if (win) {
			widget_counter--;
			dijit.byId('new_widget_type').destroy();
			var prnt = dojo.byId("dashboard_tab");
			prnt.removeChild(win);
		    }
		}		
	    }
	}).placeAt("dashboard_tab", "first");

    var add_btn = new dijit.form.Button({
	    id: 'dashboard_add',
	    label: 'Add New',
	    onClick: function() {
		addDashboardWidget();
	    }
	}).placeAt("dashboard_tab", "first");

    // add overlay to widgets with delete button
    if (widget_counter) {
	for (i = 0; i < widget_counter; i++) {
	    var node_pos = dojo.marginBox('widget_box_' + i);
	    var img_x = node_pos.l + node_pos.w - 15;
	    var img_y = node_pos.t - 5;
	    
	    // create image node
	    img = new Image();
	    img.src = '/panoptes/images/delete.png';
	    img.id = 'widget_delete_icon_' + i;
	    img.className = 'dashboardWidgetDeleteIcon';
	    img.onclick = Function("deleteUserWidget(" + i + ")");
	    dojo.style(img, {
		    top: img_y + 'px',
		    left: img_x + 'px'
		});
	    dijit.byId('dashboard_tab').domNode.appendChild(img);
	}
    }
}

//
// deleteUserWidget - remove a widget from the user dashboard
// @param {Integer} idx - position of the widget in the user's dashboard
// @return none
//
function deleteUserWidget(idx) {
    var xhrArgs = {
	url: '/panoptes/dashboardWidget.php',
	handleAs: 'json',
	content: {
	    action: 'deleteUserWidget',
	    data: '{ "pos": "' + idx + '" }'
	},
	load: function(data) {
	    hideLoading();
	    if (data && !data.error) {
		// remove widget from page
		var prnt = dojo.byId("dashboard_tab");
		// delete delete icon
		img = dojo.byId('widget_delete_icon_' + idx);
		box = dojo.byId('widget_box_' + idx);
		prnt.removeChild(img);
		prnt.removeChild(box);
		widget_counter--;
	    } else {
		alert(data.error);
	    }
	},
    };
    
    showLoading();
    dojo.xhrGet(xhrArgs);       
}

//
// openAutoDiscoveryTab - loads the auto discovery tab and retrieves the auto discovery data from
//                        the server
// @param none
// @return none
//
function openAutoDiscoveryTab() {
    // see if the tab exists before trying to create it
    // and just make it active if it's already present
    var b = dijit.byId('auto_discovery_tab');
    
    if (b != null) {
	dijit.byId("panoptes_tab_container").selectChild(b);
	return;
    }

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

//
// openSecurityGroupTab - creates a tab for adding/removing user security groups
// @param none
// @return none
//
function openSecurityGroupTab() {
    // see if the tab exists before trying to create it
    // and just make it active if it's already present
    var b = dijit.byId('manage_security_groups_tab');
    
    if (b != null) {
	dijit.byId("panoptes_tab_container").selectChild(b);
	return;
    }

    // create tab
    var cp = new dijit.layout.ContentPane({
            id: 'manage_security_groups_tab',
            title: 'Security Groups',
	    closable: true,
            style: "width: 100%; height: 100%;"
        });

    // render tab
    dijit.byId("panoptes_tab_container").addChild(cp);

    // add content to tab

    // add group
    add_tb = new dijit.form.TextBox({
	    id: 'add_security_group_name',
	    name: 'add_security_group_name',
	    style: 'width: 25em;',
	    placeHolder: 'Group Name'
	}).placeAt("manage_security_groups_tab");

    add_sub = new dijit.form.Button({
	    id: 'add_security_group_submit',
	    label: 'Create',
	    onClick: function() {
		xhrCreateSecurityGroup(dijit.byId("add_security_group_name").get('displayedValue'));
	    }
	}).placeAt("manage_security_groups_tab");
    
    dojo.place('<br/>', "manage_security_groups_tab");

    // delete group
    del_tb = new dijit.form.FilteringSelect({
	    id: 'del_security_group_name',
	    name: 'del_security_group_name',
	    style: 'width: 15em;',
	    store: userStore,
	    query: { type: 'group' },
	    searchAttr: 'name',
	    placeHolder: 'group to delete'
	}).placeAt("manage_security_groups_tab");

    del_sub = new dijit.form.Button({
	    id: 'del_security_group_submit',
	    label: 'Delete',
	    onClick: function() {
		xhrDeleteSecurityGroup(dijit.byId("del_security_group_name").get('value'));
	    }
	}).placeAt("manage_security_groups_tab");

    // move focus to tab
    dijit.byId("panoptes_tab_container").selectChild(cp);
}

//
// openTemplateTab - open tab for creating/editing/removing device templates
// @param none
// @return none
//
function openTemplateTab() {
    // see if the tab exists before trying to create it
    // and just make it active if it's already present
    var b = dijit.byId('manage_template_tab');
    
    if (b != null) {
	dijit.byId("panoptes_tab_container").selectChild(b);
	return;
    }

    // load list of current templates for edit and delete options

    template_data = {
	label: "name",
	identifier: "id",
	items: []
    };

    templateStore = new dojo.data.ItemFileWriteStore({ 
	    data: template_data
	});	      

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
                // populate data store
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

    // create tab
    var cp = new dijit.layout.ContentPane({
            id: 'manage_template_tab',
            title: 'Device Templates',
	    closable: true,
            style: "width: 100%; height: 100%;"
        });

    // render tab
    dijit.byId("panoptes_tab_container").addChild(cp);

    // add content to tab
    // create button    
    var crt_btn = new dijit.form.Button({
	    id: 'create_tpl',
	    label: 'Create New Template',
	    onClick: function() {
		createTemplate();
	    }
	}).placeAt("manage_template_tab");

    dojo.place('<br/>', "manage_template_tab");

    // delete template pieces
    var del_ts = new dijit.form.FilteringSelect({
   	    id: 'delete_template_selector',
   	    name: 'delete_template_selector',
    	    store: templateStore,
	    title: 'template',	    
    	    searchAttr: 'name',
	    labelFunc: function(itm, str) {
		var label = str.getValue(itm, 'name');
		return label;
	    },
	    labelAttr: 'name'
    	}).placeAt("manage_template_tab");

    var del_sub = new dijit.form.Button({
	    id: 'delete_template_submit',
	    label: 'Delete Template',
	    onClick: function() {
		xhrDeleteTemplate();
	    }
	}).placeAt("manage_template_tab");

    dojo.place('<br/>', "manage_template_tab");

    // edit template
    var edt_ts = new dijit.form.FilteringSelect({
   	    id: 'edit_template_selector',
   	    name: 'edit_template_selector',
    	    store: templateStore,
	    title: 'edit_template',	    
    	    searchAttr: 'name',
	    labelFunc: function(itm, str) {
		var label = str.getValue(itm, 'name');
		return label;
	    },
	    labelAttr: 'name'
    	}).placeAt("manage_template_tab");

    var edt_sub = new dijit.form.Button({
	    id: 'edit_template_submit',
	    label: 'Edit Template',
	    onClick: function() {
		var obj = dijit.byId('edit_template_selector');
		if (obj) {
		    editTemplate(obj);
		}
	    } 
	}).placeAt("manage_template_tab");

    // move focus to tab
    dijit.byId("panoptes_tab_container").selectChild(cp);
}

// 
// editTemplate - edit an existing device template
// @param {Object} tpl - teplate item to edit from templateStore
// @return none
//
function editTemplate(tpl) {
    tb = new dijit.form.TextBox({
	    id: 'template_name',
	    name: 'template_name',
            placeHolder: 'Template Name'
	});

    b = document.createElement("br");
    b.id = "template_name_br";

    createOverlayWindow("create_template", [ tb.domNode, b ]);

    var tpl_id = tpl.get('value');
    templateStore.fetchItemByIdentity({
	    identity: tpl_id,
	    onItem: function(item) {
		// set template name
		dijit.byId('template_name').set('value', 
						templateStore.getValue(item, 'name'));
		dijit.byId('template_name').attr('disabled', 'true');

		// params is a json encoded object
		// convert it and iterate through its items
		var tpl_items = dojo.fromJson(templateStore.getValue(item, 'params'));
		for (var i = 0; i < tpl_items.length; i++) {
		    var tpl_val = null;
		    if (tpl_items[i]['type'] == 'Port') {
			tpl_val = tpl_items[i]['port'];
		    } else if (tpl_items[i]['type'] == 'Shell Script') {
			tpl_val = tpl_items[i]['script'];
		    } else if (tpl_items[i]['type'] == 'URL') {
			tpl_val = [ tpl_items[i]['url'], 
				    tpl_items[i]['code'], 
				    tpl_items[i]['content'] ];
		    }

		    t = new dijit.form.FilteringSelect({
			    id: 'create_template_obj' + i,
			    name: 'create_template_obj' + i,
			    store: monitorTypeStore,
			    value: tpl_items[i]['type'],
			    title: 'Monitor Type',        
			    searchAttr: 'monitor_name'
			});

		    dojo.connect(t, "onChange", dijit.byId('create_template_obj' + i), 
				 _createTemplateParam);

		    // if i is 0, then the parent is template_name_br, 
		    // otherwise it's obj i - 1
		    var prnt;
		    if (!i) { 
			prnt = dojo.byId("template_name_br"); 
		    } else {
			prnt = dojo.byId("create_template_br" + (i - 1));
		    }
		    var b = document.createElement("br");
		    b.id = "create_template_br" + i;
		    dojo.place(t.domNode, prnt, "after");
		    dojo.place(b, t.domNode, "after");

		    _createTemplateParam_internal(tpl_items[i]['type'], i, tpl_val);
		}

		// insert empty node for adding new items
		var prnt = dojo.byId("create_template_br" + (i - 1));
		t = new dijit.form.FilteringSelect({
			id: 'create_template_obj' + i,
			name: 'create_template_obj' + i,
			store: monitorTypeStore,
			placeHolder: 'Monitor Type',
			title: 'Monitor Type',        
			searchAttr: 'monitor_name'
		    }).placeAt(prnt, "after");

		dojo.connect(t, "onChange", dijit.byId('create_template_obj' + i), 
			     _createTemplateParam);
		var b = document.createElement("br");
		b.id = "create_template_br" + i;
		dojo.place(t.domNode, prnt, "after");
		dojo.place(b, t.domNode, "after");


		// add buttons at bottom of form when complete
		rst = new dijit.form.Button({
			id: 'create_template_reset',
			label: 'Cancel',
			onClick: function() {
			    destroyAll("create_template");
			}
		    }).placeAt("create_template_br" + i, "after");

		sub = new dijit.form.Button({
			id: 'create_template_submit',
			label: 'Save',
			onClick: function() {
			    xhrCreateTemplate(tpl_id);
			    destroyAll("create_template");
			}
		    }).placeAt("create_template_br" + i, "after");    
	    }
	});
}

//
// getPrefValue - retrieve preference from userPrefs store and set the value of the dijit for "name" accordingly
// @param {String} scope - preference scope (ie general, notification, etc...)
// @param {String} name - preference name which must be the name of the dijit where the value is being set
// @return none
//
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

//
// loadUserPrefs - load user preferences from the server.  Unset preferences will be filled in by the 
//                 server side code with default values.
// @param none
// @return none
//
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

//
// createPrefTab - draw user form to editing preferences for a given preference scope
// @param {String} name - preference scope
// @param {Array} dijits - array of dijits to add to form
// @param {Array} labels - array ofstrings to be used as labels for dijits
// @return none
//
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

//
// openPrefTab - draw form for setting user preferences
// @param none
// @return none
//
function openPrefTab() {    
    // see if the tab exists before trying to create it
    // and just make it active if it's already present
    var b = dijit.byId('prefs_tab');
    
    if (b != null) {
	dijit.byId("panoptes_tab_container").selectChild(b);
	return;
    }

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

    var theme_items = [{theme_name: 'claro'},
		   {theme_name: 'tundra'},
		   {theme_name: 'nihilo'},
		   {theme_name: 'soria'}
		   ];
    
    // add a11y if running dojo 1.6 or later

    if (dojoVersion >= 160) {
	theme_items.push({theme_name: 'a11y'});
    }

    var chart_theme_items = [{theme_name: 'Adobebricks'},
			     {theme_name: 'Algae'},
			     {theme_name: 'Bahamation'},
			     {theme_name: 'BlueDusk'},
			     {theme_name: 'Charged'},
			     {theme_name: 'Chris'},
			     {theme_name: 'Claro'},
			     {theme_name: 'CubanShirts'},
			     {theme_name: 'Desert'},
			     {theme_name: 'Distinctive'},
			     {theme_name: 'Dollar'},
			     {theme_name: 'Electric'},
			     {theme_name: 'gradientGenerator'},
			     {theme_name: 'Grasshopper'},
			     {theme_name: 'Grasslands'},
			     {theme_name: 'GreySkies'},
			     {theme_name: 'Harmony'},
			     {theme_name: 'IndigoNation'},
			     {theme_name: 'Ireland'},
			     {theme_name: 'Julie'},
			     {theme_name: 'MiamiNice'},
			     {theme_name: 'Midwest'},
			     {theme_name: 'Minty'},
			     {theme_name: 'PrimaryColors'},
			     {theme_name: 'PurpleRain'},
			     {theme_name: 'Renkoo'},
			     {theme_name: 'RoyalPurples'},
			     {theme_name: 'SageToLime'},
			     {theme_name: 'Shrooms'},
			     {theme_name: 'ThreeD'},
			     {theme_name: 'Tom'},
			     {theme_name: 'Tufte'},
			     {theme_name: 'WatersEdge'},
			     {theme_name: 'Wetland'}];

    themeStore = new dojo.data.ItemFileReadStore({
	    data: {
		identifier: 'theme_name',
		label: 'theme_name',
		items: theme_items
	    }
	});

    chartThemeStore = new dojo.data.ItemFileReadStore({
	    data: {
		identifier: 'theme_name',
		label: 'theme_name',
		items: chart_theme_items
	    }
	});

    sb = new dijit.form.FilteringSelect({
            id: 'general_prefs_theme',
            name: 'theme_name',
            store: themeStore,
            title: 'Theme',        
            searchAttr: 'theme_name'
        });

    sb2 = new dijit.form.FilteringSelect({
            id: 'general_prefs_chart_theme',
            name: 'chart_theme_name',
            store: chartThemeStore,
            title: 'ChartTheme',        
            searchAttr: 'theme_name'
        });

    tb = new dijit.form.TextBox({
	    id: 'notification_prefs_addr',
	    name: 'notification_prefs_addr',
	    style: 'width: 25em;',
	    placeHolder: 'Notification email address'
	});

    tb2 = new dijit.form.TextBox({
	    id: 'notification_prefs_xmpp_addr',
	    name: 'notification_prefs_xmpp_addr',
	    style: 'width: 25em;',
	    placeHolder: 'Notification xmpp address'
	});

    // populate current preference values
    getPrefValue('general', 'general_prefs_theme');
    getPrefValue('general', 'general_prefs_chart_theme');
    getPrefValue('notifications', 'notification_prefs_addr');
    getPrefValue('notifications', 'notification_prefs_xmpp_addr');
    
    // add pref tabs
    tc.addChild(createPrefTab('general', [sb, sb2], ['Theme', 'Chart Theme']));
    tc.addChild(createPrefTab('notifications', [tb, tb2], ['E-mail Address', 'XMPP Address']));

    dijit.byId("panoptes_tab_container").addChild(bc);
    dijit.byId("panoptes_tab_container").selectChild(bc);
}

//
// xhrAddPingable - call server side code to create new device that's only monitored via ping
// @param {String} ip_address - ip address of device to monitor
// @return none
//
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

//
// xhrDeleteTemplate - call server side code to remove the currently selected device template from the server
// @param none
// @return none
//
function xhrDeleteTemplate () {
    var obj = dijit.byId('delete_template_selector');

    if (obj) {
	var tpl_id = obj.get('value');

	var xhrArgs = {
	    url: '/panoptes/',
	    handleAs: 'json',
	    content: {
		action: 'deleteDeviceTemplate',
		data: '{ "template_id": "' + tpl_id + '" }'
	    },
	    load: function(data) {
		if (data && ! data.error) {
		    // delete item from store
		    templateStore.fetchItemByIdentity({
			    identity: tpl_id,
			    onItem: function(item, req) {
				templateStore.deleteItem(item);
				templateStore.save();
			    }
			});
		    alert("Template has been deleted.");
		} else {
		    alert(data.error);
		}
	    },
	};
	
	dojo.xhrGet(xhrArgs);
    }
}

//
// xhrCreateTemplate - call server side code to store a newly device template on the server
// @param {Integer} tpl_id - device template id
// @return none
//
function xhrCreateTemplate (tpl_id) {
    var i = 0;
    var obj = dijit.byId("create_template_obj" + i);
    var params = [];

    while (obj) {
	var type = obj.get('value');

	if (type == "ICMP") {
	    params.push({ 'type': type });
	} else if (type == "Port") {
	    var prm = dijit.byId("create_template_param" + i).get('value');
	    params.push({ 'type': type, 'port' : prm });	    
	} else if (type == "SSL Certificate") {
	    params.push({ 'type': type });
	} else if (type == "Shell Script") {
	    var prm = dijit.byId("create_template_param" + i).get('value');
	    params.push({ 'type': type, 'script' : prm });	    
	} else if (type == "URL") {
	    var prm0 = dijit.byId("create_template_param_a_" + i).get('value');
	    var prm1 = dijit.byId("create_template_param_b_" + i).get('value');
	    var prm2 = dijit.byId("create_template_param" + i).get('value');
	    params.push({ 'type': type, 'url' : prm0, 'code' : prm1, 'content' : prm2 });	    
	}

	i++;
	obj = dijit.byId("create_template_obj" + i);
    }

    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'createTemplate',
	    data: '{ "name" : "' + dijit.byId('template_name').get('value') + '", "params" : ' + dojo.toJson(params) + (tpl_id == null ? '}' : ', "id": "' + tpl_id + '"}')
	},
	load: function(data) {
	    if (data && !data.error) {
		if (tpl_id == null) {
		    // if tempalte id was null then this is a new entry 
		    // and we should update the data store
		    dojo.forEach(data.data, function(oneEntry) {
			    templateStore.newItem(oneEntry);
			});
		    templateStore.save();
		}
		alert('Template saved.');
	    } else {
		alert(data.error);
	    }
	},
    };
	
    dojo.xhrGet(xhrArgs);    
}

//
// xhrCreateSecurityGroup - call server side code to create a user security group
// @param {String} name - name of group to create
// @return none
//
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

//
// xhrDeleteSecurityGroup - call server side code to remove a user security group from the server
// @param {String} id - id of group to remove
// @return none
//
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

//
// xhrUploadFile - push a file from the user's desktop to the server to be used as a shell monitor
// @param {String} type - type of file being uploaded.  Currently only supports "script"
// @param {Object} file - file from client computer
// @return none
//
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

//
// uploadFile - allow user to select a file from their desktop to upload as a shell monitor.  Only works in firefox
//              currently
// @param none
// @return none
//
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
                document.body.removeChild(dojo.byId("upload_file"));
	    }
	});
    
    rst = new dijit.form.Button({
	    id: 'upload_file_reset',
            label: 'Cancel',
            onClick: function() {
                dijit.byId("upload_file_reset").destroy();
                dijit.byId("upload_file_submit").destroy();
                document.body.removeChild(dojo.byId("upload_file"));
            }
        });

    var items = [ file_sel, 
		  document.createElement("br"),
		  rst.domNode, sub.domNode ];

    createOverlayWindow("upload_file", items);
}

//
// createTemlpate - called when user clicks create template to initiate the template creation process
// @param none
// @return none
//
function createTemplate () {
    tb = new dijit.form.TextBox({
	    id: 'template_name',
	    name: 'template_name',
            placeHolder: 'Template Name'
	});

    dojo.connect(tb, "onBlur", _createTemplateObject);

    sub = new dijit.form.Button({
	    id: 'create_template_submit',
	    label: 'Save',
	    onClick: function() {
		xhrCreateTemplate(null);
		destroyAll("create_template");
	    }
	});
    
    rst = new dijit.form.Button({
	    id: 'create_template_reset',
            label: 'Cancel',
            onClick: function() {
		destroyAll("create_template");
            }
        });

    b = document.createElement("br");
    b.id = "template_name_br";

    var items = [ tb.domNode, b,
		  rst.domNode, sub.domNode ];

    createOverlayWindow("create_template", items);
}

// 
// addPingable - create form to allow user to add a device manually
// @param none
// @return none
//
function addPingable() {
    tb = new dijit.form.TextBox({
	    id: 'ping_device_ip',
	    name: 'ping_device_ip',
            placeHolder: 'IP Address to monitor'
	});

    sub = new dijit.form.Button({
	    id: 'ping_device_submit',
	    label: 'Add',
	    onClick: function() {
		xhrAddPingable(dijit.byId('ping_device_ip').getValue());
                dijit.byId("ping_device_ip").destroy();
                dijit.byId("ping_device_reset").destroy();
                dijit.byId("ping_device_submit").destroy();
                document.body.removeChild(dojo.byId("add_ping_device"));
	    }
	});
    
    rst = new dijit.form.Button({
	    id: 'ping_device_reset',
            label: 'Cancel',
            onClick: function() {
                dijit.byId("ping_device_ip").destroy();
                dijit.byId("ping_device_reset").destroy();
                dijit.byId("ping_device_submit").destroy();
                document.body.removeChild(dojo.byId("add_ping_device"));
            }
        });

    var items = [ tb.domNode, rst.domNode, sub.domNode ];

    createOverlayWindow("add_ping_device", items);
}
