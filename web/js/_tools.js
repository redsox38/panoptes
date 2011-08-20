var dashboards_loaded=false;
var dashboardWidgetStore=null;
var widget_counter=0;
var monitorTypeStore=new dojo.data.ItemFileReadStore({data:{identifier:"monitor_name",label:"monitor_name",items:[{monitor_name:"ICMP"},{monitor_name:"Port"},{monitor_name:"SSL Certificate"},{monitor_name:"Shell Script"},{monitor_name:"URL"},]}});
function _createTemplateParam_internal(_1,_2,_3){
var _4=null;
if(_1=="ICMP"){
}else{
if(_1=="Port"){
if(_3==null){
_3=80;
}
_4=new dijit.form.NumberSpinner({id:"create_template_param"+_2,name:"create_template_param"+_2,value:_3,style:"width: 100px;",constraints:{min:4,max:65536,places:0}});
}else{
if(_1=="SSL Certificate"){
}else{
if(_1=="Shell Script"){
_4=new dijit.form.FilteringSelect({id:"create_template_param"+_2,name:"create_template_param"+_2,store:availableShellMonitorStore,title:"Monitor",searchAttr:"script",});
if(_3!=null){
_4.set("value",_3);
}
}else{
if(_1=="URL"){
param_a=new dijit.form.TextBox({id:"create_template_param_a_"+_2,name:"create_template_param_a_"+_2,style:"width: 25em;",placeHolder:"http://%PANOPTES_MONITOR_ADDR%/some_url"});
dojo.place(param_a.domNode,"create_template_br"+_2,"before");
param_b=new dijit.form.TextBox({id:"create_template_param_b_"+_2,name:"create_template_param_b_"+_2,style:"width: 5em;",required:true,placeHolder:"200"});
dojo.place(param_b.domNode,"create_template_br"+_2,"before");
_4=new dijit.form.TextBox({id:"create_template_param"+_2,name:"create_template_param"+_2,style:"width: 20em;",required:false,placeHolder:"optional text in web page"});
if(_3!=null){
param_a.set("value",_3[0]);
param_b.set("value",_3[1]);
if(_3.length>2){
_4.set("value",_3[2]);
}
}
}else{
alert("Unknown type: "+_1);
}
}
}
}
}
if(_4){
dojo.place(_4.domNode,"create_template_br"+_2,"before");
}
img=new Image();
img.src="/panoptes/images/delete.png";
img.id="create_template_delete"+_2;
img.className="panoptesTemplateDeleteIcon";
img.onclick=Function("_deleteTemplateObject("+_2+")");
dojo.place(img,"create_template_br"+_2,"before");
};
function _deleteTemplateObject(id){
var _5=["create_template_param_b_"+id,"create_template_param_a_"+id,"create_template_param"+id,"create_template_obj"+id];
dojo.forEach(_5,function(d){
var t=dijit.byId(d);
if(t){
t.destroy();
}
});
dojo.destroy("create_template_delete"+id);
dojo.destroy("create_template_br"+id);
};
function _createTemplateParam(e){
var _6=this.get("value");
var _7=this.get("name").match(/\d+$/);
_createTemplateParam_internal(_6,_7,null);
_createTemplateObject(null);
};
function _createTemplateObject(e){
var _8=false;
var i=0;
var _9;
while(!_8){
_9=dijit.byId("create_template_obj"+i);
if(!_9){
_8=true;
}else{
i++;
}
}
t=new dijit.form.FilteringSelect({id:"create_template_obj"+i,name:"create_template_obj"+i,store:monitorTypeStore,title:"Monitor Type",searchAttr:"monitor_name",placeHolder:"Monitor Type"});
dojo.connect(t,"onChange",dijit.byId("create_template_obj"+i),_createTemplateParam);
var _a;
if(!i){
_a=dojo.byId("template_name_br");
}else{
_a=dojo.byId("create_template_br"+(i-1));
}
var b=document.createElement("br");
b.id="create_template_br"+i;
dojo.place(t.domNode,_a,"after");
dojo.place(b,t.domNode,"after");
};
function loadDashboard(){
if(!dashboards_loaded){
var _b=dojo.xhrGet({url:"/panoptes/js/dashboards.js",handleAs:"javascript",sync:true});
dashboards_loaded=true;
}
var _c={url:"/panoptes/dashboardWidget.php",handleAs:"json",content:{action:"getUserWidgets",data:"{ }"},load:function(_d){
if(_d&&!_d.error){
dojo.forEach(_d.data,function(_e){
renderWidget(_e);
widget_counter++;
});
}else{
alert(_d.error);
}
},};
dojo.xhrGet(_c);
};
function openEditDashboardTab(){
if(!dashboards_loaded){
var _f=dojo.xhrGet({url:"/panoptes/js/dashboards.js",handleAs:"javascript"});
dashboards_loaded=true;
}
dashboard_edit_mode=true;
if(!dashboardWidgetStore){
dashboardWidgetStore=new dojo.data.ItemFileWriteStore({data:{identifier:"id",label:"name",items:[]}});
var _10={url:"/panoptes/dashboardWidget.php",handleAs:"json",content:{action:"getDashboardWidgets",data:"{ }"},load:function(_11){
if(_11&&!_11.error){
dojo.forEach(_11.data,function(_12){
dashboardWidgetStore.newItem(_12);
});
dashboardWidgetStore.save();
}else{
alert(_11.error);
}
},};
dojo.xhrGet(_10);
}
var _13=new dijit.form.Button({id:"dashboard_cancel",label:"Done",onClick:function(){
dashboard_edit_mode=false;
dijit.byId("dashboard_add").destroy();
dijit.byId("dashboard_save").destroy();
dijit.byId("dashboard_cancel").destroy();
var _14=dijit.byId("new_widget_type");
if(_14&&_14.get("value")){
widget_counter--;
var _15={url:"/panoptes/dashboardWidget.php",handleAs:"json",content:{action:"getWidgetFormCleanup",data:"{ \"widget_id\": \""+_14.get("value")+"\" }"},load:function(_16){
if(_16&&!_16.error){
eval(_16.data);
}else{
alert(_16.error);
}
},};
dojo.xhrGet(_15);
}
var _17=dojo.byId("dashboard_tab");
win=dojo.byId("new_widget_box");
if(win){
dijit.byId("new_widget_type").destroy();
_17.removeChild(win);
}
for(i=0;i<widget_counter;i++){
img=dojo.byId("widget_delete_icon_"+i);
if(img){
_17.removeChild(img);
}
}
}}).placeAt("dashboard_tab","first");
var _18=new dijit.form.Button({id:"dashboard_save",label:"Save",onClick:function(){
win=dojo.byId("new_widget_box");
var _19={};
if(win){
for(i=0;i<win.childNodes.length;i++){
var _1a=win.childNodes[i].id;
if(_1a){
var _1b=_1a.replace("widget_","");
var _1c=dijit.byId(_1b);
if(_1c){
_19[_1b]=_1c.get("value");
}else{
_19[_1b]=dojo.byId(_1b).value;
}
}
}
}
var _1d=dijit.byId("new_widget_type");
if(_1d){
var _1e={url:"/panoptes/dashboardWidget.php",handleAs:"json",content:{action:"saveWidget",data:"{ \"widget_id\": \""+_1d.get("value")+"\", \"params\": "+dojo.toJson(_19)+" }"},load:function(_1f){
if(_1f&&!_1f.error){
dojo.forEach(_1f.data,function(_20){
renderWidget(_20);
widget_counter++;
});
}else{
alert(_1f.error);
}
},};
dojo.xhrGet(_1e);
win=dojo.byId("new_widget_box");
if(win){
widget_counter--;
dijit.byId("new_widget_type").destroy();
var _21=dojo.byId("dashboard_tab");
_21.removeChild(win);
}
}
}}).placeAt("dashboard_tab","first");
var _22=new dijit.form.Button({id:"dashboard_add",label:"Add New",onClick:function(){
addDashboardWidget();
}}).placeAt("dashboard_tab","first");
if(widget_counter){
for(i=0;i<widget_counter;i++){
var _23=dojo.marginBox("widget_box_"+i);
var _24=_23.l+_23.w-15;
var _25=_23.t-5;
img=new Image();
img.src="/panoptes/images/delete.png";
img.id="widget_delete_icon_"+i;
img.className="dashboardWidgetDeleteIcon";
img.onclick=Function("deleteUserWidget("+i+")");
dojo.style(img,{top:_25+"px",left:_24+"px"});
dijit.byId("dashboard_tab").domNode.appendChild(img);
}
}
dijit.byId("panoptes_tab_container").selectChild(dijit.byId("dashboard_tab"));
};
function deleteUserWidget(idx){
var _26={url:"/panoptes/dashboardWidget.php",handleAs:"json",content:{action:"deleteUserWidget",data:"{ \"pos\": \""+idx+"\" }"},load:function(_27){
hideLoading();
if(_27&&!_27.error){
var _28=dojo.byId("dashboard_tab");
img=dojo.byId("widget_delete_icon_"+idx);
box=dojo.byId("widget_box_"+idx);
_28.removeChild(img);
_28.removeChild(box);
widget_counter--;
}else{
alert(_27.error);
}
},};
showLoading();
dojo.xhrGet(_26);
};
function openAutoDiscoveryTab(){
var cp=new dijit.layout.ContentPane({id:"auto_discovery_tab",title:"Auto Discovery",closable:true,style:"width: 100%; height: 100%;"});
dijit.byId("panoptes_tab_container").addChild(cp);
dijit.byId("panoptes_tab_container").selectChild(cp);
createAutoDiscoveryGrid();
};
function openSecurityGroupTab(){
var cp=new dijit.layout.ContentPane({id:"manage_security_groups_tab",title:"Security Groups",closable:true,style:"width: 100%; height: 100%;"});
dijit.byId("panoptes_tab_container").addChild(cp);
add_tb=new dijit.form.TextBox({id:"add_security_group_name",name:"add_security_group_name",style:"width: 25em;",placeHolder:"Group Name"}).placeAt("manage_security_groups_tab");
add_sub=new dijit.form.Button({id:"add_security_group_submit",label:"Create",onClick:function(){
xhrCreateSecurityGroup(dijit.byId("add_security_group_name").get("displayedValue"));
}}).placeAt("manage_security_groups_tab");
dojo.place("<br/>","manage_security_groups_tab");
del_tb=new dijit.form.FilteringSelect({id:"del_security_group_name",name:"del_security_group_name",style:"width: 15em;",store:userStore,query:{type:"group"},searchAttr:"name",placeHolder:"group to delete"}).placeAt("manage_security_groups_tab");
del_sub=new dijit.form.Button({id:"del_security_group_submit",label:"Delete",onClick:function(){
xhrDeleteSecurityGroup(dijit.byId("del_security_group_name").get("value"));
}}).placeAt("manage_security_groups_tab");
dijit.byId("panoptes_tab_container").selectChild(cp);
};
function openTemplateTab(){
template_data={label:"name",identifier:"id",items:[]};
templateStore=new dojo.data.ItemFileWriteStore({data:template_data});
var _29={url:"/panoptes/",handleAs:"json",content:{action:"getDeviceTemplates",data:"{}"},load:function(_2a){
if(_2a&&!_2a.error){
if(_2a.data&&(_2a.data.length>0)){
dojo.forEach(_2a.data,function(_2b){
templateStore.newItem(_2b);
});
templateStore.save();
}
}else{
alert(_2a.error);
}
hideLoading();
},};
showLoading();
var _2c=dojo.xhrGet(_29);
var cp=new dijit.layout.ContentPane({id:"manage_template_tab",title:"Device Templates",closable:true,style:"width: 100%; height: 100%;"});
dijit.byId("panoptes_tab_container").addChild(cp);
var _2d=new dijit.form.Button({id:"create_tpl",label:"Create New Template",onClick:function(){
createTemplate();
}}).placeAt("manage_template_tab");
dojo.place("<br/>","manage_template_tab");
var _2e=new dijit.form.FilteringSelect({id:"delete_template_selector",name:"delete_template_selector",store:templateStore,title:"template",searchAttr:"name",labelFunc:function(itm,str){
var _2f=str.getValue(itm,"name");
return _2f;
},labelAttr:"name"}).placeAt("manage_template_tab");
var _30=new dijit.form.Button({id:"delete_template_submit",label:"Delete Template",onClick:function(){
xhrDeleteTemplate();
}}).placeAt("manage_template_tab");
dojo.place("<br/>","manage_template_tab");
var _31=new dijit.form.FilteringSelect({id:"edit_template_selector",name:"edit_template_selector",store:templateStore,title:"edit_template",searchAttr:"name",labelFunc:function(itm,str){
var _32=str.getValue(itm,"name");
return _32;
},labelAttr:"name"}).placeAt("manage_template_tab");
var _33=new dijit.form.Button({id:"edit_template_submit",label:"Edit Template",onClick:function(){
var obj=dijit.byId("edit_template_selector");
if(obj){
editTemplate(obj);
}
}}).placeAt("manage_template_tab");
dijit.byId("panoptes_tab_container").selectChild(cp);
};
function editTemplate(tpl){
tb=new dijit.form.TextBox({id:"template_name",name:"template_name",placeHolder:"Template Name"});
b=document.createElement("br");
b.id="template_name_br";
createOverlayWindow("create_template",[tb.domNode,b]);
var _34=tpl.get("value");
templateStore.fetchItemByIdentity({identity:_34,onItem:function(_35){
dijit.byId("template_name").set("value",templateStore.getValue(_35,"name"));
dijit.byId("template_name").attr("disabled","true");
var _36=dojo.fromJson(templateStore.getValue(_35,"params"));
for(var i=0;i<_36.length;i++){
var _37=null;
if(_36[i]["type"]=="Port"){
_37=_36[i]["port"];
}else{
if(_36[i]["type"]=="Shell Script"){
_37=_36[i]["script"];
}else{
if(_36[i]["type"]=="URL"){
_37=[_36[i]["url"],_36[i]["code"],_36[i]["content"]];
}
}
}
t=new dijit.form.FilteringSelect({id:"create_template_obj"+i,name:"create_template_obj"+i,store:monitorTypeStore,value:_36[i]["type"],title:"Monitor Type",searchAttr:"monitor_name"});
dojo.connect(t,"onChange",dijit.byId("create_template_obj"+i),_createTemplateParam);
var _38;
if(!i){
_38=dojo.byId("template_name_br");
}else{
_38=dojo.byId("create_template_br"+(i-1));
}
var b=document.createElement("br");
b.id="create_template_br"+i;
dojo.place(t.domNode,_38,"after");
dojo.place(b,t.domNode,"after");
_createTemplateParam_internal(_36[i]["type"],i,_37);
}
var _38=dojo.byId("create_template_br"+(i-1));
t=new dijit.form.FilteringSelect({id:"create_template_obj"+i,name:"create_template_obj"+i,store:monitorTypeStore,placeHolder:"Monitor Type",title:"Monitor Type",searchAttr:"monitor_name"}).placeAt(_38,"after");
dojo.connect(t,"onChange",dijit.byId("create_template_obj"+i),_createTemplateParam);
var b=document.createElement("br");
b.id="create_template_br"+i;
dojo.place(t.domNode,_38,"after");
dojo.place(b,t.domNode,"after");
rst=new dijit.form.Button({id:"create_template_reset",label:"Cancel",onClick:function(){
destroyAll("create_template");
}}).placeAt("create_template_br"+i,"after");
sub=new dijit.form.Button({id:"create_template_submit",label:"Save",onClick:function(){
xhrCreateTemplate(_34);
destroyAll("create_template");
}}).placeAt("create_template_br"+i,"after");
}});
};
function getPrefValue(_39,_3a){
showLoading();
var req=prefStore.fetch({query:{pref_name:_3a},onComplete:function(_3b,req){
for(var i=0;i<_3b.length;i++){
dijit.byId(_3a).setValue(prefStore.getValue(_3b[i],"pref_value"));
}
hideLoading();
}});
};
function loadUserPrefs(){
var _3c={url:"/panoptes/",handleAs:"json",content:{action:"getAllPrefs",data:"{ }"},load:function(_3d){
if(_3d&&!_3d.error){
dojo.forEach(_3d.data,function(_3e){
prefStore.newItem(_3e);
});
prefStore.save();
}else{
alert(_3d.error);
}
},};
dojo.xhrGet(_3c);
};
function createPrefTab(_3f,_40,_41){
var cp=new dijit.layout.ContentPane({id:"pref_tab_"+_3f,title:_3f,content:"",});
for(i=0;i<_40.length;i++){
l=document.createElement("label");
l.htmlFor=_40[i].id;
l.appendChild(document.createTextNode(_41[i]));
cp.domNode.appendChild(l);
_40[i].placeAt(cp.domNode);
cp.domNode.appendChild(document.createElement("br"));
}
var sub=new dijit.form.Button({id:"pref_tab_"+_3f+"_submit",label:"Save",onClick:function(){
var _42={};
chld=cp.getChildren();
dojo.forEach(chld,function(_43){
if(_43.declaredClass!="dijit.form.Button"){
_42[_43.id]=_43.get("value");
}
});
var _44={url:"/panoptes/",handleAs:"json",content:{action:"savePrefs",data:"{ \"scope\": \""+_3f+"\", \"prefs\": "+dojo.toJson(_42)+"}"},load:function(_45){
if(_45&&_45.error){
alert(_45.error);
}
},};
dojo.xhrGet(_44);
}});
sub.placeAt(cp.domNode);
return (cp);
};
function openPrefTab(){
var bc=new dijit.layout.BorderContainer({id:"prefs_tab",title:"User Preferences",style:"width: 100%; height: 100%;",closable:true});
var tc=new dijit.layout.TabContainer({id:"prefs_tc",region:"center",style:"height: 100%; width: 100%;"});
bc.addChild(tc);
var _46=[{theme_name:"claro"},{theme_name:"tundra"},{theme_name:"nihilo"},{theme_name:"soria"}];
if(dojoVersion>=160){
_46.push({theme_name:"a11y"});
}
var _47=[{theme_name:"Adobebricks"},{theme_name:"Algae"},{theme_name:"Bahamation"},{theme_name:"BlueDusk"},{theme_name:"Charged"},{theme_name:"Chris"},{theme_name:"Claro"},{theme_name:"CubanShirts"},{theme_name:"Desert"},{theme_name:"Distinctive"},{theme_name:"Dollar"},{theme_name:"Electric"},{theme_name:"gradientGenerator"},{theme_name:"Grasshopper"},{theme_name:"Grasslands"},{theme_name:"GreySkies"},{theme_name:"Harmony"},{theme_name:"IndigoNation"},{theme_name:"Ireland"},{theme_name:"Julie"},{theme_name:"MiamiNice"},{theme_name:"Midwest"},{theme_name:"Minty"},{theme_name:"PrimaryColors"},{theme_name:"PurpleRain"},{theme_name:"Renkoo"},{theme_name:"RoyalPurples"},{theme_name:"SageToLime"},{theme_name:"Shrooms"},{theme_name:"ThreeD"},{theme_name:"Tom"},{theme_name:"Tufte"},{theme_name:"WatersEdge"},{theme_name:"Wetland"}];
themeStore=new dojo.data.ItemFileReadStore({data:{identifier:"theme_name",label:"theme_name",items:_46}});
chartThemeStore=new dojo.data.ItemFileReadStore({data:{identifier:"theme_name",label:"theme_name",items:_47}});
sb=new dijit.form.FilteringSelect({id:"general_prefs_theme",name:"theme_name",store:themeStore,title:"Theme",searchAttr:"theme_name"});
sb2=new dijit.form.FilteringSelect({id:"general_prefs_chart_theme",name:"chart_theme_name",store:chartThemeStore,title:"ChartTheme",searchAttr:"theme_name"});
tb=new dijit.form.TextBox({id:"notification_prefs_addr",name:"notification_prefs_addr",style:"width: 25em;",placeHolder:"Notification email address"});
tb2=new dijit.form.TextBox({id:"notification_prefs_xmpp_addr",name:"notification_prefs_xmpp_addr",style:"width: 25em;",placeHolder:"Notification xmpp address"});
getPrefValue("general","general_prefs_theme");
getPrefValue("general","general_prefs_chart_theme");
getPrefValue("notifications","notification_prefs_addr");
getPrefValue("notifications","notification_prefs_xmpp_addr");
tc.addChild(createPrefTab("general",[sb,sb2],["Theme","Chart Theme"]));
tc.addChild(createPrefTab("notifications",[tb,tb2],["E-mail Address","XMPP Address"]));
dijit.byId("panoptes_tab_container").addChild(bc);
dijit.byId("panoptes_tab_container").selectChild(bc);
};
function xhrAddPingable(_48){
var _49={url:"/panoptes/",handleAs:"json",content:{action:"addPingMonitor",data:"{ \"address\": \""+_48+"\" }"},load:function(_4a){
if(_4a&&!_4a.error){
if(deviceTree){
itm=deviceStore.newItem(_4a.data);
req=deviceStore.fetch({query:{name:"ungrouped",type:"group"},onComplete:function(_4b,req){
if(_4b.length){
var _4c=deviceStore.getValues(_4b[0],"children");
if(_4c&&_4c.length){
_4c.push(itm);
}else{
_4c=[itm];
}
deviceStore.setValues(_4b[0],"children",_4c);
deviceStore.save();
var _4d=dijit.byId("device_tree_menu");
var _4e=deviceTree.getNodesByItem(deviceTree.model.getIdentity(itm));
for(i=0;i<_4e.length;i++){
_4d.bindDomNode(_4e[0].domNode);
}
}
}});
deviceStore.save();
}
}else{
alert(_4a.error);
}
},};
dojo.xhrGet(_49);
};
function xhrDeleteTemplate(){
var obj=dijit.byId("delete_template_selector");
if(obj){
var _4f=obj.get("value");
var _50={url:"/panoptes/",handleAs:"json",content:{action:"deleteDeviceTemplate",data:"{ \"template_id\": \""+_4f+"\" }"},load:function(_51){
if(_51&&!_51.error){
templateStore.fetchItemByIdentity({identity:_4f,onItem:function(_52,req){
templateStore.deleteItem(_52);
templateStore.save();
}});
alert("Template has been deleted.");
}else{
alert(_51.error);
}
},};
dojo.xhrGet(_50);
}
};
function xhrCreateTemplate(_53){
var i=0;
var obj=dijit.byId("create_template_obj"+i);
var _54=[];
while(obj){
var _55=obj.get("value");
if(_55=="ICMP"){
_54.push({"type":_55});
}else{
if(_55=="Port"){
var prm=dijit.byId("create_template_param"+i).get("value");
_54.push({"type":_55,"port":prm});
}else{
if(_55=="SSL Certificate"){
_54.push({"type":_55});
}else{
if(_55=="Shell Script"){
var prm=dijit.byId("create_template_param"+i).get("value");
_54.push({"type":_55,"script":prm});
}else{
if(_55=="URL"){
var _56=dijit.byId("create_template_param_a_"+i).get("value");
var _57=dijit.byId("create_template_param_b_"+i).get("value");
var _58=dijit.byId("create_template_param"+i).get("value");
_54.push({"type":_55,"url":_56,"code":_57,"content":_58});
}
}
}
}
}
i++;
obj=dijit.byId("create_template_obj"+i);
}
var _59={url:"/panoptes/",handleAs:"json",content:{action:"createTemplate",data:"{ \"name\" : \""+dijit.byId("template_name").get("value")+"\", \"params\" : "+dojo.toJson(_54)+(_53==null?"}":", \"id\": \""+_53+"\"}")},load:function(_5a){
if(_5a&&!_5a.error){
if(_53==null){
dojo.forEach(_5a.data,function(_5b){
templateStore.newItem(_5b);
});
templateStore.save();
}
alert("Template saved.");
}else{
alert(_5a.error);
}
},};
dojo.xhrGet(_59);
};
function xhrCreateSecurityGroup(_5c){
var _5d={url:"/panoptes/",handleAs:"json",content:{action:"createSecurityGroup",data:"{ \"group_name\": \""+_5c+"\" }"},load:function(_5e){
if(_5e&&!_5e.error){
dojo.forEach(_5e.data,function(_5f){
userStore.newItem(_5f);
});
userStore.save();
}
},};
dojo.xhrGet(_5d);
};
function xhrDeleteSecurityGroup(id){
var _60=id.replace("g_","");
var _61={url:"/panoptes/",handleAs:"json",content:{action:"deleteSecurityGroup",data:"{ \"group_id\": \""+_60+"\" }"},load:function(_62){
if(_62&&!_62.error){
userStore.fetchItemByIdentity({identity:id,onItem:function(_63,req){
userStore.deleteItem(_63);
userStore.save();
}});
}
},};
dojo.xhrGet(_61);
};
function xhrUploadFile(_64,_65){
file_contents=Base64.encode(_65.getAsText(""));
var _66={url:"/panoptes/",handleAs:"json",content:{action:"uploadFile",data:"{ \"type\": \""+_64+"\", \"name\": \""+_65.fileName+"\", \"contents\": \""+file_contents+"\" }"},load:function(_67){
if(_67&&!_67.error){
if(_64=="script"){
item={"script":_65.fileName,"params":""};
availableShellMonitorStore.newItem(item);
}
}else{
alert(_67.error);
}
},};
dojo.xhrGet(_66);
};
function uploadFile(){
file_sel=document.createElement("input");
file_sel.type="file";
file_sel.id="upload_file_filename";
sub=new dijit.form.Button({id:"upload_file_submit",label:"Upload",onClick:function(){
xhrUploadFile("script",file_sel.files[0]);
dijit.byId("upload_file_reset").destroy();
dijit.byId("upload_file_submit").destroy();
document.body.removeChild(dojo.byId("upload_file"));
}});
rst=new dijit.form.Button({id:"upload_file_reset",label:"Cancel",onClick:function(){
dijit.byId("upload_file_reset").destroy();
dijit.byId("upload_file_submit").destroy();
document.body.removeChild(dojo.byId("upload_file"));
}});
var _68=[file_sel,document.createElement("br"),rst.domNode,sub.domNode];
createOverlayWindow("upload_file",_68);
};
function createTemplate(){
tb=new dijit.form.TextBox({id:"template_name",name:"template_name",placeHolder:"Template Name"});
dojo.connect(tb,"onBlur",_createTemplateObject);
sub=new dijit.form.Button({id:"create_template_submit",label:"Save",onClick:function(){
xhrCreateTemplate(null);
destroyAll("create_template");
}});
rst=new dijit.form.Button({id:"create_template_reset",label:"Cancel",onClick:function(){
destroyAll("create_template");
}});
b=document.createElement("br");
b.id="template_name_br";
var _69=[tb.domNode,b,rst.domNode,sub.domNode];
createOverlayWindow("create_template",_69);
};
function addPingable(){
tb=new dijit.form.TextBox({id:"ping_device_ip",name:"ping_device_ip",placeHolder:"IP Address to monitor"});
sub=new dijit.form.Button({id:"ping_device_submit",label:"Add",onClick:function(){
xhrAddPingable(dijit.byId("ping_device_ip").getValue());
dijit.byId("ping_device_ip").destroy();
dijit.byId("ping_device_reset").destroy();
dijit.byId("ping_device_submit").destroy();
document.body.removeChild(dojo.byId("add_ping_device"));
}});
rst=new dijit.form.Button({id:"ping_device_reset",label:"Cancel",onClick:function(){
dijit.byId("ping_device_ip").destroy();
dijit.byId("ping_device_reset").destroy();
dijit.byId("ping_device_submit").destroy();
document.body.removeChild(dojo.byId("add_ping_device"));
}});
var _6a=[tb.domNode,rst.domNode,sub.domNode];
createOverlayWindow("add_ping_device",_6a);
};

