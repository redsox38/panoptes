var widget_width = 156; // width + (border width + margin + padding / 2)
var dashboard_x_padding = 5;
var dashboard_y_padding = 55;
var dashboard_tab_info = dojo.position(dijit.byId("dashboard_tab").domNode, true);
var ncols = Math.floor((dashboard_tab_info.w - dashboard_tab_info.x - dashboard_x_padding) / widget_width);

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
		if (data.data.type == 'html') {
		    var node = document.createElement("div");
		    node.innerHTML = data.data.value;
		    node.className = "dashboardWidget";
		    node.id = "widget_box_" + params.position;

		    var x_offset = (params.position % ncols) * widget_width;
		    var y_offset = Math.floor(params.position / ncols) * widget_width;
		    
		    var xpos = dashboard_x_padding + x_offset;
		    var ypos = dashboard_y_padding + y_offset;

		    dojo.style(node, {
			    left: xpos + "px",
			    top: ypos + "px"
			});
		    dijit.byId('dashboard_tab').domNode.appendChild(node);
		}
	    } else {
		alert(data.error);
	    }
	},
    };
	
    showLoading();
    dojo.xhrGet(xhrArgs);       
}

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
	    top: ypos + "px"
		});
    dijit.byId('dashboard_tab').domNode.appendChild(node);

    // append widget selector
    sb = new dijit.form.FilteringSelect({
   	    id: 'new_widget_type',
    	    store: dashboardWidgetStore,
	    style: 'width: 120px;',
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
    widget_counter++;
}
