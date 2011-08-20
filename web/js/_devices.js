function applyDeviceTemplate(){
template_data={label:"name",identifier:"id",items:[]};
templateStore=new dojo.data.ItemFileWriteStore({data:template_data});
var ts=new dijit.form.FilteringSelect({id:"template_selector",name:"template_selector",store:templateStore,title:"template",searchAttr:"name",labelFunc:function(_1,_2){
var _3=_2.getValue(_1,"name");
return _3;
},labelAttr:"name"});
lbl=document.createElement("label");
lbl.htmlFor="template_selector";
rst=new dijit.form.Button({label:"Cancel",id:"apply_template_reset",onClick:function(){
destroyAll("apply_template_win");
}});
sub=new dijit.form.Button({label:"Apply",id:"apply_template_submit",onClick:function(){
var _4=deviceStore.getValues(deviceTreeSelectedItem,"id").toString();
_4=_4.replace("d_","");
var _5=dijit.byId("template_selector").get("value");
var _6=dijit.byId("template_selector").get("displayedValue");
xhrApplyDeviceTemplate(_4,_5,_6);
destroyAll("apply_template_win");
}});
var _7=[lbl,ts.domNode,document.createElement("br"),rst.domNode,sub.domNode];
createOverlayWindow("apply_template_win",_7);
var _8={url:"/panoptes/",handleAs:"json",content:{action:"getDeviceTemplates",data:"{}"},load:function(_9){
if(_9&&!_9.error){
if(_9.data&&(_9.data.length>0)){
dojo.forEach(_9.data,function(_a){
templateStore.newItem(_a);
});
templateStore.save();
}
}else{
alert(_9.error);
}
hideLoading();
},};
showLoading();
var _b=dojo.xhrGet(_8);
};
function xhrApplyDeviceTemplate(_c,_d,_e){
var _f={url:"/panoptes/",handleAs:"json",content:{action:"applyDeviceTemplate",data:"{ \"device_id\": \""+_c+"\", \"template_id\": \""+_d+"\" }"},load:function(_10){
if(_10&&!_10.error){
alert("Template "+_e+" has been applied.");
}else{
alert(_10.error);
}
},};
dojo.xhrGet(_f);
};
function xhrAddNotification(_11,_12,_13){
var _14={};
if(!_11){
_14.device_id=_11;
}else{
_14.type=_13;
_14.monitor_ids=_12;
}
var _15={url:"/panoptes/",handleAs:"json",content:{action:"AddNotification",data:dojo.toJson(_14)},load:function(_16){
if(_16&&!_16.error){
alert("Your notification(s) have been added");
}else{
alert(_16.error);
}
},};
dojo.xhrGet(_15);
};
function xhrRemoveNotification(_17,_18,_19){
var _1a={};
if(!_17){
_1a.device_id=_17;
}else{
_1a.type=_19;
_1a.monitor_ids=_18;
}
var _1b={url:"/panoptes/",handleAs:"json",content:{action:"RemoveNotification",data:dojo.toJson(_1a)},load:function(_1c){
if(_1c&&!_1c.error){
alert("Your notification(s) have been removed");
}else{
alert(_1c.error);
}
},};
dojo.xhrGet(_1b);
};
function addDeviceNotification(){
var id=deviceStore.getValues(deviceTreeSelectedItem,"id").toString();
xhrAddNotification(id,null,null);
};
function removeDeviceNotification(){
var id=deviceStore.getValues(deviceTreeSelectedItem,"id").toString();
xhrRemoveNotification(id,null,null);
};
function xhrUpdatePermissions(_1d,src,tgt,_1e){
src=src.replace("g_","");
tgt=tgt.replace("g_","");
var _1f={url:"/panoptes/",handleAs:"json",content:{action:"updatePermission",data:"{ \"type\": \""+_1d+"\", \"security_group\": \""+src+"\", \"device_group\": \""+tgt+"\", \"access\": \""+_1e+"\" }"},load:function(_20){
hideLoading();
if(_20&&_20.error){
alert(_20.error);
}
},};
showLoading();
dojo.xhrGet(_1f);
};
function manageDeviceGroupAccess(){
var id=deviceStore.getValues(deviceTreeSelectedItem,"id").toString();
var _21=deviceStore.getValues(deviceTreeSelectedItem,"name").toString();
typeStore=new dojo.data.ItemFileReadStore({data:{identifier:"type",label:"display",items:[{type:"grant",display:"Grant"},{type:"revoke",display:"Revoke"},]}});
type=new dijit.form.FilteringSelect({id:"security_group_type",name:"security_group_type",style:"width: 7em;",store:typeStore,title:"Type",searchAttr:"display",placeHolder:"Operation"});
src=new dijit.form.FilteringSelect({id:"security_group_src",name:"security_group_src",style:"width: 12em;",store:userStore,query:{type:"group"},searchAttr:"id",placeHolder:"group to grant access"});
opStore=new dojo.data.ItemFileReadStore({data:{identifier:"level",label:"display",items:[{level:"read",display:"read access"},{level:"write",display:"write access"},]}});
op=new dijit.form.FilteringSelect({id:"security_group_op",name:"security_group_op",style:"width: 9em;",store:opStore,title:"Op",searchAttr:"display",placeHolder:"Access Type"});
lbl=document.createElement("label");
lbl.htmlFor="security_group_tgt";
lbl.appendChild(document.createTextNode(" access to "));
tgt=new dijit.form.FilteringSelect({id:"security_group_tgt",name:"security_group_tgt",style:"width: 15em;",store:deviceStore,query:{type:"group",name:new RegExp("/((?!ungrouped).)/")},searchAttr:"id",value:id});
rst=new dijit.form.Button({label:"Cancel",id:"security_group_reset",onClick:function(){
dijit.byId("security_group_type").destroy();
dijit.byId("security_group_src").destroy();
dijit.byId("security_group_op").destroy();
dijit.byId("security_group_tgt").destroy();
dijit.byId("security_group_reset").destroy();
dijit.byId("security_group_submit").destroy();
win=document.getElementById("manage_device_win");
while(win.hasChildNodes()>=1){
win.removeChild(win.firstChild);
}
document.body.removeChild(win);
}});
sub=new dijit.form.Button({label:"Update",id:"security_group_submit",onClick:function(){
xhrUpdatePermissions(dijit.byId("security_group_type").get("value"),dijit.byId("security_group_src").get("value"),dijit.byId("security_group_tgt").get("value"),"write");
dijit.byId("security_group_type").destroy();
dijit.byId("security_group_src").destroy();
dijit.byId("security_group_op").destroy();
dijit.byId("security_group_tgt").destroy();
dijit.byId("security_group_reset").destroy();
dijit.byId("security_group_submit").destroy();
win=document.getElementById("manage_device_win");
while(win.hasChildNodes()>=1){
win.removeChild(win.firstChild);
}
document.body.removeChild(win);
}});
var _22=[type.domNode,src.domNode,lbl,tgt.domNode,document.createElement("br"),rst.domNode,sub.domNode];
createOverlayWindow("manage_device_win",_22);
};
function deleteDeviceGroup(){
var id=deviceStore.getValues(deviceTreeSelectedItem,"id").toString();
var _23=deviceStore.getValues(deviceTreeSelectedItem,"name").toString();
id=id.replace("g_","");
var r=confirm("Are you sure you want to delete "+_23);
if(r){
var _24={url:"/panoptes/",handleAs:"json",content:{action:"deleteDeviceGroup",data:"{ \"id\": \""+id+"\" }"},load:function(_25){
hideLoading();
if(_25&&!_25.error){
var _26=[];
var req=deviceStore.fetch({query:{id:"g_"+id},onComplete:function(_27,req){
for(var i=0;i<_27.length;i++){
var _28=deviceStore.getValues(_27[i],"children");
_26=_26.concat(_28);
deviceStore.deleteItem(_27[i]);
}
deviceStore.save();
}});
for(a=0;a<_26.length;a++){
var _29=deviceStore.getValue(_26[a],"id");
var _2a=deviceStore.fetch({query:{id:_29,type:"device"},onComplete:function(_2b,_2c){
if(_2b&&(_2b.length<2)){
var _2d=deviceStore.fetch({query:{name:"ungrouped",type:"group"},onComplete:function(_2e,_2f){
if(_2e&&_2e.length){
var _30=deviceStore.getValues(_2e[0],"children");
if(_30&&_30.length){
_30.push(_2b[0]);
}else{
_30=[_2b[0]];
}
deviceStore.setValues(_2e[0],"children",_30);
}
}});
}
}});
}
var req=groupStore.fetch({query:{id:id},onComplete:function(_31,req){
for(var i=0;i<_31.length;i++){
groupStore.deleteItem(_31[i]);
}
groupStore.save();
}});
}else{
alert(_25.error);
}
},};
showLoading();
dojo.xhrGet(_24);
}
};
function xhrScheduleOutage(_32){
start_date=dijit.byId("outage_start_date").attr("displayedValue");
stop_date=dijit.byId("outage_stop_date").attr("displayedValue");
start_time=dijit.byId("outage_start_time").attr("displayedValue");
stop_time=dijit.byId("outage_stop_time").attr("displayedValue");
var _33={url:"/panoptes/",handleAs:"json",content:{action:"scheduleDeviceOutage",data:"{ \"id\": \""+_32+"\", \"start_date\": \""+start_date+"\", \"start_time\": \""+start_time+"\", \"stop_date\": \""+stop_date+"\", \"stop_time\": \""+stop_time+"\" }"},load:function(_34){
hideLoading();
if(_34&&_34.error){
alert(_34.error);
}
},};
showLoading();
dojo.xhrGet(_33);
};
function xhrGroupAdd(_35,_36){
grp=dijit.byId(_35).attr("value");
var _37={url:"/panoptes/",handleAs:"json",content:{action:"addGroupMember",data:"{ \"id\": \""+_36+"\", \"name\": \""+grp+"\" }"},load:function(_38){
hideLoading();
if(_38&&!_38.error){
req=deviceStore.fetch({query:{name:grp,type:"group"},onComplete:function(_39,req){
if(_39.length==0){
itm={type:"group",name:grp,id:"g_"+_38.data["id"],children:[],};
grpItem=deviceStore.newItem(itm);
deviceStore.save();
var _3a=dijit.byId("device_tree_group_menu");
var _3b=deviceTree.getNodesByItem(deviceTree.model.getIdentity(grpItem));
for(i=0;i<_3b.length;i++){
_3a.bindDomNode(_3b[i].domNode);
}
}else{
grpItem=_39[0];
}
req2=deviceStore.fetch({query:{id:"d_"+_36,type:"device"},onComplete:function(_3c,_3d){
if(_3c&&_3c.length){
var _3e=deviceStore.getValues(grpItem,"children");
if(_3e&&_3e.length){
_3e.push(_3c[0]);
}else{
_3e=[_3c[0]];
}
deviceStore.setValues(grpItem,"children",_3e);
deviceStore.save();
var _3f=dijit.byId("device_tree_menu");
var _40=deviceTree.getNodesByItem(deviceTree.model.getIdentity(_3c[0]));
for(i=0;i<_40.length;i++){
_3f.bindDomNode(_40[i].domNode);
}
}
}});
}});
req=deviceStore.fetch({query:{name:"ungrouped",type:"group"},onComplete:function(_41,req){
if(_41&&_41.length){
var _42=deviceStore.getValues(_41[0],"children");
for(i=0;i<_42.length;i++){
this_device_id=deviceStore.getValues(_42[i],"id");
if(this_device_id==("d_"+_36)){
_42.splice(i,1);
}
}
deviceStore.setValues(_41[0],"children",_42);
deviceStore.save();
}
}});
deviceStore.save();
if(_38.data&&_38.data.id){
groupStore.newItem(_38.data);
}
}else{
alert(_38.error);
}
},};
showLoading();
dojo.xhrGet(_37);
dijit.byId(_35).destroy();
document.body.removeChild(document.getElementById("add_to_device_group_win"));
};
function deleteDevice(){
var id=deviceStore.getValues(deviceTreeSelectedItem,"id").toString();
id=id.replace("d_","");
var _43=deviceStore.getValues(deviceTreeSelectedItem,"name");
if(confirm("All historical data will be lost.\nReally delete "+_43+"?")){
var _44={url:"/panoptes/",handleAs:"json",content:{action:"deleteDevice",data:"{ \"id\": \""+id+"\" }"},load:function(_45){
hideLoading();
if(_45&&!_45.error){
var req=deviceStore.fetch({query:{id:"d_"+id},onComplete:function(_46,req){
for(var i=0;i<_46.length;i++){
deviceStore.deleteItem(_46[i]);
}
deviceStore.save();
}});
}else{
alert(_45.error);
}
},};
showLoading();
dojo.xhrGet(_44);
}
};
function scheduleOutage(){
var id=deviceStore.getValues(deviceTreeSelectedItem,"id").toString();
id=id.replace("d_","");
start_label=document.createElement("label");
start_label.htmlFor="outage_start_date";
start_label.appendChild(document.createTextNode("Outage Start"));
start_date=new dijit.form.DateTextBox({id:"outage_start_date",name:"outage_start_date",closable:true,title:"Start Date",constraints:{datePattern:"MM/dd/yyyy"}});
start_time=new dijit.form.TimeTextBox({name:"outage_start_time",id:"outage_start_time",value:new Date(),constraints:{timePattern:"HH:mm",clickableIncrement:"T00:15:00",visibleIncrement:"T00:15:00",visibleRange:"T01:00:00"}});
stop_label=document.createElement("label");
stop_label.htmlFor="outage_stop_date";
stop_label.appendChild(document.createTextNode("Outage Stop"));
stop_date=new dijit.form.DateTextBox({id:"outage_stop_date",name:"outage_stop_date",closable:true,title:"Stop Date",constraints:{datePattern:"MM/dd/yyyy"}});
stop_time=new dijit.form.TimeTextBox({name:"outage_stop_time",id:"outage_stop_time",value:new Date(),constraints:{timePattern:"HH:mm",clickableIncrement:"T00:15:00",visibleIncrement:"T00:15:00",visibleRange:"T01:00:00"}});
rst=new dijit.form.Button({label:"Cancel",id:"schedule_outage_reset",onClick:function(){
dijit.byId("outage_start_date").destroy();
dijit.byId("outage_stop_date").destroy();
dijit.byId("schedule_outage_reset").destroy();
dijit.byId("schedule_outage_submit").destroy();
dijit.byId("outage_start_time").destroy();
dijit.byId("outage_stop_time").destroy();
win=document.getElementById("schedule_outage_win");
while(win.hasChildNodes()>=1){
win.removeChild(win.firstChild);
}
document.body.removeChild(win);
}});
sub=new dijit.form.Button({label:"Add",id:"schedule_outage_submit",onClick:function(){
xhrScheduleOutage(id);
dijit.byId("outage_start_date").destroy();
dijit.byId("outage_stop_date").destroy();
dijit.byId("outage_start_time").destroy();
dijit.byId("outage_stop_time").destroy();
dijit.byId("schedule_outage_reset").destroy();
dijit.byId("schedule_outage_submit").destroy();
win=document.getElementById("schedule_outage_win");
while(win.hasChildNodes()>=1){
win.removeChild(win.firstChild);
}
document.body.removeChild(win);
}});
var _47=[start_label,start_date.domNode,start_time.domNode,document.createElement("br"),stop_label,stop_date.domNode,stop_time.domNode,document.createElement("br"),rst.domNode,sub.domNode];
createOverlayWindow("schedule_outage_win",_47);
};
function xhrRemoveGroupMember(_48,_49){
var _4a={url:"/panoptes/",handleAs:"json",content:{action:"removeGroupMember",data:"{ \"group_id\": \""+_48+"\", \"device_id\": \""+_49+"\" }"},load:function(_4b){
hideLoading();
if(_4b&&!_4b.error){
var _4c=[];
var req=deviceStore.fetch({query:{id:"g_"+_48},onComplete:function(_4d,req){
if(_4d&&_4d.length){
var _4e=deviceStore.getValues(_4d[0],"children");
for(i=0;i<_4e.length;i++){
this_device_id=deviceStore.getValues(_4e[i],"id");
if(this_device_id==("d_"+_49)){
_4c.push(_4e[i]);
_4e.splice(i,1);
}
}
deviceStore.setValues(_4d[0],"children",_4e);
}
deviceStore.save();
}});
var _4f=deviceStore.fetch({query:{id:"d_"+_49,type:"device"},onComplete:function(_50,_51){
if(_50&&(_50.length<2)){
var _52=deviceStore.fetch({query:{name:"ungrouped",type:"group"},onComplete:function(_53,_54){
if(_53){
var _55=deviceStore.getValues(_53[0],"children");
var c;
if(_55&&_55.length){
c=_55.concat(_4c);
}else{
c=_4c;
}
deviceStore.setValues(_53[0],"children",c);
deviceStore.save();
var _56=dijit.byId("device_tree_menu");
for(j=0;j<_4c.length;j++){
var _57=deviceTree.getNodesByItem(deviceTree.model.getIdentity(_4c[j]));
for(i=0;i<_57.length;i++){
_56.bindDomNode(_57[i].domNode);
}
}
}
}});
}
}});
}else{
alert(_4b.error);
}
},};
showLoading();
dojo.xhrGet(_4a);
};
function xhrAddParentDevice(_58,_59){
_58=_58.replace("d_","");
_59=_59.replace("d_","");
var _5a={url:"/panoptes/",handleAs:"json",content:{action:"addParentDevice",data:"{ \"child_id\": \""+_58+"\", \"parent_id\": \""+_59+"\" }"},load:function(_5b){
hideLoading();
if(_5b&&!_5b.error){
alert("Relationship has been added");
}else{
alert(_5b.error);
}
},};
showLoading();
dojo.xhrGet(_5a);
};
function editDeviceInfo(){
var id=deviceStore.getValues(deviceTreeSelectedItem,"id").toString();
tb1_label=document.createElement("label");
tb1_label.htmlFor="edit_device_name";
tb1_label.appendChild(document.createTextNode("Name"));
tb1=new dijit.form.TextBox({id:"edit_device_name",name:"edit_device_name",style:"width: 25em;",placeHolder:"device name"});
tb2_label=document.createElement("label");
tb2_label.htmlFor="edit_device_os_type";
tb2_label.appendChild(document.createTextNode("OS Type"));
tb2=new dijit.form.TextBox({id:"edit_device_os_type",name:"edit_device_os_type",style:"width: 25em;",placeHolder:"OS Type (ie Linux)"});
tb3_label=document.createElement("label");
tb3_label.htmlFor="edit_device_os_detail";
tb3_label.appendChild(document.createTextNode("OS Detail"));
tb3=new dijit.form.TextBox({id:"edit_device_os_detail",name:"edit_device_os_detail",style:"width: 25em;",placeHolder:"OS Detail (ie 2.6.32)"});
rst=new dijit.form.Button({label:"Cancel",onClick:function(){
dijit.byId("edit_device_name").destroy();
dijit.byId("edit_device_os_type").destroy();
dijit.byId("edit_device_os_detail").destroy();
win=document.getElementById("edit_device_win");
while(win.hasChildNodes()>=1){
win.removeChild(win.firstChild);
}
document.body.removeChild(win);
}});
sub=new dijit.form.Button({label:"Save",onClick:function(){
var _5c={name:dijit.byId("edit_device_name").get("value"),os_type:dijit.byId("edit_device_os_type").get("value"),os_detail:dijit.byId("edit_device_os_detail").get("value"),device_id:id.replace("d_","")};
xhrEditDeviceInfo(_5c);
dijit.byId("edit_device_name").destroy();
dijit.byId("edit_device_os_type").destroy();
dijit.byId("edit_device_os_detail").destroy();
win=document.getElementById("edit_device_win");
while(win.hasChildNodes()>=1){
win.removeChild(win.firstChild);
}
document.body.removeChild(win);
}});
var _5d=[tb1_label,tb1.domNode,document.createElement("br"),tb2_label,tb2.domNode,document.createElement("br"),tb3_label,tb3.domNode,document.createElement("br"),rst.domNode,sub.domNode];
createOverlayWindow("edit_device_win",_5d);
};
function xhrEditDeviceInfo(_5e){
var _5f={url:"/panoptes/",handleAs:"json",content:{action:"editDeviceInfo",data:dojo.toJson(_5e)},load:function(_60){
hideLoading();
if(_60&&_60.error){
alert(_60.error);
}
},};
showLoading();
dojo.xhrGet(_5f);
};
function addParentDevice(){
var id=deviceStore.getValues(deviceTreeSelectedItem,"id").toString();
parent=new dijit.form.FilteringSelect({id:"parent_device",name:"parent_device",style:"width: 25em;",store:deviceStore,title:"Parent",query:{type:"device"},labelAttr:"name",searchAttr:"id",labelFunc:function(itm,str){
var _61=str.getValue(itm,"name");
return _61;
},placeHolder:"Parent Device"});
rst=new dijit.form.Button({label:"Cancel",onClick:function(){
dijit.byId("parent_device").destroy();
win=document.getElementById("add_parent_device_win");
while(win.hasChildNodes()>=1){
win.removeChild(win.firstChild);
}
document.body.removeChild(win);
}});
sub=new dijit.form.Button({label:"Add",onClick:function(){
xhrAddParentDevice(id,dijit.byId("parent_device").attr("value"));
dijit.byId("parent_device").destroy();
win=document.getElementById("add_parent_device_win");
while(win.hasChildNodes()>=1){
win.removeChild(win.firstChild);
}
document.body.removeChild(win);
}});
var _62=[parent.domNode,rst.domNode,sub.domNode];
createOverlayWindow("add_parent_device_win",_62);
};
function removeFromGroup(){
var id=deviceStore.getValues(deviceTreeSelectedItem,"id").toString();
var _63=deviceStore.getValues(deviceTreeSelectedItem,"name");
req=deviceStore.fetch({query:{type:"group"},onItem:function(grp){
deviceTree.model.getChildren(grp,function(_64){
dojo.forEach(_64,function(_65){
if((_65)&&(_65==deviceTreeSelectedItem)){
id=id.replace("d_","");
g_id=deviceStore.getValue(grp,"id");
g_id=g_id.replace("g_","");
xhrRemoveGroupMember(g_id,id);
}
});
});
}});
};
function addToGroup(){
var id=deviceStore.getValues(deviceTreeSelectedItem,"id").toString();
id=id.replace("d_","");
cb=new dijit.form.ComboBox({id:"group_to_add",name:"group_to_add",store:groupStore,searchAttr:"name"},"group_to_add");
rst=new dijit.form.Button({label:"Cancel",onClick:function(){
dijit.byId("group_to_add").destroy();
document.body.removeChild(document.getElementById("add_to_device_group_win"));
}});
sub=new dijit.form.Button({label:"Add",onClick:function(){
xhrGroupAdd("group_to_add",id);
}});
var _66=[cb.domNode,rst.domNode,sub.domNode];
createOverlayWindow("add_to_device_group_win",_66);
};

