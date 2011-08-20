var deviceTree;
var deviceStore;
var deviceTreeSelectedItem;
var groupStore;
var alertStore;
var portMonitorStore;
var perfMonitorStore;
var certificateMonitorStore;
var SNMPMonitorStore;
var shellMonitorStore;
var availableShellMonitorStore;
var urlMonitorStore;
var userStore;
var prefStore;
var templateStore;
var timers=[];
var dashboard_edit_mode=false;
var loading_count=0;
var dojoVersion;
v=dojo.version;
dojoVersion=(v.major*100)+(v.minor*10)+v.patch;
function loadUsers(){
var _1={url:"/panoptes/",handleAs:"json",content:{action:"getUser",data:"{ }"},load:function(_2){
if(_2&&!_2.error){
dojo.forEach(_2.data,function(_3){
userStore.newItem(_3);
});
userStore.save();
}else{
alert(_2.error);
}
},};
dojo.xhrGet(_1);
};
function loadGroups(){
var _4={url:"/panoptes/",handleAs:"json",content:{action:"getSecurityGroups",data:"{ }"},load:function(_5){
if(_5&&!_5.error){
if(_5.data){
dojo.forEach(_5.data,function(_6){
userStore.newItem(_6);
});
userStore.save();
}
}else{
alert(_5.error);
}
},};
dojo.xhrGet(_4);
};
function getSelectedTreeNode(_7,_8,e){
deviceTreeSelectedItem=_7;
};
function reloadDeviceTree(){
if(dijit.byId("device_tree")){
dijit.byId("device_tree").destroy();
}
var _9={url:"/panoptes/",handleAs:"json",content:{action:"getDeviceList",data:"{}"},load:function(_a){
hideLoading();
if(_a&&!_a.error){
var _b={label:"name",identifier:"id",items:_a.data};
deviceStore=new dojo.data.ItemFileWriteStore({data:_b});
var _c=new dijit.tree.ForestStoreModel({store:deviceStore,query:{"type":"group"},rootId:"root",rootLabel:"Devices",childrenAttrs:["children"]});
deviceTree=new dijit.Tree({model:_c,id:"device_tree",showRoot:false,getIconClass:function(_d,_e){
if(_d!==undefined&&_d!==null){
if(_d.type=="group"){
return (_e?"dijitFolderOpened":"dijitFolderClosed");
}
if(_d.os=="Linux"){
return ("panoptesIconOSLinux");
}else{
if(_d.os=="Windows"){
return ("panoptesIconOSWin");
}else{
return ("dijitLeaf");
}
}
}
},onClick:getSelectedTreeNode});
deviceTree.placeAt(document.getElementById("device_tree_container"));
deviceStore.fetch({query:{type:"group"},onItem:function(_f,req){
var _10=dijit.byId("device_tree_group_menu");
var _11=deviceStore.getValue(_f,"name");
if(_11!="ungrouped"){
var _12=deviceTree.getNodesByItem(deviceTree.model.getIdentity(_f));
if(_12[0]){
_10.bindDomNode(_12[0].domNode);
}
}
}});
deviceStore.fetch({query:{type:"device"},onItem:function(_13,req){
var _14=dijit.byId("device_tree_menu");
var _15=deviceStore.getValue(_13,"name");
if(_15!=""){
var _16=deviceTree.getNodesByItem(deviceTree.model.getIdentity(_13));
if(_16[0]){
_14.bindDomNode(_16[0].domNode);
}
}
}});
}else{
alert(_a.error);
}
},};
showLoading();
var _17=dojo.xhrGet(_9);
setTimeout(reloadDeviceTree,900000);
};
function createDeviceTree(){
if(!deviceTree){
var _18=dojo.xhrGet({url:"/panoptes/js/device_view.js",handleAs:"javascript",sync:true});
reloadDeviceTree();
}
if(!groupStore){
var _19={url:"/panoptes/",handleAs:"json",content:{action:"getDeviceGroups",data:"{}"},load:function(_1a){
if(_1a&&!_1a.error){
var _1b={label:"name",identifier:"id",items:_1a.data};
groupStore=new dojo.data.ItemFileWriteStore({data:_1b});
}else{
alert(_1a.error);
}
},};
dojo.xhrGet(_19);
}
};
function loadAvailableShellScripts(){
var _1c={url:"/panoptes/",handleAs:"json",content:{action:"getShellMonitors",data:"{ }"},load:function(_1d){
if(_1d&&!_1d.error){
all_shell_data={label:"all_shell_data",identifier:"script",items:_1d.data};
availableShellMonitorStore=new dojo.data.ItemFileWriteStore({data:all_shell_data});
}else{
alert(_1d.error);
}
},};
dojo.xhrGet(_1c);
};
dojo.addOnLoad(function(){
loadAvailableShellScripts();
all_user_data={label:"name",identifier:"id",items:[]};
userStore=new dojo.data.ItemFileWriteStore({data:all_user_data});
pref_data={label:"pref_name",identifier:"id",items:[]};
prefStore=new dojo.data.ItemFileWriteStore({data:pref_data});
loadUsers();
loadUserPrefs();
loadGroups();
createDeviceTree();
loadDashboard();
});

