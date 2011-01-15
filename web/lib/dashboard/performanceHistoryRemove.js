var node = dijit.byId('new_widget_device');
if (node) {
    node.destroy();
}
node = dijit.byId('new_widget_metric');
if (node) {
    node.destroy();
}

node = dojo.byId('new_widget_box');
for (i = 0; i < perf_hist_add_counter; i++) {
    node.removeChild('perf_hist_input_' + i);
}
