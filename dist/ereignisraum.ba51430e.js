parcelRequire=function(e,r,n,t){var i="function"==typeof parcelRequire&&parcelRequire,o="function"==typeof require&&require;function u(n,t){if(!r[n]){if(!e[n]){var f="function"==typeof parcelRequire&&parcelRequire;if(!t&&f)return f(n,!0);if(i)return i(n,!0);if(o&&"string"==typeof n)return o(n);var c=new Error("Cannot find module '"+n+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[n][1][r]||r},p.cache={};var l=r[n]=new u.Module(n);e[n][0].call(l.exports,p,l,l.exports,this)}return r[n].exports;function p(e){return u(p.resolve(e))}}u.isParcelRequire=!0,u.Module=function(e){this.id=e,this.bundle=u,this.exports={}},u.modules=e,u.cache=r,u.parent=i,u.register=function(r,n){e[r]=[function(e,r){r.exports=n},{}]};for(var f=0;f<n.length;f++)u(n[f]);if(n.length){var c=u(n[n.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=c:"function"==typeof define&&define.amd?define(function(){return c}):t&&(this[t]=c)}return u}({"XqQB":[function(require,module,exports) {

},{"./..\\img\\background_blur.jpg":[["background_blur.a5bc359d.jpg","FY/X"],"FY/X"]}],"ZBnv":[function(require,module,exports) {
function n(n,o){if(!(n instanceof o))throw new TypeError("Cannot call a class as a function")}module.exports=n;
},{}],"No+o":[function(require,module,exports) {
function e(e,r){for(var n=0;n<r.length;n++){var t=r[n];t.enumerable=t.enumerable||!1,t.configurable=!0,"value"in t&&(t.writable=!0),Object.defineProperty(e,t.key,t)}}function r(r,n,t){return n&&e(r.prototype,n),t&&e(r,t),r}module.exports=r;
},{}],"54QH":[function(require,module,exports) {
module.exports={PUBLIC_WFS_URL:"jsp/proxy.jsp",ER_WFS_URL:"jsp/proxy_er.jsp",EPSG_CODE:"EPSG:25832",DETAIL_HOCH:"#A03985F1986E1681E040480A20124127",ERFASSUNG:"#S8ac892a124b8e9f20124c3756edd03f7"};
},{}],"m0KA":[function(require,module,exports) {
"use strict";var e=t(require("@babel/runtime/helpers/classCallCheck")),n=t(require("@babel/runtime/helpers/createClass"));function t(e){return e&&e.__esModule?e:{default:e}}var s=require("./config.json"),a=function(){function t(){(0,e.default)(this,t)}return(0,n.default)(t,null,[{key:"doSoapRequest",value:function(e,n,a){for(var o=arguments.length,r=new Array(o>3?o-3:0),i=3;i<o;i++)r[i-3]=arguments[i];var l=new XMLHttpRequest;l.open("POST",s.PUBLIC_WFS_URL,!0),l.onreadystatechange=function(){4==l.readyState&&(200==l.status?n.apply(void 0,[l.responseXML].concat(r)):null!=a?a.apply(void 0,[l.responseXML].concat(r)):t.showMessage("Kommunikationsfehler",!0))},l.setRequestHeader("Content-Type","text/xml"),l.send(e)}},{key:"addInER",value:function(e,n,a,o,r){for(var i=arguments.length,l=new Array(i>5?i-5:0),c=5;c<i;c++)l[c-5]=arguments[c];var p=new XMLHttpRequest;p.open("POST",s.ER_WFS_URL,!0),p.onreadystatechange=function(){4==p.readyState&&(200==p.status?o.apply(void 0,[p.responseXML].concat(l)):null!=r?r.apply(void 0,[p.responseXML].concat(l)):t.showMessage("Kommunikationsfehler",!0))},p.setRequestHeader("Content-Type","text/xml"),p.send('<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" \nxmlns:pub="http://ttsib.novasib.de/PublicServices" xmlns:int="http://interfaceTypes.ttsib5.novasib.de/">\n<soapenv:Header/>\n<soapenv:Body>\n     <pub:expandProjektAbsObj>\n            <projekt>\n                   <int:ProjektNr>'+a+"</int:ProjektNr>\n            </projekt>\n            <abschnitte>\n                   <int:vonKartenblatt>"+e.vtknr+"</int:vonKartenblatt>\n                   <int:vonNkLfd>"+e.vnklfd+"</int:vonNkLfd>\n                   <int:vonZusatz>"+e.vzusatz+"</int:vonZusatz>\n                   <int:nachKartenblatt>"+e.ntknr+"</int:nachKartenblatt>\n                   <int:nachNkLfd>"+e.nnklfd+"</int:nachNkLfd>\n                   <int:nachZusatz>"+e.nzusatz+"</int:nachZusatz>\n            </abschnitte>\n            <objektKlassen>\n                   <int:objektKlasse>"+n+"</int:objektKlasse>\n            </objektKlassen>\n     </pub:expandProjektAbsObj>\n</soapenv:Body>\n</soapenv:Envelope>")}},{key:"doTransaction",value:function(e,n,s){for(var a='<?xml version="1.0" encoding="ISO-8859-1"?><wfs:Transaction service="WFS" version="1.0.0"\t\txmlns="http://xml.novasib.de"\t\txmlns:wfs="http://www.opengis.net/wfs" \t\txmlns:gml="http://www.opengis.net/gml" \t\txmlns:ogc="http://www.opengis.net/ogc" \t\txmlns:xlink="http://www.w3.org/1999/xlink" \t\txmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" \t\txsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-transaction.xsd">'+e+"</wfs:Transaction>",o=arguments.length,r=new Array(o>3?o-3:0),i=3;i<o;i++)r[i-3]=arguments[i];return t.doSoapRequest.apply(t,[a,this._checkTransacktionSuccess,this._checkTransacktionFailed,n,s].concat(r))}},{key:"_checkTransacktionSuccess",value:function(e,n,s){for(var a=arguments.length,o=new Array(a>3?a-3:0),r=3;r<a;r++)o[r-3]=arguments[r];e.getElementsByTagName("SUCCESS").length>0?null!=n?n.apply(void 0,[e].concat(o)):t.showMessage("Erfolgreich"):null!=s?s.apply(void 0,[e].concat(o)):t.showMessage("Konnte nicht gespeichert werden",!0)}},{key:"_checkTransacktionFailed",value:function(e,n,t){for(var s=arguments.length,a=new Array(s>3?s-3:0),o=3;o<s;o++)a[o-3]=arguments[o];t.apply(void 0,[e].concat(a))}},{key:"doQuery",value:function(e,n,s,a){for(var o='<?xml version="1.0" encoding="ISO-8859-1"?><wfs:GetFeature xmlns="http://xml.novasib.de" xmlns:wfs="http://www.opengis.net/wfs" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" service="WFS" version="1.0.0" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-transaction.xsd"><wfs:Query typeName="'+e+'">'+n+"</wfs:Query></wfs:GetFeature>",r=arguments.length,i=new Array(r>4?r-4:0),l=4;l<r;l++)i[l-4]=arguments[l];return t.doSoapRequest.apply(t,[o,s,a].concat(i))}},{key:"showMessage",value:function(e,n){var t=document.createElement("div");t.className="nachricht",t.innerHTML=e,document.body.appendChild(t);var s=function(){t.style.display="none",document.body.removeChild(t)};n?(t.style.backgroundColor="rgba(255,100,100,0.8)",window.setTimeout(s,3e3)):(t.style.backgroundColor="rgba(100, 200,100,0.8)",window.setTimeout(s,5e3)),t.style.display="block"}}]),t}();module.exports=a;
},{"@babel/runtime/helpers/classCallCheck":"ZBnv","@babel/runtime/helpers/createClass":"No+o","./config.json":"54QH"}],"tTDC":[function(require,module,exports) {
"use strict";require("../css/index.css");var e=t(require("./PublicWFS.js"));function t(e){return e&&e.__esModule?e:{default:e}}window.addEventListener("load",n());var a={},r=document.getElementById("er_select");function n(){e.default.doQuery("Projekt","<Filter><And><PropertyIsEqualTo><PropertyName>status</PropertyName><Literal>1</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>typ</PropertyName><Literal>D</Literal></PropertyIsEqualTo></And></Filter>",l)}function l(e){var t=e.getElementsByTagName("Projekt");r.innerHTML="";for(var n=0;n<t.length;n++){var l=t[n].getAttribute("fid");a[l]={},a[l].nr=t[n].getElementsByTagName("projekt")[0].firstChild.data,t[n].getElementsByTagName("kurzbez").length>0?a[l].kurzbez=t[n].getElementsByTagName("kurzbez")[0].firstChild.data:a[l].kurzbez="",t[n].getElementsByTagName("langbez").length>0?a[l].langbez=t[n].getElementsByTagName("langbez")[0].firstChild.data:a[l].langbez="",a[l].ownerName=t[n].getElementsByTagName("ownerName")[0].firstChild.data,a[l].anlagedat=t[n].getElementsByTagName("anlagedat")[0].firstChild.data}for(var u in a){var i=document.createElement("option"),m=document.createAttribute("value");m.value=u,i.setAttributeNode(m);var o=document.createTextNode(a[u].nr.substr(11)+" - "+a[u].kurzbez);i.appendChild(o),r.appendChild(i)}r.disabled=!1,d()}function d(){var e=a[r.value];document.getElementById("ernr").value=e.nr,document.getElementById("nummer").innerHTML=e.nr,document.getElementById("kurzbez").innerHTML=e.kurzbez,document.getElementById("langbez").innerHTML=e.langbez,document.getElementById("bearbeiter").innerHTML=e.ownerName,document.getElementById("datum").innerHTML=e.anlagedat}r.addEventListener("change",d);
},{"../css/index.css":"XqQB","./PublicWFS.js":"m0KA"}]},{},["tTDC"], null)
//# sourceMappingURL=ereignisraum.ba51430e.map