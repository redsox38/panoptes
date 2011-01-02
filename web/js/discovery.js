var discoveryGrid;
var discoveryStore;

function createAutoDiscoveryGrid(){
    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'populateAutoDiscoveryForm',
	    data: '{ }'
	},
	load: function(data) {
	    hideLoading();
	    if (data && !data.error) {
		var auto_discovery_data = {
		    label: "dstaddr",
		    identifier: "id",
		    items: data.data
		};
		
		var layout = [{
			field: 'dstaddr',
			name: 'Destination Address',
			width: '200px'
		    }, {   
			field: 'proto', 
			name: 'Protocol',
			width: '100px'
		    }, {            
			field: 'dport', 
			name: 'Destination Port',
			width: 'auto'
		    }];

		discoveryStore = new dojo.data.ItemFileWriteStore({
			data: auto_discovery_data
		    });
		discoveryGrid = new dojox.grid.EnhancedGrid({
			store: discoveryStore,
			structure: layout,
			clientSort: true,
			rowSelector: '20px',
			selectionMode: 'multiple',
			closable: true,
			plugins: {
			    nestedSorting: true,
			    menus: { rowMenu: 'autoDiscoveryRowMenu' }
			}
		    }, document.createElement('div'));		    
		dojo.byId('auto_discovery_tab').appendChild(discoveryGrid.domNode);
		discoveryGrid.startup();		    
	    }
	},
    };
	
    showLoading();
    var resp = dojo.xhrGet(xhrArgs);
}

function monitorEntry(type) {
    var ids = [];
    // get row ids
    var items = discoveryGrid.selection.getSelected();
    discoveryGrid.selection.clear();
    
    if (items.length) {
	dojo.forEach(items, function(selectedItem) {
		if (selectedItem !== null) {
		    var id = discoveryGrid.store.getValues(selectedItem, 'id');
		    ids.push(id);
		    discoveryGrid.store.deleteItem(selectedItem);
		}
	    });
	discoveryGrid.store.save();
    }

    var xhrArgs = {
	url: '/panoptes/',
	handleAs: 'json',
	content: {
	    action: 'monitorAutoDiscoveryEntry',
	    data: '{ "id" : [' + ids + '], "type" :"' + type + '" }'
	},
	load: function(data) {
	    if (data && data.error) {
		alert(data.error);
	    }
	},
    };
    
    var resp = dojo.xhrGet(xhrArgs);
}

function ignoreEntry() {
    var ids = [];
    // get row ids
    var items = discoveryGrid.selection.getSelected();
    discoveryGrid.selection.clear();

   if (items.length) {
	dojo.forEach(items, function(selectedItem) {
		if (selectedItem !== null) {
		    var id = discoveryGrid.store.getValues(selectedItem, 'id');
		    ids.push(id);
		    discoveryGrid.store.deleteItem(selectedItem);
		}
	    });
	discoveryGrid.store.save();
   }

   var xhrArgs = {
       url: '/panoptes/',
       handleAs: 'json',
       content: {
	   action: 'ignoreAutoDiscoveryEntry',
	   data: '{ "id" : [' + ids + '] }'
       },
       load: function(data) {
	   if (data && data.error) {
	       alert(data.error);
	   }
       },
   };
    
   var deferred = dojo.xhrGet(xhrArgs);
}

