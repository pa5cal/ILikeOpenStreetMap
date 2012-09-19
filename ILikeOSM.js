/* Copyright (c) 2012 by Pascal Neis (neis-one.org). 
* Published under the 2-clause BSD license.
* See license.txt in the OpenLayers distribution or 
* repository for the full text of the license.
*/

/**
* @requires OpenLayers/Control.js
* @requires OpenLayers/Events/buttonclick.js
*/

/**
* Class: OpenLayers.ILikeOSM
* Version 1.0 - August 26th, 2012
* By default it is drawn next to the PanZoomBar. 
* The text is updated as the map is zoomed or panned.
*/
OpenLayers.ILikeOSM = OpenLayers.Class(OpenLayers.Control, {
	/**
	* Property: languages
	*/
	languages: {},
	/**
	* Property: defaultlanguage
	*/
	defaultlanguage: 'en',
	
	/**
	* Property: shareMapViews
	*/
	shareMapViews: false,
		
	/**
	* Property: thumbsDiv
	* {DOMElement}
	*/
	thumbsDiv: null,
	/**
	* Property: thumbsTextDiv
	* {DOMElement}
	*/
	thumbsTextDiv: null,
	
	/**
	* Property: counterDiv
	* {DOMElement}
	*/
	counterDiv: null,

	/**
	* Property: shareDiv
	* {DOMElement}
	*/
	shareDiv: null,

    /**
	* Property: buttons
	*/
    buttons: null,

    /**
	* Property: uuid
	*/
    uuid: null,
    
    /**
	* Property: callbackServerRequest
	*/
    callbackServerRequest: null,
    
    /**
	* Property: callbackShareMapView
	*/
    callbackShareMapViews: null,
    
    /**
	* Property: lastQueryTimeStamp
	*/
    lastQueryTimeStamp: null,

    /**
	* Property: sharePopUp
	*/
	sharePopUp: null,
	
    /**
	* Constructor: OpenLayers.ILikeOSM
	*
	* Parameters:
	* element - {DOMElement}
	*
	*/
    initialize: function(element) {    	
		OpenLayers.Control.prototype.initialize.apply(this, arguments);
		//Set UUID
		this.uuid = this.getUUID();
		//Languages / Div-Texts
		this.languages.en = {Like:"I like this map section!",DisLike:"I dislike this map section!",ThumbsText:"for this map section", CounterText:"and You are watching a part of this map section",ShareText:"See where others view the map",MessageText:"If you activate this feature, your current map view is sent to our server and stored in a database; in return, the server can tell you how many other people are looking at the same area. This allows anonymous data collection which can be shared with everyone for statistical analysis and helps us to find out how the OSM map is being used.",CheckboxYesText:"Yes, share my map view",CheckboxNoText:"No, thanks"};
    	this.languages.de = {Like:"Du magst diesen Kartenausschnitt!",DisLike:"Du magst diesen Kartenausschnitt nicht!", ThumbsText:"f&uuml;r diesen Kartenausschnitt",CounterText:"und Du betrachten gerade einen Teil dieser Karte",ShareText:"Wie viele schauen auf die gleiche Karte",MessageText:"Wenn du dieses Feature aktivierst, wird deine derzeitige Kartenansicht an unseren Server gesendet und dort gespeichert. Im Gegenzug bekommst du angezeigt, wie viele andere Leute sich ebenfalls einen Teil deiner Kartenansicht anschauen. Die gesammelten Daten sind f&uuml;r Jeden in einer anonymisierten Form f&uuml;r statistische Analysen verf&uuml;gbar und helfen uns zu erfahren wie die OSM Karte genutzt wird.",CheckboxYesText:"Ja, teile meine Kartenansicht",CheckboxNoText:"Nein, danke"};
    	
    },
    
    /**
	* Method: setMap
	* Set the map property for the control.
	*
	* Parameters:
	* map - {<OpenLayers.Map>}
	*/
    setMap: function(map) {
    	OpenLayers.Control.prototype.setMap.apply(this, arguments);
    	this.map.events.register("buttonclick", this, this.onButtonClick);
    	this.map.events.on({
            'moveend': this.onMapAction,
            'changelayer': this.onMapAction,
            'changebaselayer': this.onMapAction,
            scope: this
        });
    },
    
    /**
	* Method: draw
	*
	* Returns:
	* {DOMElement}
	*/ 
    draw: function(px) {
    	OpenLayers.Control.prototype.draw.apply(this, arguments);
    	
        // Place the thumb-controls
        this.thumbsDiv = document.createElement("div");
        this.thumbsDiv.id = this.id + "_thumbsDiv";
        OpenLayers.Element.addClass(this.thumbsDiv, "thumbsDiv");
        this.buttons = [];
        var sz = {w: 24, h: 24};
   		var px = new OpenLayers.Pixel(5,5);
        this._addButton("Like", "http://ilike.openstreetmap.de/img/Like.png", px, sz);
        this._addButton("DisLike", "http://ilike.openstreetmap.de/img/DisLike.png", px.add(sz.w+2, 2), sz);

		//Add thumbs text
		this.thumbsTextDiv = document.createElement("div");
        this.thumbsTextDiv.id = this.id + "_thumbsTextDiv";
        OpenLayers.Element.addClass(this.thumbsDiv, "_thumbsTextDiv");
        this.thumbsTextDiv.style.marginLeft = (sz.w*2+10)+'px';
        this.thumbsTextDiv.style.marginTop = '3px';
        this.thumbsTextDiv.style.paddingBottom = '10px';
        this.thumbsTextDiv.style.fontSize = '11px';
        this.thumbsTextDiv.style.fontWeight = "bold";
        this.thumbsTextDiv.style.fontFamily = "Verdana";
        this.thumbsTextDiv.innerHTML = this.getTextForLikeDiv('ThumbsText');
        
        // Add counter/share map view text
        this.counterDiv = document.createElement("div");
        this.counterDiv.id = this.id + "_counterDiv";
        OpenLayers.Element.addClass(this.counterDiv, "counterDiv");
		this.counterDiv.style.marginLeft = '5px';
		this.counterDiv.style.fontSize = '11px';
		this.counterDiv.style.fontWeight = "bold";
		this.counterDiv.style.fontFamily = "Verdana";
		
		// Add counter/share map view checkbox
        this.shareDiv = document.createElement("div");
        OpenLayers.Element.addClass(this.shareDiv, "shareDiv olButton");
        this.shareDiv.id = this.id + "_share";
        this.shareDiv.style.fontSize = '11px';
        this.shareDiv.style.fontWeight = "bold";
		this.shareDiv.style.fontFamily = "Verdana";
        this.shareDiv.innerHTML = this.getTextForLikeDiv('ShareText')+"<a href=\"#\"/>?</a>";
        this.shareDiv.title = this.getTextForLikeDiv('ShareText')+"?";
		this.shareDiv.action = "Share";
		        
      	// Try to find our Cookie
       	if(document.cookie != ""){
       		var parts = document.cookie.split(';');
       		for(var i=0 ; i<parts.length ; i++){
       			var keyvalue = parts[i].split('=');
       			if(keyvalue[0] == "sharemapviews" && keyvalue[1] == "false"){
       				this.shareMapViews = false;
       			}
       			else if(keyvalue[0] == "sharemapviews" && keyvalue[1] == "true"){
       				this.shareMapViews = true;
       			}
			}
		}
		if(this.shareMapViews){
			this.shareDiv.style.display = "none";
		}else{
			this.counterDiv.style.display = "none";
		}
        
        //Append Divs
		this.div.appendChild(this.thumbsDiv);
		this.div.appendChild(this.thumbsTextDiv);
        this.div.appendChild(this.counterDiv);
        this.div.appendChild(this.shareDiv);
        
        this.onMapAction();
                
        return this.div; 
    },
    
    _addButton:function(id, img, xy, sz) {
        var imgLocation = img;//OpenLayers.Util.getImageLocation(img);
        var btn = OpenLayers.Util.createAlphaImageDiv(
                                    this.id + "_" + id,
                                    xy, sz, imgLocation, "absolute");
        btn.style.cursor = "pointer";
        //we want to add the outer div
        this.thumbsDiv.appendChild(btn);
        btn.action = id;
        btn.className = "olButton";
        if(id=="Like"){ 
        	btn.title = this.getTextForLikeDiv('Like');
        }
		else { 
			btn.title = this.getTextForLikeDiv('DisLike');
		}
    
        //we want to remember/reference the outer div
        this.buttons.push(btn);
        return btn;
    },
    
    /**
	* Method: onButtonClick
	*
	* Parameters:
	* evt - {Event}
	*/
    onButtonClick: function(evt) {
        var btn = evt.buttonElement;
        switch (btn.action) {
            case "Like":
                this.rateMapSection(btn);
                break;
            case "DisLike":
                this.rateMapSection(btn);
                break;
            case "Share":
            	this.checkShareMapViews(this.setShareMapViews, this);
            	break;
        }
    },

    /**
	* Method: rateMapSection
	*
	* Parameters:
	* like - {Event}
	*/
    rateMapSection: function(btn) {
		if(btn.action=="Like"){ 
			this.thumbsTextDiv.innerHTML = this.getTextForLikeDiv('Like');
		}
		else {
			this.thumbsTextDiv.innerHTML = this.getTextForLikeDiv('DisLike');
		}
		for(var i=0 ; i<this.buttons.length ; i++){ this.buttons[i].style.display = "none"; }
		btn.style.display = "";
		this.sendRequest(btn.action.toLowerCase(), this.updateLikeDivTexts, null);
    },

    /**
	* Method: checkShareMapViews
	*/
	checkShareMapViews: function(callback, iLikeOSM){
		//Create PopUp with message
		if(this.sharePopUp != null){
			this.map.removePopup(this.sharePopUp);
		}
		var sz = new OpenLayers.Size(350,225);
		var pixel = this.map.getPixelFromLonLat(this.map.getCenter());
		pixel.x = pixel.x - sz.w/2;
		pixel.y = pixel.y - sz.h/2;
		var lonlat = this.map.getLonLatFromPixel(pixel);
		OpenLayers.ILikeOSM.callbackShareMapView = function(response) { callback(response, iLikeOSM) };
		this.sharePopUp = new OpenLayers.Popup("iLike OpenStreetMap",
			lonlat, sz, "<span style=\"font-family:Verdana; font-size: 12px;\"><b>I Like OpenStreetMap Feature Plugin</b><br/><br/>"
			+this.getTextForLikeDiv('MessageText')+"<br/><br/>"
			+"<INPUT type=\"button\" value=\""+this.getTextForLikeDiv('CheckboxYesText')+"\" onClick=\"OpenLayers.ILikeOSM.callbackShareMapView('true'); return false;\" name=\"buttonYes\"> <INPUT type=\"button\" value=\""+this.getTextForLikeDiv('CheckboxNoText')+"\" onClick=\"OpenLayers.ILikeOSM.callbackShareMapView('false'); return false;\" name=\"buttonNo\"></span>", true);
    	this.map.addPopup(this.sharePopUp);
	},
	
	/**
	* Method: shareMapViews
	*/
	setShareMapViews: function(share, iLikeOSM){
		if(share == "true"){
			iLikeOSM.shareMapViews = true;
			iLikeOSM.counterDiv.style.display = "";
			iLikeOSM.shareDiv.style.display = "none";
		}
		else{
			iLikeOSM.shareMapViews = false;
			iLikeOSM.counterDiv.style.display = "none";
			iLikeOSM.shareDiv.style.display = "";
			share = "false"
		}
		var a = new Date();
		a = new Date(a.getTime() +1000*60*60*24*365); //One Year
		document.cookie = "sharemapviews="+share+";expires="+a.toGMTString()+";";			
		
		//Close Popup
		if(iLikeOSM.sharePopUp != null){
			iLikeOSM.map.removePopup(iLikeOSM.sharePopUp);
		}
		
		iLikeOSM.onMapAction();
	},

    /**
	* Method: onMapAction
	*/
	onMapAction: function() {
		for(var i=0 ; i<this.buttons.length ; i++){ this.buttons[i].style.display = ""; }
		this.thumbsTextDiv.innerHTML = this.getTextForLikeDiv('ThumbsText');
		//Check if it is allowed to save/share the current map views
		if(this.shareMapViews){
			this.sendRequest("watch", this.updateLikeDivTexts, this);
		}
		//Close Popup
		if(this.sharePopUp != null){
			this.map.removePopup(this.sharePopUp);
		}
    },
    
    /**
	* Method: updateLikeDivTexts
	*/
    updateLikeDivTexts: function(response, iLikeOSM){
    	if(response && iLikeOSM){
   			iLikeOSM.thumbsTextDiv.innerHTML = iLikeOSM.getTextForLikeDiv('ThumbsText');
			OpenLayers.ILikeOSM.callbackShareMapViews = function() { iLikeOSM.checkShareMapViews(iLikeOSM.setShareMapViews, iLikeOSM) };
   			iLikeOSM.counterDiv.innerHTML = response.u+" "+iLikeOSM.getTextForLikeDiv('CounterText')+" (<a href=\"#\" onClick=\"OpenLayers.ILikeOSM.callbackShareMapViews(); return false;\">?</a>)";
    	}
    },
    
    /**
	* Method: getTextForLikeDiv
	*/
    getTextForLikeDiv: function(parameter){
    	var lang = this.defaultlanguage;
    	if(this.languages[lang]){
    		lang = this.defaultlanguage;
    	}else{
    		lang = 'en';
    	}
    	return this.languages[lang][parameter];
    },
    
    /**
	* Method: sendRequest
	*/
    sendRequest: function(status, callback, iLikeOSM){
    	if(this.map.getCenter()){
    		//Check the time of the last request
    		var now = new Date().getTime();
    		if(this.lastQueryTimeStamp != null && this.lastQueryTimeStamp > (now - 2000) && status == "watch"){
    			return;
    		}else {
    			this.lastQueryTimeStamp = now;
    		}
    		
			var center = this.map.getCenter().transform(this.map.getProjection(),new OpenLayers.Projection("EPSG:4326"));
			var extent = this.map.getExtent().transform(this.map.getProjection(),new OpenLayers.Projection("EPSG:4326"));
			extent=extent.left.toFixed(6)+","+extent.bottom.toFixed(6)+","+extent.right.toFixed(6)+","+extent.top.toFixed(6);
			OpenLayers.ILikeOSM.callbackServerRequest = function(response) { callback(response, iLikeOSM); };
			
			// clean DOM
			var jsonp = document.getElementById('jsonp');
			if(jsonp){ document.body.removeChild(jsonp); }
			var jsonp = document.createElement('script');
			jsonp.type = 'text/javascript';
			jsonp.id='jsonp';
			jsonp.src = "http://ilike.openstreetmap.de/query.php?uuid="+this.uuid+"&status="+status+"&map="+encodeURIComponent(this.map.baseLayer.name)+"&zoom="+this.map.getZoom()+"&extent="+extent+"&jsonp=OpenLayers.ILikeOSM.callbackServerRequest";
			document.body.appendChild(jsonp);
    	}
    },
        
    /* 
	 * Copyright 2008, Robert Kieffer
	 * 
	 * This software is made available under the terms of the Open Software License
	 * v3.0 (available here: http://www.opensource.org/licenses/osl-3.0.php )
	 *
	 * The latest version of this file can be found at:
	 * http://www.broofa.com/Tools/randomUUID.js
	 *
	 * For more information, or to comment on this, please go to:
	 * http://www.broofa.com/blog/?p=151
	 */
	/**
	 * Create and return a "version 4" RFC-4122 UUID string.
	 */
    getUUID: function() {
	  var s = [], itoh = '0123456789ABCDEF';
	  // Make array of random hex digits. The UUID only has 32 digits in it, but we
	  // allocate an extra items to make room for the '-'s we'll be inserting.
	  for (var i = 0; i <36; i++) s[i] = Math.floor(Math.random()*0x10);
	  // Conform to RFC-4122, section 4.4
	  s[14] = 4;  // Set 4 high bits of time_high field to version
	  s[19] = (s[19] & 0x3) | 0x8;  // Specify 2 high bits of clock sequence
	  // Convert to hex chars
	  for (var i = 0; i <36; i++) s[i] = itoh[s[i]];
	  // Insert '-'s
	  s[8] = s[13] = s[18] = s[23] = '-';
	  return s.join('');
	},
    
    CLASS_NAME: "OpenLayers.ILikeOSM"
});