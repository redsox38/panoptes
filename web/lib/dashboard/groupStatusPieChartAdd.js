// add device group selector

grp_pie_sel = new dijit.form.FilteringSelect({
	id: 'new_widget_pie_grp',
	store: deviceStore,
	query: { type: 'group' },
	style: 'width: 150px;',
	searchAttr: 'id',
	labelAttr: 'name',
	labelFunc: function(itm, str) {
	    var label = str.getValue(itm, 'name');
	    return label;
	},
	placeHolder: 'Select a device group'	
    });
grp_pie_sel.placeAt(node);

