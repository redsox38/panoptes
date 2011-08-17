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

var discoveryGrid;
var discoveryStore;

//
// createAutoDiscoveryGrid - called to populate the discovered device 
//                           management tab when the tab is opened
// @param none
// @return none
//
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

//
// monitorEntry - adds a monitor on the server for the selected auto
//                discovery entry
// @param {String} type - One of src/dst, indicating side of connection to
//                        monitor.  It's always dst though. 
// @return none
//
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

//
// ignoreEntry - ignore the selected autoDiscovery entry  in the database
// @param none
// @return none
//
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

