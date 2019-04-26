// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"css/index.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"./..\\img\\background_blur.jpg":[["background_blur.207f7d7a.jpg","img/background_blur.jpg"],"img/background_blur.jpg"],"_css_loader":"../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../node_modules/@babel/runtime/helpers/classCallCheck.js":[function(require,module,exports) {
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

module.exports = _classCallCheck;
},{}],"../node_modules/@babel/runtime/helpers/createClass.js":[function(require,module,exports) {
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

module.exports = _createClass;
},{}],"js/config.json":[function(require,module,exports) {
module.exports = {
  "PUBLIC_WFS_URL": "jsp/proxy.jsp",
  "ER_WFS_URL": "jsp/proxy_er.jsp?wsdl",
  "ABSCHNITT_WFS_URL": "jsp/abschnittWFS.jsp",
  "EPSG_CODE": "EPSG:25832",
  "DETAIL_HOCH": "#A03985F1986E1681E040480A20124127",
  "ERFASSUNG": "#S8ac892a124b8e9f20124c3756edd03f7",
  "EINZELSCHILD": "AF39068B2A284D9685D8C230848AABB0",
  "BELEUCHTET": "8ac892a124b8e9f20124dd2e3635099d",
  "LAGEFB": "8abeaa946341396401636de8ee162e8b",
  "GROESSE": "E226D4EB52EF4A3C9229F40CD2EEB73E",
  "MPP": 0
};
},{}],"js/PublicWFS.js":[function(require,module,exports) {
"use strict";

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CONFIG = require('./config.json');

var PublicWFS =
/*#__PURE__*/
function () {
  function PublicWFS() {
    (0, _classCallCheck2.default)(this, PublicWFS);
  }

  (0, _createClass2.default)(PublicWFS, null, [{
    key: "doSoapRequest",
    value: function doSoapRequest(xml, callbackSuccess, callbackFailed) {
      for (var _len = arguments.length, args = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        args[_key - 3] = arguments[_key];
      }

      var xmlhttp = new XMLHttpRequest();
      xmlhttp.open('POST', CONFIG.PUBLIC_WFS_URL, true);

      xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState != 4) return;

        if (xmlhttp.status == 200) {
          callbackSuccess.apply(void 0, [xmlhttp.responseXML].concat(args));
        } else {
          if (callbackFailed != undefined) callbackFailed.apply(void 0, [xmlhttp.responseXML].concat(args));else PublicWFS.showMessage("Kommunikationsfehler", true);
        }
      };

      xmlhttp.setRequestHeader('Content-Type', 'text/xml');
      xmlhttp.send(xml);
    }
  }, {
    key: "doGetRequest",
    value: function doGetRequest(url_param, callbackSuccess, callbackFailed) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 3 ? _len2 - 3 : 0), _key2 = 3; _key2 < _len2; _key2++) {
        args[_key2 - 3] = arguments[_key2];
      }

      var xmlhttp = new XMLHttpRequest();
      xmlhttp.open('GET', CONFIG.PUBLIC_WFS_URL + '?' + url_param, true);

      xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState != 4) return;

        if (xmlhttp.status == 200) {
          callbackSuccess.apply(void 0, [xmlhttp.responseXML].concat(args));
        } else {
          if (callbackFailed != undefined) callbackFailed.apply(void 0, [xmlhttp.responseXML].concat(args));else PublicWFS.showMessage("Kommunikationsfehler", true);
        }
      };

      xmlhttp.send();
    }
  }, {
    key: "addInER",
    value: function addInER(abschnitt, objekt, ereignisraum_nr, callbackSuccess, callbackFailed) {
      for (var _len3 = arguments.length, args = new Array(_len3 > 5 ? _len3 - 5 : 0), _key3 = 5; _key3 < _len3; _key3++) {
        args[_key3 - 5] = arguments[_key3];
      }

      var xmlhttp = new XMLHttpRequest();
      xmlhttp.open('POST', CONFIG.ER_WFS_URL, true);

      xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState != 4) return;

        if (xmlhttp.status == 200) {
          abschnitt.inER[objekt] = true;

          if (callbackSuccess != undefined) {
            callbackSuccess.apply(void 0, [xmlhttp.responseXML].concat(args));
          } else {
            PublicWFS.showMessage("Objekt in ER kopiert");
          }
        } else {
          if (callbackFailed != undefined) callbackFailed.apply(void 0, [xmlhttp.responseXML].concat(args));else PublicWFS.showMessage("Objekt konnte nicht in ER kopiert werden", true);
        }
      };

      xmlhttp.setRequestHeader('Content-Type', 'text/xml');
      var xml = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" \n' + 'xmlns:pub="http://ttsib.novasib.de/PublicServices" xmlns:int="http://interfaceTypes.ttsib5.novasib.de/">\n' + '<soapenv:Header/>\n' + '<soapenv:Body>\n' + '     <pub:expandProjektAbsObj>\n' + '            <projekt>\n' + '                   <int:ProjektNr>' + ereignisraum_nr + '</int:ProjektNr>\n' + '            </projekt>\n' + '            <abschnitte>\n' + '                   <int:vonKartenblatt>' + abschnitt.vtknr + '</int:vonKartenblatt>\n' + '                   <int:vonNkLfd>' + abschnitt.vnklfd + '</int:vonNkLfd>\n' + '                   <int:vonZusatz>' + abschnitt.vzusatz + '</int:vonZusatz>\n' + '                   <int:nachKartenblatt>' + abschnitt.ntknr + '</int:nachKartenblatt>\n' + '                   <int:nachNkLfd>' + abschnitt.nnklfd + '</int:nachNkLfd>\n' + '                   <int:nachZusatz>' + abschnitt.nzusatz + '</int:nachZusatz>\n' + '            </abschnitte>\n' + '            <objektKlassen>\n' + '                   <int:objektKlasse>' + objekt + '</int:objektKlasse>\n' + '            </objektKlassen>\n' + '     </pub:expandProjektAbsObj>\n' + '</soapenv:Body>\n' + '</soapenv:Envelope>';
      xmlhttp.send(xml);
    }
  }, {
    key: "addSekInER",
    value: function addSekInER(objektPrim, objektTypePrim, objekt, ereignisraum_nr, callbackSuccess, callbackFailed) {
      for (var _len4 = arguments.length, args = new Array(_len4 > 6 ? _len4 - 6 : 0), _key4 = 6; _key4 < _len4; _key4++) {
        args[_key4 - 6] = arguments[_key4];
      }

      var xmlhttp = new XMLHttpRequest();
      xmlhttp.open('POST', CONFIG.ER_WFS_URL, true);

      xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState != 4) return;

        if (xmlhttp.status == 200) {
          objektPrim.inER[objekt] = true;

          if (callbackSuccess != undefined) {
            callbackSuccess.apply(void 0, [xmlhttp.responseXML].concat(args));
          } else {
            PublicWFS.showMessage("Objekt in ER kopiert");
          }
        } else {
          if (callbackFailed != undefined) callbackFailed.apply(void 0, [xmlhttp.responseXML].concat(args));else PublicWFS.showMessage("Objekt konnte nicht in ER kopiert werden", true);
        }
      };

      xmlhttp.setRequestHeader('Content-Type', 'text/xml');
      var xml = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" \n' + 'xmlns:pub="http://ttsib.novasib.de/PublicServices" xmlns:int="http://interfaceTypes.ttsib5.novasib.de/">\n' + '<soapenv:Header/>\n' + '<soapenv:Body>\n' + '     <pub:expandProjektPrimObj>\n' + '            <projekt>\n' + '                   <int:ProjektNr>' + ereignisraum_nr + '</int:ProjektNr>\n' + '            </projekt>\n' + '            <primObjekte>\n' + '                   <int:objektId>' + objektPrim.objektId + '</int:objektId>\n' + '                   <int:objektKlasse>' + objektTypePrim + '</int:objektKlasse>\n' + '            </primObjekte>\n' + '            <objektKlassen>\n' + '                   <int:objektKlasse>' + objekt + '</int:objektKlasse>\n' + '            </objektKlassen>\n' + '     </pub:expandProjektPrimObj>\n' + '</soapenv:Body>\n' + '</soapenv:Envelope>';
      xmlhttp.send(xml);
    }
  }, {
    key: "doTransaction",
    value: function doTransaction(transaction, callbackSuccess, callbackFailed) {
      var xml = '<?xml version="1.0" encoding="ISO-8859-1"?>' + '<wfs:Transaction service="WFS" version="1.0.0"' + '		xmlns="http://xml.novasib.de"' + '		xmlns:wfs="http://www.opengis.net/wfs" ' + '		xmlns:gml="http://www.opengis.net/gml" ' + '		xmlns:ogc="http://www.opengis.net/ogc" ' + '		xmlns:xlink="http://www.w3.org/1999/xlink" ' + '		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' + '		xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-transaction.xsd">' + transaction + '</wfs:Transaction>';

      for (var _len5 = arguments.length, args = new Array(_len5 > 3 ? _len5 - 3 : 0), _key5 = 3; _key5 < _len5; _key5++) {
        args[_key5 - 3] = arguments[_key5];
      }

      return PublicWFS.doSoapRequest.apply(PublicWFS, [xml, this._checkTransacktionSuccess, this._checkTransacktionFailed, callbackSuccess, callbackFailed].concat(args));
    }
  }, {
    key: "_checkTransacktionSuccess",
    value: function _checkTransacktionSuccess(xml, callbackSuccess, callbackFailed) {
      for (var _len6 = arguments.length, args = new Array(_len6 > 3 ? _len6 - 3 : 0), _key6 = 3; _key6 < _len6; _key6++) {
        args[_key6 - 3] = arguments[_key6];
      }

      if (xml.getElementsByTagName('SUCCESS').length > 0) {
        if (callbackSuccess != undefined) callbackSuccess.apply(void 0, [xml].concat(args));else PublicWFS.showMessage("Erfolgreich");
      } else {
        if (callbackFailed != undefined) callbackFailed.apply(void 0, [xml].concat(args));else PublicWFS.showMessage("Konnte nicht gespeichert werden", true);
      }
    }
  }, {
    key: "_checkTransacktionFailed",
    value: function _checkTransacktionFailed(xml, callbackSuccess, callbackFailed) {
      for (var _len7 = arguments.length, args = new Array(_len7 > 3 ? _len7 - 3 : 0), _key7 = 3; _key7 < _len7; _key7++) {
        args[_key7 - 3] = arguments[_key7];
      }

      callbackFailed.apply(void 0, [xml].concat(args));
    }
  }, {
    key: "doQuery",
    value: function doQuery(klasse, filter, callbackSuccess, callbackFailed) {
      /*var xml = '<?xml version="1.0" encoding="ISO-8859-1"?>' +
          '<wfs:GetFeature xmlns="http://xml.novasib.de" ' +
          'xmlns:wfs="http://www.opengis.net/wfs" ' +
          'xmlns:gml="http://www.opengis.net/gml" ' +
          'xmlns:ogc="http://www.opengis.net/ogc" ' +
          'xmlns:xlink="http://www.w3.org/1999/xlink" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" service="WFS" version="1.0.0" ' +
          'xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-transaction.xsd">' +
          '<wfs:Query typeName="' + klasse + '"><MPP>0</MPP>' +
          filter +
          '</wfs:Query>' +
          '</wfs:GetFeature>';
      return PublicWFS.doSoapRequest(xml, callbackSuccess, callbackFailed, ...args);*/
      var url_param = "Request=GetFeature&TYPENAME=" + klasse + "&MPP=0&filter=" + encodeURIComponent(filter);

      for (var _len8 = arguments.length, args = new Array(_len8 > 4 ? _len8 - 4 : 0), _key8 = 4; _key8 < _len8; _key8++) {
        args[_key8 - 4] = arguments[_key8];
      }

      return PublicWFS.doGetRequest.apply(PublicWFS, [url_param, callbackSuccess, callbackFailed].concat(args));
    }
  }, {
    key: "showMessage",
    value: function showMessage(text, error) {
      var m = document.createElement('div');
      m.className = 'nachricht';
      m.innerHTML = text;
      document.body.appendChild(m);

      var ausblenden = function ausblenden() {
        m.style.display = 'none';
        document.body.removeChild(m);
      };

      if (error) {
        m.style.backgroundColor = 'rgba(255,100,100,0.8)';
        window.setTimeout(ausblenden, 3000);
      } else {
        m.style.backgroundColor = 'rgba(100, 200,100,0.8)';
        window.setTimeout(ausblenden, 5000);
      }

      m.style.display = 'block';
    }
  }]);
  return PublicWFS;
}();

