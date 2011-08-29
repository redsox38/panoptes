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

var userFormbuilt = false;

// 
// xhrUpdateSecurityGroups - function for managing access groups
// @param {String} type - operation to perform.  Either add or delete
// @param {String} src - id of user from userStore to add/remove
// @param {String} tgt - id of device group from deviceStore to 
//                       add/remove user from/to
// @return none
//
function xhrUpdateSecurityGroups(type, src, tgt) {

    if (type == 'add') {
	op = 'Add';
	func = 'addSecurityGroupMember';
    } else {
	op = 'Delete';
	func = 'deleteSecurityGroupMember';
    }
    var xhrArgs = {
        url: '/panoptes/',
        handleAs: 'json',
        content: {
            action: func,
            data: '{ "user_id": "' + src.get('value').replace("u_", "") + '", "group_id": "' +
	           tgt.get('value').replace("g_", "") + '" }'
        },
        load: function(data) {
            if (data && !data.error) {
		// make a child of group in data store

		// update display
		src.set('displayedValue', '');
		src.set('placeHolder', op + ' Successful');		
		tgt.set('displayedValue', '');
		tgt.set('placeHolder', op + ' Successful');		
            } else {
                alert(data.error);
            }
        },
    };
        
    dojo.xhrGet(xhrArgs);    
}

//
// xhrAddUser - add a userid on server
// @param {Object} name - dijit for the input field for the user name to add
// @return none
//
function xhrAddUser(name) {
    var xhrArgs = {
        url: '/panoptes/',
        handleAs: 'json',
        content: {
            action: 'addUser',
            data: '{ "name": "' + name.get('displayedValue') + '" }'
        },
        load: function(data) {
            if (data && !data.error) {
		// add to store
		userStore.newItem(data.data);
		userStore.save();

		// update display
		name.set('displayedValue', '');
		name.set('placeHolder', 'Add Successful');		
            } else {
                alert(data.error);
            }
        },
    };
        
    dojo.xhrGet(xhrArgs);    
}

//
// xhrDeleteUser - remove a userid on server
// @param {Object} name - dijit for the input field for the user name to remove
// @return none
//
function xhrDeleteUser(name) {
    var xhrArgs = {
        url: '/panoptes/',
        handleAs: 'json',
        content: {
            action: 'deleteUser',
            data: '{ "id": "' + name.get('value').replace("u_", "") + '" }'
        },
        load: function(data) {
            if (data && !data.error) {
		// delete item from store
		var req = userStore.fetch({ query: { id: name.get('value') },
					    onComplete: function(items, req) {
			    for (var i = 0; i < items.length; i++) {
				userStore.deleteItem(items[i]);
			    }
			    userStore.save();
			    // update display
			    name.set('displayedValue', '');
			    name.set('placeHolder', 'Delete Successful');
			}});
            } else {
                alert(data.error);
            }
        },
    };
        
    dojo.xhrGet(xhrArgs);    
}

//
// buildUserForm - called to generate the user management tab content when 
//                 the tab is opened for the first time.
// @param none
// @return none
//
function buildUserForm() {
    if (userFormbuilt) {
	return;
    }

    userFormbuilt = true;

    user_tab = dijit.byId('user_mgmt_tab');

    add_tb = new dijit.form.TextBox({
	    id: 'add_user',
	    name: 'add_user',
	    style: 'width: 15em;',
	    placeHolder: 'username to add'
	});
    add_tb.placeAt(user_tab.domNode);

    add_sub = new dijit.form.Button({
	    label: 'Add',
	    onClick: function() {
		xhrAddUser(dijit.byId('add_user'));
	    }
	});
    add_sub.placeAt(user_tab.domNode);

    del_tb = new dijit.form.FilteringSelect({
	    id: 'del_user',
	    name: 'del_user',
	    style: 'width: 15em;',
	    store: userStore,
	    query: { type: 'user' },
	    searchAttr: 'id',
	    labelFunc: function(itm, str) {
		var label = str.getValue(itm, 'name');
		return label;
	    },
	    placeHolder: 'username to delete'
	});
    del_tb.placeAt(user_tab.domNode);

    del_sub = new dijit.form.Button({
	    label: 'Delete',
	    onClick: function() {
		xhrDeleteUser(dijit.byId('del_user'));
	    }
	});
    del_sub.placeAt(user_tab.domNode);

    dojo.create("br", null, user_tab.domNode, "last");
    user_tab.domNode.appendChild(document.createTextNode("Add User to Group"));
    dojo.create("br", null, user_tab.domNode, "last");

    // put up selects for group/user add
    add_src_tb = new dijit.form.FilteringSelect({
	    id: 'add_user_to_group_src',
	    name: 'add_user_to_group_src',
	    style: 'width: 15em;',
	    store: userStore,
	    query: { type: 'user' },
	    searchAttr: 'id',
	    labelFunc: function(itm, str) {
		var label = str.getValue(itm, 'name');
		return label;
	    },
	    placeHolder: 'username to add'
	});
    add_src_tb.placeAt(user_tab.domNode);    

    add_tgt_tb = new dijit.form.FilteringSelect({
	    id: 'add_user_to_group_tgt',
	    name: 'add_user_to_group_tgt',
	    style: 'width: 15em;',
	    store: userStore,
	    query: { type: 'group' },
	    searchAttr: 'id',
	    labelFunc: function(itm, str) {
		var label = str.getValue(itm, 'name');
		return label;
	    },
	    placeHolder: 'group to add to'
	});
    add_tgt_tb.placeAt(user_tab.domNode);    
        
    sub = new dijit.form.Button({
	    label: 'Add User to Group',
	    onClick: function() {
		xhrUpdateSecurityGroups('add', dijit.byId('add_user_to_group_src'),
					dijit.byId('add_user_to_group_tgt'));
	    }
	});

    sub.placeAt(user_tab.domNode);

    dojo.create("br", null, user_tab.domNode, "last");
    user_tab.domNode.appendChild(document.createTextNode("Remove User from Group"));
    dojo.create("br", null, user_tab.domNode, "last");

    // put up selects for group/user add
   del_src_tb = new dijit.form.FilteringSelect({
	    id: 'del_user_from_group_src',
	    name: 'del_user_from_group_src',
	    style: 'width: 15em;',
	    store: userStore,
	    query: { type: 'user' },
	    searchAttr: 'id',
	    labelFunc: function(itm, str) {
		var label = str.getValue(itm, 'name');
		return label;
	    },
	    placeHolder: 'username to delete'
	});
    del_src_tb.placeAt(user_tab.domNode);    

    del_tgt_tb = new dijit.form.FilteringSelect({
	    id: 'del_user_from_group_tgt',
	    name: 'del_user_from_group_tgt',
	    style: 'width: 15em;',
	    store: userStore,
	    query: { type: 'group' },
	    searchAttr: 'id',
	    labelFunc: function(itm, str) {
		var label = str.getValue(itm, 'name');
		return label;
	    },
	    placeHolder: 'group to remove from'
	});
    del_tgt_tb.placeAt(user_tab.domNode);    
        
    sub = new dijit.form.Button({
	    label: 'Remove User from Group',
	    onClick: function() {
		xhrUpdateSecurityGroups('delete', dijit.byId('del_user_from_group_src'),
					dijit.byId('del_user_from_group_tgt'));
	    }
	});

    sub.placeAt(user_tab.domNode);

    dojo.create("br", null, user_tab.domNode, "last");
}

