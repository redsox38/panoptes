var discoveryGrid;
var discoveryStore;
function createAutoDiscoveryGrid(){
var _1={url:"/panoptes/",handleAs:"json",content:{action:"populateAutoDiscoveryForm",data:"{ }"},load:function(_2){
hideLoading();
if(_2&&!_2.error){
var _3={label:"dstaddr",identifier:"id",items:_2.data};
var _4=[{field:"dstaddr",name:"Destination Address",width:"200px"},{field:"proto",name:"Protocol",width:"100px"},{field:"dport",name:"Destination Port",width:"auto"}];
discoveryStore=new dojo.data.ItemFileWriteStore({data:_3});
discoveryGrid=new dojox.grid.EnhancedGrid({store:discoveryStore,structure:_4,clientSort:true,rowSelector:"20px",selectionMode:"multiple",closable:true,plugins:{nestedSorting:true,menus:{rowMenu:"autoDiscoveryRowMenu"}}},document.createElement("div"));
dojo.byId("auto_discovery_tab").appendChild(discoveryGrid.domNode);
discoveryGrid.startup();
}
},};
showLoading();
var _5=dojo.xhrGet(_1);
};
function monitorEntry(_6){
var _7=[];
var _8=discoveryGrid.selection.getSelected();
discoveryGrid.selection.clear();
if(_8.length){
dojo.forEach(_8,function(_9){
if(_9!==null){
var id=discoveryGrid.store.getValues(_9,"id");
_7.push(id);
discoveryGrid.store.deleteItem(_9);
}
});
discoveryGrid.store.save();
}
var _a={url:"/panoptes/",handleAs:"json",content:{action:"monitorAutoDiscoveryEntry",data:"{ \"id\" : ["+_7+"], \"type\" :\""+_6+"\" }"},load:function(_b){
if(_b&&_b.error){
alert(_b.error);
}
},};
var _c=dojo.xhrGet(_a);
};
function ignoreEntry(){
var _d=[];
var _e=discoveryGrid.selection.getSelected();
discoveryGrid.selection.clear();
if(_e.length){
dojo.forEach(_e,function(_f){
if(_f!==null){
var id=discoveryGrid.store.getValues(_f,"id");
_d.push(id);
discoveryGrid.store.deleteItem(_f);
}
});
discoveryGrid.store.save();
}
var _10={url:"/panoptes/",handleAs:"json",content:{action:"ignoreAutoDiscoveryEntry",data:"{ \"id\" : ["+_d+"] }"},load:function(_11){
if(_11&&_11.error){
alert(_11.error);
}
},};
var _12=dojo.xhrGet(_10);
};