module.exports = PublicWFS;
},{"@babel/runtime/helpers/classCallCheck":"../node_modules/@babel/runtime/helpers/classCallCheck.js","@babel/runtime/helpers/createClass":"../node_modules/@babel/runtime/helpers/createClass.js","./config.json":"js/config.json"}],"js/ereignisraum.js":[function(require,module,exports) {
"use strict";

require("../css/index.css");

var _PublicWFS = _interopRequireDefault(require("./PublicWFS.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.addEventListener('load', loadER());
var er = {};
var select = document.getElementById("er_select");
select.addEventListener("change", aenderung); //?Service=WFS&Request=GetFeature&TypeName=Projekt&Filter=<Filter><PropertyIsEqualTo><PropertyName>status</PropertyName><Literal>1</Literal></PropertyIsEqualTo></Filter>

function loadER() {
  var xml = _PublicWFS.default.doQuery('Projekt', '<Filter><And>' + '<PropertyIsEqualTo><PropertyName>status</PropertyName>' + '<Literal>1</Literal>' + '</PropertyIsEqualTo><PropertyIsEqualTo>' + '<PropertyName>typ</PropertyName>' + '<Literal>D</Literal>' + '</PropertyIsEqualTo>' + '</And></Filter>', readER);
}

function readER(xml) {
  var proj = xml.getElementsByTagName("Projekt");
  select.innerHTML = "";

  for (var i = 0; i < proj.length; i++) {
    var projekt = proj[i].getAttribute("fid");
    er[projekt] = {};
    er[projekt].nr = proj[i].getElementsByTagName("projekt")[0].firstChild.data;
    var kurzbez = proj[i].getElementsByTagName("kurzbez");
    if (kurzbez.length > 0) er[projekt].kurzbez = proj[i].getElementsByTagName("kurzbez")[0].firstChild.data;else er[projekt].kurzbez = "";
    var langbez = proj[i].getElementsByTagName("langbez");
    if (langbez.length > 0) er[projekt].langbez = proj[i].getElementsByTagName("langbez")[0].firstChild.data;else er[projekt].langbez = "";
    er[projekt].ownerName = proj[i].getElementsByTagName("ownerName")[0].firstChild.data;
    er[projekt].anlagedat = proj[i].getElementsByTagName("anlagedat")[0].firstChild.data;
  }
  /*console.log(er);
  er.sort(function (a, b) {
      return Number(a.nr) - Number(b.nr);
  });
  console.log(er);*/


  for (var pid in er) {
    var o = document.createElement('option');
    var v = document.createAttribute("value");
    v.value = pid;
    o.setAttributeNode(v);
    var t = document.createTextNode(er[pid]['nr'].substr(11) + " - " + er[pid]['kurzbez']);
    o.appendChild(t);
    select.appendChild(o);
  } //document.getElementById("platzhalter").remove();


  if (proj.length > 0) {
    aenderung();
    select.disabled = false;
    document.getElementById("submit").disabled = false;
  } else {
    select.innerHTML = '<option id="platzhalter">Keine Ereignisr&auml;ume vorhanden!</option>';
  }
}

function aenderung() {
  var p = er[select.value];
  document.getElementById("ernr").value = p['nr'];
  document.getElementById("nummer").innerHTML = p['nr'];
  document.getElementById("kurzbez").innerHTML = p['kurzbez'];
  document.getElementById("langbez").innerHTML = p['langbez'];
  document.getElementById("bearbeiter").innerHTML = p['ownerName'];
  document.getElementById("datum").innerHTML = p['anlagedat'];
}
},{"../css/index.css":"css/index.css","./PublicWFS.js":"js/PublicWFS.js"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "localhost" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "64144" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else {
        window.location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}],"../node_modules/parcel-bundler/src/builtins/bundle-url.js":[function(require,module,exports) {
var bundleURL = null;

function getBundleURLCached() {
  if (!bundleURL) {
    bundleURL = getBundleURL();
  }

  return bundleURL;
}

function getBundleURL() {
  // Attempt to find the URL of the current script and use that as the base URL
  try {
    throw new Error();
  } catch (err) {
    var matches = ('' + err.stack).match(/(https?|file|ftp|chrome-extension|moz-extension):\/\/[^)\n]+/g);

    if (matches) {
      return getBaseURL(matches[0]);
    }
  }

  return '/';
}

function getBaseURL(url) {
  return ('' + url).replace(/^((?:https?|file|ftp|chrome-extension|moz-extension):\/\/.+)\/[^/]+$/, '$1') + '/';
}

exports.getBundleURL = getBundleURLCached;
exports.getBaseURL = getBaseURL;
},{}],"../node_modules/parcel-bundler/src/builtins/bundle-loader.js":[function(require,module,exports) {
var getBundleURL = require('./bundle-url').getBundleURL;

function loadBundlesLazy(bundles) {
  if (!Array.isArray(bundles)) {
    bundles = [bundles];
  }

  var id = bundles[bundles.length - 1];

  try {
    return Promise.resolve(require(id));
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return new LazyPromise(function (resolve, reject) {
        loadBundles(bundles.slice(0, -1)).then(function () {
          return require(id);
        }).then(resolve, reject);
      });
    }

    throw err;
  }
}

function loadBundles(bundles) {
  return Promise.all(bundles.map(loadBundle));
}

var bundleLoaders = {};

function registerBundleLoader(type, loader) {
  bundleLoaders[type] = loader;
}

module.exports = exports = loadBundlesLazy;
exports.load = loadBundles;
exports.register = registerBundleLoader;
var bundles = {};

function loadBundle(bundle) {
  var id;

  if (Array.isArray(bundle)) {
    id = bundle[1];
    bundle = bundle[0];
  }

  if (bundles[bundle]) {
    return bundles[bundle];
  }

  var type = (bundle.substring(bundle.lastIndexOf('.') + 1, bundle.length) || bundle).toLowerCase();
  var bundleLoader = bundleLoaders[type];

  if (bundleLoader) {
    return bundles[bundle] = bundleLoader(getBundleURL() + bundle).then(function (resolved) {
      if (resolved) {
        module.bundle.register(id, resolved);
      }

      return resolved;
    }).catch(function (e) {
      delete bundles[bundle];
      throw e;
    });
  }
}

function LazyPromise(executor) {
  this.executor = executor;
  this.promise = null;
}

LazyPromise.prototype.then = function (onSuccess, onError) {
  if (this.promise === null) this.promise = new Promise(this.executor);
  return this.promise.then(onSuccess, onError);
};

LazyPromise.prototype.catch = function (onError) {
  if (this.promise === null) this.promise = new Promise(this.executor);
  return this.promise.catch(onError);
};
},{"./bundle-url":"../node_modules/parcel-bundler/src/builtins/bundle-url.js"}],"../node_modules/parcel-bundler/src/builtins/loaders/browser/js-loader.js":[function(require,module,exports) {
module.exports = function loadJSBundle(bundle) {
  return new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.src = bundle;

    script.onerror = function (e) {
      script.onerror = script.onload = null;
      reject(e);
    };

    script.onload = function () {
      script.onerror = script.onload = null;
      resolve();
    };

    document.getElementsByTagName('head')[0].appendChild(script);
  });
};
},{}],0:[function(require,module,exports) {
var b=require("../node_modules/parcel-bundler/src/builtins/bundle-loader.js");b.register("js",require("../node_modules/parcel-bundler/src/builtins/loaders/browser/js-loader.js"));b.load([]).then(function(){require("js/ereignisraum.js");});
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js",0], null)
//# sourceMappingURL=ereignisraum.8eba6ec9.js.map