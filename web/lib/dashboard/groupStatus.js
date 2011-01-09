// add device group selector

grp_sel = new dijit.form.FilteringSelect({
	id: 'new_widget_grp',
	name: 'new_widget_grp',
	store: deviceStore,
	query: { type: 'group' },
	style: 'width: 120px;',
	searchAttr: 'id',
	labelAttr: 'name',
	labelFunc: function(itm, str) {
	    var label = str.getValue(itm, 'name');
	    return label;
	},
	placeHolder: 'Select a device group'	
    });
grp_sel.placeAt(node);

