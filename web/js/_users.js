var userFormbuilt=false;
function xhrUpdateSecurityGroups(_1,_2,_3){
if(_1=="add"){
op="Add";
func="addSecurityGroupMember";
}else{
op="Delete";
func="deleteSecurityGroupMember";
}
var _4={url:"/panoptes/",handleAs:"json",content:{action:func,data:"{ \"user_id\": \""+_2.get("value").replace("u_","")+"\", \"group_id\": \""+_3.get("value").replace("g_","")+"\" }"},load:function(_5){
if(_5&&!_5.error){
_2.set("displayedValue","");
_2.set("placeHolder",op+" Successful");
_3.set("displayedValue","");
_3.set("placeHolder",op+" Successful");
}else{
alert(_5.error);
}
},};
dojo.xhrGet(_4);
};
function xhrAddUser(_6){
var _7={url:"/panoptes/",handleAs:"json",content:{action:"addUser",data:"{ \"name\": \""+_6.get("displayedValue")+"\" }"},load:function(_8){
if(_8&&!_8.error){
userStore.newItem(_8.data);
userStore.save();
_6.set("displayedValue","");
_6.set("placeHolder","Add Successful");
}else{
alert(_8.error);
}
},};
dojo.xhrGet(_7);
};
function xhrDeleteUser(_9){
var _a={url:"/panoptes/",handleAs:"json",content:{action:"deleteUser",data:"{ \"id\": \""+_9.get("value").replace("u_","")+"\" }"},load:function(_b){
if(_b&&!_b.error){
var _c=userStore.fetch({query:{id:_9.get("value")},onComplete:function(_d,_e){
for(var i=0;i<_d.length;i++){
userStore.deleteItem(_d[i]);
}
userStore.save();
_9.set("displayedValue","");
_9.set("placeHolder","Delete Successful");
}});
}else{
alert(_b.error);
}
},};
dojo.xhrGet(_a);
};
function buildUserForm(){
if(userFormbuilt){
return;
}
userFormbuilt=true;
user_tab=dijit.byId("user_mgmt_tab");
add_tb=new dijit.form.TextBox({id:"add_user",name:"add_user",style:"width: 15em;",placeHolder:"username to add"});
add_tb.placeAt(user_tab.domNode);
add_sub=new dijit.form.Button({label:"Add",onClick:function(){
xhrAddUser(dijit.byId("add_user"));
}});
add_sub.placeAt(user_tab.domNode);
del_tb=new dijit.form.FilteringSelect({id:"del_user",name:"del_user",style:"width: 15em;",store:userStore,query:{type:"user"},searchAttr:"id",labelFunc:function(_f,str){
var _10=str.getValue(_f,"name");
return _10;
},placeHolder:"username to delete"});
del_tb.placeAt(user_tab.domNode);
del_sub=new dijit.form.Button({label:"Delete",onClick:function(){
xhrDeleteUser(dijit.byId("del_user"));
}});
del_sub.placeAt(user_tab.domNode);
user_tab.domNode.appendChild(document.createElement("br"));
user_tab.domNode.appendChild(document.createTextNode("Add User to Group"));
user_tab.domNode.appendChild(document.createElement("br"));
add_src_tb=new dijit.form.FilteringSelect({id:"add_user_to_group_src",name:"add_user_to_group_src",style:"width: 15em;",store:userStore,query:{type:"user"},searchAttr:"id",labelFunc:function(itm,str){
var _11=str.getValue(itm,"name");
return _11;
},placeHolder:"username to add"});
add_src_tb.placeAt(user_tab.domNode);
add_tgt_tb=new dijit.form.FilteringSelect({id:"add_user_to_group_tgt",name:"add_user_to_group_tgt",style:"width: 15em;",store:userStore,query:{type:"group"},searchAttr:"id",labelFunc:function(itm,str){
var _12=str.getValue(itm,"name");
return _12;
},placeHolder:"group to add to"});
add_tgt_tb.placeAt(user_tab.domNode);
sub=new dijit.form.Button({label:"Add User to Group",onClick:function(){
xhrUpdateSecurityGroups("add",dijit.byId("add_user_to_group_src"),dijit.byId("add_user_to_group_tgt"));
}});
sub.placeAt(user_tab.domNode);
user_tab.domNode.appendChild(document.createElement("br"));
user_tab.domNode.appendChild(document.createTextNode("Remove User from Group"));
user_tab.domNode.appendChild(document.createElement("br"));
del_src_tb=new dijit.form.FilteringSelect({id:"del_user_from_group_src",name:"del_user_from_group_src",style:"width: 15em;",store:userStore,query:{type:"user"},searchAttr:"id",labelFunc:function(itm,str){
var _13=str.getValue(itm,"name");
return _13;
},placeHolder:"username to delete"});
del_src_tb.placeAt(user_tab.domNode);
del_tgt_tb=new dijit.form.FilteringSelect({id:"del_user_from_group_tgt",name:"del_user_from_group_tgt",style:"width: 15em;",store:userStore,query:{type:"group"},searchAttr:"id",labelFunc:function(itm,str){
var _14=str.getValue(itm,"name");
return _14;
},placeHolder:"group to remove from"});
del_tgt_tb.placeAt(user_tab.domNode);
sub=new dijit.form.Button({label:"Remove User from Group",onClick:function(){
xhrUpdateSecurityGroups("delete",dijit.byId("del_user_from_group_src"),dijit.byId("del_user_from_group_tgt"));
}});
sub.placeAt(user_tab.domNode);
user_tab.domNode.appendChild(document.createElement("br"));
};

