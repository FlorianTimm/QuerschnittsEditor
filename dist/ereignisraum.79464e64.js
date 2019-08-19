parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"54QH":[function(require,module,exports) {
module.exports={PUBLIC_WFS_URL:"jsp/proxy.jsp",ER_WFS_URL:"jsp/proxy_er.jsp?wsdl",ABSCHNITT_WFS_URL:"jsp/abschnittWFS.jsp",EPSG_CODE:"EPSG:25832",DETAIL_HOCH:"#A03985F1986E1681E040480A20124127",ERFASSUNG:"#S8ac892a124b8e9f20124c3756edd03f7",EINZELSCHILD:"AF39068B2A284D9685D8C230848AABB0",BELEUCHTET:"8ac892a124b8e9f20124dd2e3635099d",LAGEFB:"8abeaa946341396401636de8ee162e8b",GROESSE:"E226D4EB52EF4A3C9229F40CD2EEB73E",STRASSENBEZUG:"A03985F204311681E040480A20124127",MPP:0};
},{}],"SZ9g":[function(require,module,exports) {
"use strict";exports.__esModule=!0;var e=require("./config.json"),n=function(){function n(){}return n.doSoapRequest=function(t,o,s){for(var a=[],i=3;i<arguments.length;i++)a[i-3]=arguments[i];var r=new XMLHttpRequest;r.open("POST",e.PUBLIC_WFS_URL,!0),r.onreadystatechange=function(){4==r.readyState&&(200==r.status?o.apply(void 0,[r.responseXML].concat(a)):null!=s?s.apply(void 0,[r.responseXML].concat(a)):n.showMessage("Kommunikationsfehler",!0))},r.setRequestHeader("Content-Type","text/xml; charset=ISO-8859-1"),r.send(t)},n.doGetRequest=function(t,o,s){for(var a=[],i=3;i<arguments.length;i++)a[i-3]=arguments[i];var r=new XMLHttpRequest;r.open("GET",e.PUBLIC_WFS_URL+"?"+t,!0),r.onreadystatechange=function(){4==r.readyState&&(200==r.status?o.apply(void 0,[r.responseXML].concat(a)):null!=s?s.apply(void 0,[r.responseXML].concat(a)):n.showMessage("Kommunikationsfehler",!0))},r.send()},n.addInER=function(t,o,s,a,i){for(var r=[],p=5;p<arguments.length;p++)r[p-5]=arguments[p];var c=new XMLHttpRequest;c.open("POST",e.ER_WFS_URL,!0),c.onreadystatechange=function(){4==c.readyState&&(200==c.status?(t.inER[o]=!0,null!=a?a.apply(void 0,[c.responseXML].concat(r)):n.showMessage("Objekt in ER kopiert")):null!=i?i.apply(void 0,[c.responseXML].concat(r)):n.showMessage("Objekt konnte nicht in ER kopiert werden",!0))},c.setRequestHeader("Content-Type","text/xml");var l='<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" \nxmlns:pub="http://ttsib.novasib.de/PublicServices" xmlns:int="http://interfaceTypes.ttsib5.novasib.de/">\n<soapenv:Header/>\n<soapenv:Body>\n     <pub:expandProjektAbsObj>\n            <projekt>\n                   <int:ProjektNr>'+s+"</int:ProjektNr>\n            </projekt>\n            <abschnitte>\n                   <int:vonKartenblatt>"+t.vtknr+"</int:vonKartenblatt>\n                   <int:vonNkLfd>"+t.vnklfd+"</int:vonNkLfd>\n                   <int:vonZusatz>"+t.vzusatz+"</int:vonZusatz>\n                   <int:nachKartenblatt>"+t.ntknr+"</int:nachKartenblatt>\n                   <int:nachNkLfd>"+t.nnklfd+"</int:nachNkLfd>\n                   <int:nachZusatz>"+t.nzusatz+"</int:nachZusatz>\n            </abschnitte>\n            <objektKlassen>\n                   <int:objektKlasse>"+o+"</int:objektKlasse>\n            </objektKlassen>\n     </pub:expandProjektAbsObj>\n</soapenv:Body>\n</soapenv:Envelope>";c.send(l)},n.addSekInER=function(t,o,s,a,i,r){for(var p=[],c=6;c<arguments.length;c++)p[c-6]=arguments[c];var l=new XMLHttpRequest;l.open("POST",e.ER_WFS_URL,!0),l.onreadystatechange=function(){4==l.readyState&&(200==l.status?(t.inER[s]=!0,null!=i?i.apply(void 0,[l.responseXML].concat(p)):n.showMessage("Objekt in ER kopiert")):null!=r?r.apply(void 0,[l.responseXML].concat(p)):n.showMessage("Objekt konnte nicht in ER kopiert werden",!0))},l.setRequestHeader("Content-Type","text/xml");var d='<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" \nxmlns:pub="http://ttsib.novasib.de/PublicServices" xmlns:int="http://interfaceTypes.ttsib5.novasib.de/">\n<soapenv:Header/>\n<soapenv:Body>\n     <pub:expandProjektPrimObj>\n            <projekt>\n                   <int:ProjektNr>'+a+"</int:ProjektNr>\n            </projekt>\n            <primObjekte>\n                   <int:objektId>"+t.objektId+"</int:objektId>\n                   <int:objektKlasse>"+o+"</int:objektKlasse>\n            </primObjekte>\n            <objektKlassen>\n                   <int:objektKlasse>"+s+"</int:objektKlasse>\n            </objektKlassen>\n     </pub:expandProjektPrimObj>\n</soapenv:Body>\n</soapenv:Envelope>";l.send(d)},n.doTransaction=function(e,t,o){for(var s=[],a=3;a<arguments.length;a++)s[a-3]=arguments[a];var i='<?xml version="1.0" encoding="ISO-8859-1"?><wfs:Transaction service="WFS" version="1.0.0"\t\txmlns="http://xml.novasib.de"\t\txmlns:wfs="http://www.opengis.net/wfs" \t\txmlns:gml="http://www.opengis.net/gml" \t\txmlns:ogc="http://www.opengis.net/ogc" \t\txmlns:xlink="http://www.w3.org/1999/xlink" \t\txmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" \t\txsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-transaction.xsd">'+e+"</wfs:Transaction>";return n.doSoapRequest.apply(n,[i,this._checkTransacktionSuccess,this._checkTransacktionFailed,t,o].concat(s))},n._checkTransacktionSuccess=function(e,t,o){for(var s=[],a=3;a<arguments.length;a++)s[a-3]=arguments[a];e.getElementsByTagName("SUCCESS").length>0?null!=t?t.apply(void 0,[e].concat(s)):n.showMessage("Erfolgreich"):null!=o?o.apply(void 0,[e].concat(s)):n.showMessage("Konnte nicht gespeichert werden",!0)},n._checkTransacktionFailed=function(e,n,t){for(var o=[],s=3;s<arguments.length;s++)o[s-3]=arguments[s];t.apply(void 0,[e].concat(o))},n.doQuery=function(e,t,o,s){for(var a=[],i=4;i<arguments.length;i++)a[i-4]=arguments[i];var r="Request=GetFeature&TYPENAME="+e+"&MPP=0&filter="+encodeURIComponent(t);return n.doGetRequest.apply(n,[r,o,s].concat(a))},n.showMessage=function(e,n){void 0===n&&(n=!1);var t=document.createElement("div");t.className="nachricht",t.innerHTML=e,document.body.appendChild(t);var o=function(){t.style.display="none",document.body.removeChild(t)};n?(t.style.backgroundColor="rgba(255,100,100,0.8)",window.setTimeout(o,3e3)):(t.style.backgroundColor="rgba(100, 200,100,0.8)",window.setTimeout(o,5e3)),t.style.display="block"},n}();exports.default=n;
},{"./config.json":"54QH"}],"ZfQ7":[function(require,module,exports) {
"use strict";var e=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};exports.__esModule=!0;var t=e(require("./PublicWFS"));window.addEventListener("load",a);var n=[],r=document.getElementById("er_select");function a(){t.default.doQuery("Projekt","<Filter><And><PropertyIsEqualTo><PropertyName>status</PropertyName><Literal>1</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>typ</PropertyName><Literal>D</Literal></PropertyIsEqualTo></And></Filter>",l)}function l(e){var t=e.getElementsByTagName("Projekt");r.innerHTML="";for(var a=0;a<t.length;a++){(d={fid:null,nr:null,kurzbez:"",langbez:"",ownerName:"",anlagedat:null}).fid=t[a].getAttribute("fid"),d.nr=parseInt(t[a].getElementsByTagName("projekt")[0].firstChild.textContent),t[a].getElementsByTagName("kurzbez").length>0?d.kurzbez=t[a].getElementsByTagName("kurzbez")[0].firstChild.textContent:d.kurzbez="",t[a].getElementsByTagName("langbez").length>0?d.langbez=t[a].getElementsByTagName("langbez")[0].firstChild.textContent:d.langbez="",d.ownerName=t[a].getElementsByTagName("ownerName")[0].firstChild.textContent,d.anlagedat=t[a].getElementsByTagName("anlagedat")[0].firstChild.textContent,n.push(d)}console.log(n),n.sort(function(e,t){return Number(e.nr)-Number(t.nr)}),console.log(n);for(var l=0,i=n;l<i.length;l++){var d=i[l],u=document.createElement("option"),m=document.createAttribute("value");m.value=d.fid,u.setAttributeNode(m);var g=document.createTextNode(String(d.nr).substr(11)+" - "+d.kurzbez);u.appendChild(g),r.appendChild(u)}t.length>0?(o(),r.disabled=!1,document.getElementById("submit").disabled=!1):r.innerHTML='<option id="platzhalter">Keine Ereignisr&auml;ume vorhanden!</option>'}function o(){for(var e=0,t=n;e<t.length;e++){var a=t[e];if(a.fid==r.value){document.getElementById("ernr").value=a.nr,document.getElementById("nummer").innerHTML=a.nr,document.getElementById("kurzbez").innerHTML=a.kurzbez,document.getElementById("langbez").innerHTML=a.langbez,document.getElementById("bearbeiter").innerHTML=a.ownerName,document.getElementById("datum").innerHTML=a.anlagedat;break}}}r.addEventListener("change",o);
},{"./PublicWFS":"SZ9g"}]},{},["ZfQ7"], null)
//# sourceMappingURL=ereignisraum.79464e64.js.map