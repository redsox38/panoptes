var userFormbuilt = false;

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
	    serchAttr: 'id',
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

    user_tab.domNode.appendChild(document.createElement("br"));
}

