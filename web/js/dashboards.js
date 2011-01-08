
function addDashboardWidget() {
    // append selector box to end of dashboard
    var node = document.createElement("div");
    node.innerHTML = "foo";
    node.className = "newWidget";
    node.id = "new_widget_box";
    
    dojo.place(node, "dashboard_tab", "last");
}
