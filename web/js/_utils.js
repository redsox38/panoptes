function destroyAll(_1){
var n=dojo.byId(_1);
dojo.forEach(dijit.findWidgets(n),function(_2){
_2.destroyRecursive();
});
dojo.destroy(n);
};
function showLoading(){
loading_count++;
var _3=document.getElementById("loading_img");
_3.style.visibility="visible";
};
function hideLoading(){
loading_count--;
if(loading_count<1){
var _4=document.getElementById("loading_img");
_4.style.visibility="hidden";
}
};
function reloadMonitorEntry(_5,_6,_7,_8,_9){
date_pat=/(^\d{4})\-(\d{2})-(\d{2}) (\d+):(\d+):(\d+)/;
date_parts=_9.match(date_pat);
var _a=null;
then=new Date(date_parts[1],(date_parts[2]-1),date_parts[3],date_parts[4],date_parts[5],date_parts[6]);
now=new Date();
to=then.getTime()-now.getTime();
if(then>now){
_a=setTimeout(_5,to,_6,_7,_8);
}
return (_a);
};
function createOverlayWindow(id,_b){
var _c=document.createElement("div");
_c.id=id;
_c.innerHTML="";
_c.className="overlayWindow";
var _d=document.createElement("div");
_d.id=id+"_bg";
_d.style.backgroundColor="white";
_d.style.color="black";
_d.style.border="solid";
_d.style.marginTop="75px";
_d.style.marginBottom="50px";
_d.style.marginLeft="250px";
_d.style.marginRight="250px";
_d.style.align="center";
_d.zIndex=51;
for(i=0;i<_b.length;i++){
_b[i].style.marginTop="5px";
_b[i].style.marginBottom="5px";
_b[i].style.marginLeft="5px";
_b[i].style.marginRight="5px";
_d.appendChild(_b[i]);
}
_d.appendChild(document.createElement("br"));
_d.appendChild(document.createElement("br"));
_d.appendChild(document.createElement("br"));
_d.appendChild(document.createElement("br"));
_c.appendChild(_d);
document.body.appendChild(_c);
};
var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(_e){
var _f="";
var _10,_11,_12,_13,_14,_15,_16;
var i=0;
_e=Base64._utf8_encode(_e);
while(i<_e.length){
_10=_e.charCodeAt(i++);
_11=_e.charCodeAt(i++);
_12=_e.charCodeAt(i++);
_13=_10>>2;
_14=((_10&3)<<4)|(_11>>4);
_15=((_11&15)<<2)|(_12>>6);
_16=_12&63;
if(isNaN(_11)){
_15=_16=64;
}else{
if(isNaN(_12)){
_16=64;
}
}
_f=_f+this._keyStr.charAt(_13)+this._keyStr.charAt(_14)+this._keyStr.charAt(_15)+this._keyStr.charAt(_16);
}
return _f;
},decode:function(_17){
var _18="";
var _19,_1a,_1b;
var _1c,_1d,_1e,_1f;
var i=0;
_17=_17.replace(/[^A-Za-z0-9\+\/\=]/g,"");
while(i<_17.length){
_1c=this._keyStr.indexOf(_17.charAt(i++));
_1d=this._keyStr.indexOf(_17.charAt(i++));
_1e=this._keyStr.indexOf(_17.charAt(i++));
_1f=this._keyStr.indexOf(_17.charAt(i++));
_19=(_1c<<2)|(_1d>>4);
_1a=((_1d&15)<<4)|(_1e>>2);
_1b=((_1e&3)<<6)|_1f;
_18=_18+String.fromCharCode(_19);
if(_1e!=64){
_18=_18+String.fromCharCode(_1a);
}
if(_1f!=64){
_18=_18+String.fromCharCode(_1b);
}
}
_18=Base64._utf8_decode(_18);
return _18;
},_utf8_encode:function(_20){
_20=_20.replace(/\r\n/g,"\n");
var _21="";
for(var n=0;n<_20.length;n++){
var c=_20.charCodeAt(n);
if(c<128){
_21+=String.fromCharCode(c);
}else{
if((c>127)&&(c<2048)){
_21+=String.fromCharCode((c>>6)|192);
_21+=String.fromCharCode((c&63)|128);
}else{
_21+=String.fromCharCode((c>>12)|224);
_21+=String.fromCharCode(((c>>6)&63)|128);
_21+=String.fromCharCode((c&63)|128);
}
}
}
return _21;
},_utf8_decode:function(_22){
var _23="";
var i=0;
var c=c1=c2=0;
while(i<_22.length){
c=_22.charCodeAt(i);
if(c<128){
_23+=String.fromCharCode(c);
i++;
}else{
if((c>191)&&(c<224)){
c2=_22.charCodeAt(i+1);
_23+=String.fromCharCode(((c&31)<<6)|(c2&63));
i+=2;
}else{
c2=_22.charCodeAt(i+1);
c3=_22.charCodeAt(i+2);
_23+=String.fromCharCode(((c&15)<<12)|((c2&63)<<6)|(c3&63));
i+=3;
}
}
}
return _23;
}};

