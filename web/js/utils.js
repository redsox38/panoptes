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

// 
// destroyAll - function to recursively destroy all dojo widgets
//              that exist below a given DOM node
// @param {string} node a DOM object id
// @return none
//
function destroyAll(node) {
    var n = dojo.byId(node);
    
    dojo.forEach(dijit.findWidgets(n), function(widget) {
	    widget.destroyRecursive();
	});
    dojo.destroy(n);
}

// 
// showLoading - function to call when issuing an AJAX call.  It 
//               increments the count of pending ajax calls and makes
//               the loading image visible
// @param none
// @return none
//
function showLoading() {
    loading_count++;

    var img_div = document.getElementById("loading_img");
    img_div.style.visibility = "visible";
}

// 
// hideLoading - function to call when completing an AJAX call.  It 
//               decrements the count of pending ajax calls and makes
//               the hides the loading image if there are no more pending 
//               requests
// @param none
// @return none
//
function hideLoading() {    
    loading_count--;
    if (loading_count < 1) {
	var img_div = document.getElementById("loading_img");
	img_div.style.visibility = "hidden";
    }
}

// 
// reloadMonitorEntry - function run when a monitor entry is
//                      updated to reload the entry after the 
//                      next scheduled check.
// @param {Function} func - The function to call when the timer expires
// @param {Number} dev_id - device id of the entry to be reloaded
// @param {Number} ent_id - Monitor entry id to reload
// @param {Object} container - dojo grid object that the entry id is in
// @param {String} reload_date - Date to reload the entry at in the format
//                               YYYY-MM-DD hh:mm:ss
// @param {Number} timerId - id for reload timer
//
function reloadMonitorEntry(func, dev_id, ent_id, container, reload_date) {
    // countdown now to reload_date, convert to milliseconds and set timer
    date_pat = /(^\d{4})\-(\d{2})-(\d{2}) (\d+):(\d+):(\d+)/;
    date_parts = reload_date.match(date_pat);

    var timerId = null;
    then = new Date(date_parts[1], (date_parts[2] - 1), date_parts[3], date_parts[4], date_parts[5], date_parts[6]);
    now = new Date();

    to = then.getTime() - now.getTime();

    if (then > now) {
	timerId = setTimeout(func, to, dev_id, ent_id, container);
    }

    return(timerId);
}

//
// createOverlayWindow - called to create a new overlay window
//                       
// @param {String} id - id for the new window
// @param {Array} objs - array of DOM objects to make children of the
//                       newly created div
// @return none
//
function createOverlayWindow(id, objs) {
    var dv1 = dojo.create("div", { id: id, innerHTML: "", className: "overlayWindow" });

    // create white background div 
    // to hold form elements
    // needs to be on top of transparent overlay,
    // but below the zIndex for the combobox
    var dv2 = dojo.create("div", { id: id + '_bg', 
				   style: { backgroundColor: "white", color: "black", 
					    border: "solid", marginTop: "75px", 
					    marginBottom: "50px", marginLeft: "250px", 
					    marginRight: "250px", align: "center"}, 
				   zIndex: 51 });

    for (i = 0; i < objs.length; i++) {
	objs[i].style.marginTop = "5px";
	objs[i].style.marginBottom = "5px";
	objs[i].style.marginLeft = "5px";
	objs[i].style.marginRight = "5px";
	dv2.appendChild(objs[i]);
    }

    dojo.create("div", null, dv2, "last");
    dojo.create("div", null, dv2, "last");
    dojo.create("div", null, dv2, "last");
    dojo.create("div", null, dv2, "last");

    dv1.appendChild(dv2);

    document.body.appendChild(dv1);    
}


/**
 *
 *  Base64 encode / decode
 *  http://www.webtoolkit.info/
 *
 **/
 
var Base64 = { 
    // private property
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
 
    // public method for encoding
    encode : function (input) {
	var output = "";
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i = 0;
 
	input = Base64._utf8_encode(input);
 
	while (i < input.length) {
	    chr1 = input.charCodeAt(i++);
	    chr2 = input.charCodeAt(i++);
	    chr3 = input.charCodeAt(i++);
 
	    enc1 = chr1 >> 2;
	    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
	    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
	    enc4 = chr3 & 63;
 
	    if (isNaN(chr2)) {
		enc3 = enc4 = 64;
	    } else if (isNaN(chr3)) {
		enc4 = 64;
	    }
	    
	    output = output +
		this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
		this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
	    
	}
	
	return output;
    },
    
    // public method for decoding
    decode : function (input) {
	var output = "";
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;
 
	input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
	while (i < input.length) {
	    enc1 = this._keyStr.indexOf(input.charAt(i++));
	    enc2 = this._keyStr.indexOf(input.charAt(i++));
	    enc3 = this._keyStr.indexOf(input.charAt(i++));
	    enc4 = this._keyStr.indexOf(input.charAt(i++));
 
	    chr1 = (enc1 << 2) | (enc2 >> 4);
	    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
	    chr3 = ((enc3 & 3) << 6) | enc4;
 
	    output = output + String.fromCharCode(chr1);
 
	    if (enc3 != 64) {
		output = output + String.fromCharCode(chr2);
	    }
	    if (enc4 != 64) {
		output = output + String.fromCharCode(chr3);
	    }
 
	}
 
	output = Base64._utf8_decode(output);
 
	return output;
 
    },
 
    // private method for UTF-8 encoding
    _utf8_encode : function (string) {
	string = string.replace(/\r\n/g,"\n");
	var utftext = "";
 
	for (var n = 0; n < string.length; n++) {
	    var c = string.charCodeAt(n);
 
	    if (c < 128) {
		utftext += String.fromCharCode(c);
	    } else if((c > 127) && (c < 2048)) {
		utftext += String.fromCharCode((c >> 6) | 192);
		utftext += String.fromCharCode((c & 63) | 128);
	    } else {
		utftext += String.fromCharCode((c >> 12) | 224);
		utftext += String.fromCharCode(((c >> 6) & 63) | 128);
		utftext += String.fromCharCode((c & 63) | 128);
	    }
	}
 
	return utftext;
    },
 
    // private method for UTF-8 decoding
    _utf8_decode : function (utftext) {
	var string = "";
	var i = 0;
	var c = c1 = c2 = 0;
 
	while ( i < utftext.length ) {
 
	    c = utftext.charCodeAt(i);
 
	    if (c < 128) {
		string += String.fromCharCode(c);
		i++;
	    } else if((c > 191) && (c < 224)) {
		c2 = utftext.charCodeAt(i+1);
		string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
		i += 2;
	    } else {
		c2 = utftext.charCodeAt(i+1);
		c3 = utftext.charCodeAt(i+2);
		string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
		i += 3;
	    }
 
	}
 
	return string;
    }
}
