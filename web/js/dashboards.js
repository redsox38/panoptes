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

var widget_width = 206; // width + (border width + margin + padding / 2)
var dashboard_x_padding = 5;
var dashboard_y_padding = 55;
var dashboard_tab_info = dojo.position(dijit.byId("dashboard_tab").domNode, true);
var ncols = Math.floor((dashboard_tab_info.w - dashboard_tab_info.x - dashboard_x_padding) / widget_width);

//
// renderWidget - call the server function to retrieve the widget data
//                from the server and draw the results on the screen.
// @param {Array} params array of parameters that define this widget
//                       including the database id and its position on
//                       the screen
// @return none
//
function renderWidget(params) {
    var xhrArgs = {
	url: '/panoptes/dashboardWidget.php',
	handleAs: 'json',
	content: {
	    action: 'renderUserWidget',
	    data: '{ "id": "' + params.id + '" }'
	},
	load: function(data) {
	    hideLoading();
	    if (data && !data.error) {
		// fade out node, then delete it if it exists already
		node = dojo.byId('widget_box_' + params.position);

		if (node) {
		    fadeArgs = {
			node: node,
			duration: 1000
		    };
		    dojo.fadeOut(fadeArgs).play();
		    
		    var prnt = dojo.byId("dashboard_tab");
		    prnt.removeChild(node);
		}

		node = document.createElement("div");
		node.className = "dashboardWidget";
		node.id = "widget_box_" + params.position;
		
		var x_offset = (params.position % ncols) * widget_width;
		var y_offset = Math.floor(params.position / ncols) * widget_width;
		
		var xpos = dashboard_x_padding + x_offset;
		var ypos = dashboard_y_padding + y_offset;
		
		dojo.style(node, {
			left: xpos + "px",
			top: ypos + "px",
			opacity: 0	
		});
		dijit.byId('dashboard_tab').domNode.appendChild(node);

		fadeArgs = {
		    node: node,
		    duration: 1000
		};
		dojo.fadeIn(fadeArgs).play();

		if (data.data.type == 'html') {
		    node.innerHTML = data.data.value;
		} else if (data.data.type == "js") {
                    js_code = data.data.value;
		    eval(js_code);
		} else if (data.data.type == "image") {
		    graphImg = new Image(200, 200);
		    graphImg.src = '/panoptes/displayImage.php?file=' + data.data.value
		    graphImg.id = 'widget_image_' + params.position;
		    
		    node.appendChild(graphImg);
		}

		// add delete icon if in edit mode
		if (dashboard_edit_mode) {
		    var node_pos = dojo.marginBox('widget_box_' + params.position);
		    var img_x = node_pos.l + node_pos.w - 15;
		    var img_y = node_pos.t - 5;
		    
		    // create image node
		    img = new Image();
		    img.src = '/panoptes/images/delete.png';
		    img.id = 'widget_delete_icon_' + params.position;
		    img.className = 'dashboardWidgetDeleteIcon';
		    img.onclick = Function("deleteUserWidget(" + 
					   params.position + ")");
		    dojo.style(img, {
			    top: img_y + 'px',
				left: img_x + 'px'
				});
		    dijit.byId('dashboard_tab').domNode.appendChild(img);
		}		    
		
		// redraw this widget in 5 minutes
		timerId = setTimeout(renderWidget, 300000, params);
	    } else {
		alert(data.error);
	    }
	},
    };
	
    showLoading();
    dojo.xhrGet(xhrArgs);       
}

//
// addDashboardWidget - draw form elements required for a user to
//                      add a new widget to their dashboard
// @param none
// @return none
//
function addDashboardWidget() {
    // append selector box to end of dashboard
    var node = document.createElement("div");
    node.className = "newDashboardWidget";
    node.id = "new_widget_box";    

    var x_offset = (widget_counter % ncols) * widget_width;
    var y_offset = Math.floor(widget_counter / ncols) * widget_width;
		    
    var xpos = dashboard_x_padding + x_offset;
    var ypos = dashboard_y_padding + y_offset;

    dojo.style(node, {
	    left: xpos + "px",
	    top: ypos + "px",
	    opacity: 0
		});
    dijit.byId('dashboard_tab').domNode.appendChild(node);

    fadeArgs = {
	node: node,
	duration: 700
    };
    dojo.fadeIn(fadeArgs).play();

    // append widget selector
    sb = new dijit.form.FilteringSelect({
   	    id: 'new_widget_type',
    	    store: dashboardWidgetStore,
	    style: 'width: 150px;',
    	    searchAttr: 'name',
	    labelAttr: 'name',
	    onChange: function(e) {
		// get request parameters for widget
		var id = dijit.byId('new_widget_type').get('value');

		var xhrArgs = {
		    url: '/panoptes/dashboardWidget.php',
		    handleAs: 'json',
		    content: {
			action: 'getWidgetForm',
			data: '{ "widget_id": "' + id + '" }'
		    },
		    load: function(data) {
			hideLoading();
			if (data && !data.error) {
			    eval(data.data);
			} else {
			    alert(data.error);
			}
		    },
		};
	
		showLoading();
		dojo.xhrGet(xhrArgs);       

	    },
	    placeHolder: 'select a widget'
    	});

    sb.placeAt(node);

    // connect mouseover to show tooltip with description
    dojo.connect(sb, 'onMouseOver', function(e) {
	    var id = dijit.byId('new_widget_type').get('value');

	    var req = dashboardWidgetStore.fetch({ query: { id: id },
						   onComplete: function(items, req) {
			// there should only be one item
			for (var i = 0; i < items.length; i++) {
			    // show tooltip
			    var msg = dashboardWidgetStore.getValue(items[i], 'description');
			    if (msg) {
				dijit.showTooltip(msg, dijit.byId('new_widget_type').domNode);
			    }
			}
		    }});
	});

    dojo.connect(sb, 'onMouseOut', function(e) {
	    dijit.hideTooltip(dijit.byId('new_widget_type').domNode);
	});

    widget_counter++;
}
