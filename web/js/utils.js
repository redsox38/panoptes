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
