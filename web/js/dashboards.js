var widget_width = 150;
var dashboard_tab_info = dojo.position(dijit.byId("dashboard_tab").domNode, true);
var ncols = Math.floor(dashboard_tab_info.x / widget_width);

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
		    node.id = "widget_box_" + widget_counter;

		    var y_offset = (params.position % ncols) * widget_width;
		    var x_offset = Math.floor(params.position / ncols) * widget_width;
		    
		    var xpos = dashboard_tab_info.x + x_offset;
		    var ypos = dashboard_tab_info.y + y_offset;

		    alert(dashboard_tab_info.x + " " + dashboard_tab_info.y + " " + params.position + " " + x_offset + " " + y_offset);

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
    dojo.place(node, "dashboard_tab", "last");

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
