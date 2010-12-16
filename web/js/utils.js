
function showLoading() {
    loading_count++;

    var img_div = document.getElementById("loading_img");
    img_div.style.visibility = "visible";
}

function hideLoading() {    
    loading_count--;
    if (loading_count < 1) {
	var img_div = document.getElementById("loading_img");
	img_div.style.visibility = "hidden";
    }
}

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

function createOverlayWindow(id, objs) {
    var dv1 = document.createElement("div");
    dv1.id = id;
    dv1.innerHTML = "";
    dv1.className = "overlayWindow";

    // create white background div 
    // to hold form elements
    var dv2 = document.createElement("div");
    dv2.id = id + "_bg";
    dv2.style.backgroundColor = "white";
    dv2.style.color = "black";
    dv2.style.border = "solid";
    dv2.style.marginTop = "75px";
    dv2.style.marginBottom = "50px";
    dv2.style.marginLeft = "250px";
    dv2.style.marginRight = "250px";
    dv2.style.align = "center";
    // needs to be on top of transparent overlay,
    // but below the zIndex for the combobox
    dv2.zIndex = 51;

    for (i = 0; i < objs.length; i++) {
	dv2.appendChild(objs[i]);
    }

    dv2.appendChild(document.createElement("br"));
    dv2.appendChild(document.createElement("br"));
    dv2.appendChild(document.createElement("br"));
    dv2.appendChild(document.createElement("br"));
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
