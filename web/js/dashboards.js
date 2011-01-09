
function addDashboardWidget() {
    // append selector box to end of dashboard
    var node = document.createElement("div");
    node.className = "newWidget";
    node.id = "new_widget_box";    
    dojo.place(node, "dashboard_tab", "last");

    // append widget selector
    sb = new dijit.form.FilteringSelect({
   	    id: 'new_widget_type',
   	    name: 'new_widget_type',
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
}
