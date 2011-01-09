
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
	    style: 'width: 125px;',
    	    searchAttr: 'name',
	    labelAttr: 'name',
	    onChange: function(e) {
		alert(dijit.byId('new_widget_type').get('value'));
	    },
	    placeHolder: 'select a widget'
    	});

    sb.placeAt(node);

}
