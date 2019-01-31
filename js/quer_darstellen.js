var ereignisraum = (new URLSearchParams(window.location.search)).get('er');

var querschnitte = {};
var quer_fid = {};
var abschnitte = {};
var test = null;


function loadGeometry(abschnittid) {
  var xmlhttp = new XMLHttpRequest();

  xmlhttp.open('GET', PUBLIC_WFS_URL + '?Service=WFS&Request=GetFeature&TypeName=VI_STRASSENNETZ&Filter=' + encodeURIComponent('<Filter>' +
    '<PropertyIsEqualTo><PropertyName>ABSCHNITT_ID</PropertyName><Literal>' + abschnittid + '</Literal></PropertyIsEqualTo>' +
    '</Filter>'), true);

  xmlhttp.onreadystatechange = function() {
    drawGeometry(xmlhttp);
  }
  xmlhttp.setRequestHeader('Content-Type', 'text/xml');
  xmlhttp.send();
}

function drawGeometry(xmlhttp) {
  console.log("drawGeometry()")
  if (xmlhttp.readyState != 4) return;
  if (xmlhttp.status != 200) return;
  
  var netz = xmlhttp.responseXML.getElementsByTagName("VI_STRASSENNETZ")

  for (var i = 0; i < netz.length; i++) {
    var abschnitt = netz[i];
    var gml = abschnitt.getElementsByTagName("gml:coordinates")[0].firstChild.data;
    var len = Number(abschnitt.getElementsByTagName("LEN")[0].firstChild.data);
    var abschnittid = abschnitt.getElementsByTagName("ABSCHNITT_ID")[0].firstChild.data;
    var vnk = abschnitt.getElementsByTagName("VNP")[0].firstChild.data;
    var nnk = abschnitt.getElementsByTagName("NNP")[0].firstChild.data;
    var kp = gml.split(" ");
    var laenge = 0;
    var ak = [];
	
    for (var i = 0; i < kp.length; i++) {
      var k = kp[i].split(",")
      var x = Number(k[0]);
      var y = Number(k[1]);
      ak.push([x, y]);
    }
    var len_faktor = l_len(ak) / len;
    var geom = new ol.geom.LineString(ak);
    abschnitte[abschnittid] = new ol.Feature({
      geometry: geom,
      abschnittid: abschnittid,
      len: len,
      vnk: vnk,
      nnk: nnk
    });	
    v_achse.addFeature(abschnitte[abschnittid]);
	
	
    console.log("ABSCHNITT_ID: " + abschnittid)
  }
}

function loadAufbaudaten() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open('GET', PUBLIC_WFS_URL + '?Service=WFS&Request=GetFeature&TypeName=Otschicht&Filter=' + encodeURIComponent('<Filter>' +
    '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName><Literal>' + ereignisraum + '</Literal></PropertyIsEqualTo></Filter>'), true);
  xmlhttp.onreadystatechange = function() {
    readAufbaudaten(xmlhttp);
  }
  xmlhttp.setRequestHeader('Content-Type', 'text/xml');
  xmlhttp.send();
}

function readAufbaudaten(xmlhttp) {
	console.log("drawGeometry()")
	if (xmlhttp.readyState != 4) return;
	if (xmlhttp.status != 200) return;
	
	var aufb = xmlhttp.responseXML.getElementsByTagName("Otschicht")
	
	var tags = {
		'vst': 0,
		'bst': 0,
		'teilnr': 0,
		'teilbreite': 0,
		'decksch': 0,
		'baujahr': 0,
		'dicke': 0,
		'baumonat': 0,
		'korngr': 0,
		'unscharf': 0,
		'kennz': 1,
		'art1': 1,
		'art2': 1,
		'art3': 1,
		'artneu': 1,
		'material1': 1,
		'material2': 1,
		'material3': 1,
		'bindemit1': 1,
		'bindemit2': 1,
		'detaila': 1,
		'detailb': 1,
		'detailc': 1,
		'detaild': 1,
		'umweltr': 0,
		'kherk': 1,
		'baujahrGew': 0,
		'abnahmeGew': 0,
		'dauerGew': 0,
		'ablaufGew': 0,
		'objektId': 0,
		'objektnr': 0,
		'erfart': 1,
		'quelle': 1,
		'ADatum': 0,
		'bemerkung': 0,
		'bearbeiter': 0,
		'behoerde': 0,
	}
	
	for (var i = 0; i < aufb.length; i++) {
		var quer = aufb[i].getElementsByTagName("parent")[0].getAttribute('xlink:href').substring(1);
		var nr = Number(aufb[i].getElementsByTagName("schichtnr")[0].firstChild.data);

		if (!(quer in quer_fid)) {
			console.log("Aufbaudaten konnten nicht geladen werden: " + quer);
			showMessage("Aufbaudaten konnten nicht geladen werden: " + quer, true)
			continue
		}
		quer_fid[quer]['aufbau'][nr] = {}

		for (var tag in tags) {
			if (aufb[i].getElementsByTagName(tag).length <= 0) continue;
			if (tags[tag] == 0) {
				// Kein Klartext
				quer_fid[quer]['aufbau'][nr][tag] = aufb[i].getElementsByTagName(tag)[0].firstChild.data;
			} else {
				// Klartext, xlink wird gespeichert
				quer_fid[quer]['aufbau'][nr][tag] = aufb[i].getElementsByTagName(tag)[0].getAttribute('xlink:href');
			}
		}
	}
	
	
}

function getQuerschnitte() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open('GET', PUBLIC_WFS_URL + '?Service=WFS&Request=GetFeature&TypeName=Dotquer&Filter=' + encodeURIComponent('<Filter>' +
    '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName><Literal>' + ereignisraum + '</Literal></PropertyIsEqualTo></Filter>'), true);
  xmlhttp.onreadystatechange = function() {
    readQuerschnitte(xmlhttp);
  }
  xmlhttp.setRequestHeader('Content-Type', 'text/xml');
  xmlhttp.send();
}


function readQuerschnitte(xmlhttp) {
  if (xmlhttp.readyState != 4) return;
  if (xmlhttp.status != 200) return;

  var quer = xmlhttp.responseXML.getElementsByTagName("Dotquer")
  
  	var tags = {
		'art': 3,
		'artober': 3,
		'breite': 1,
		'bisBreite': 1,
		'blpart': 2,
		'blpart3': 2,
		'uipart': 2,
		'uipart3': 2,
		'XVstL': 1,
		'XVstR': 1,
		'XBstL': 1,
		'XBstR': 1,
		'kherk': 2,
		'baujahrGew': 0,
		'abnahmeGew': 0,
		'dauerGew': 0,
		'ablaufGew': 0,
		'objektId': 0,
		'objektnr': 0,
		'erfart': 2,
		'quelle': 2,
		'ADatum': 0,
		'bemerkung': 0,
		'bearbeiter': 0,
		'behoerde': 0,
	}
  
  for (var i = 0; i < quer.length; i++) {
  
    var absId = quer[i].getElementsByTagName("abschnittId")[0].firstChild.data
    var vst = Number(quer[i].getElementsByTagName("vst")[0].firstChild.data)
	var streifen = quer[i].getElementsByTagName("streifen")[0].firstChild.data
	var streifennr = Number(quer[i].getElementsByTagName("streifennr")[0].firstChild.data)
	
	// Abschnitt anlegen, falls er nicht existiert
	if (!(absId in querschnitte)) {
      querschnitte[absId] = {}
    }
	
    // Station anlegen, falls sie nicht existiert
    if (!(vst in querschnitte[absId])) {
      querschnitte[absId][vst] = {
        'streifen': {
			'L': {},
			'R': {},
			'M': {}},
        'vst': vst,
        'bst': Number(quer[i].getElementsByTagName("bst")[0].firstChild.data),
        'geo': []
      }
      gml = quer[i].getElementsByTagName("gml:coordinates")[0].firstChild.data;
      var kp = gml.split(" ");
  
      for (var j = 0; j < kp.length; j++) {
        var k = kp[j].split(",")
        //console.log(k)
        var x = Number(k[0]);
        var y = Number(k[1]);
        if (x > 0 && y > 0)
          querschnitte[absId][vst]['geo'].push([x, y]);
      }
    }
	
	querschnitte[absId][vst]['streifen'][streifen][streifennr] = {}
	
	// Attribute füllen
	for (var tag in tags) {
		if (quer[i].getElementsByTagName(tag).length <= 0) continue;
		if (tags[tag] == 0) {
			// Kein Klartext
			querschnitte[absId][vst]['streifen'][streifen][streifennr][tag] = quer[i].getElementsByTagName(tag)[0].firstChild.data;
		} else if (tags[tag] == 1) {
			// Kein Klartext
			querschnitte[absId][vst]['streifen'][streifen][streifennr][tag] = Number(quer[i].getElementsByTagName(tag)[0].firstChild.data);
		} else if (tags[tag] == 2) {
			// Klartext, xlink wird gespeichert
			querschnitte[absId][vst]['streifen'][streifen][streifennr][tag] = quer[i].getElementsByTagName(tag)[0].getAttribute('xlink:href');
		} else if (tags[tag] == 3) {
			// Klartext, luk gespeichert
			querschnitte[absId][vst]['streifen'][streifen][streifennr][tag] = quer[i].getElementsByTagName(tag)[0].getAttribute('luk');
		}
	}
  
    querschnitte[absId][vst]['streifen'][streifen][streifennr]['trenn'] = 
		new ol.Feature({
			geometry: null,
			abschnittsid: absId,
			station: vst,
			streifen: streifen,
			nr: streifennr
		  });
      querschnitte[absId][vst]['streifen'][streifen][streifennr]['flaeche'] = 
		new ol.Feature({
			geometry: null,
			abschnittsid: absId,
			station: vst,
			streifen: streifen,
			nr: streifennr,
			//art: querschnitte[absId][vst]['streifen'][streifen][streifennr]['art']
		  });
		  
	  querschnitte[absId][vst]['streifen'][streifen][streifennr]['aufbau'] = {};
	
	quer_fid[quer[i].getAttribute('fid')] = querschnitte[absId][vst]['streifen'][streifen][streifennr];
  
    v_quer.addFeature(querschnitte[absId][vst]['streifen'][streifen][streifennr]['flaeche']);
    v_trenn.addFeature(querschnitte[absId][vst]['streifen'][streifen][streifennr]['trenn']);
  
  
  }
  console.log(querschnitte[absId]);
  
  for (var absId in querschnitte) {
	calcVec(absId);
    refreshQuerschnitte(absId)
    loadGeometry(absId)
  }
  
  map.getView().fit(v_quer.getExtent())
  loadAufbaudaten();
}




function calcVec(absId) {
  for (var key in querschnitte[absId]) {
    var geo = querschnitte[absId][key]['geo']
    var vec = []
    var seg = []

    var anzahl = geo.length
    if (anzahl >= 2) {
		
	  var first = v_einheit(v_lot(v_diff(geo[0], geo[1])))
	  //var first = v_azi2vec(v_azi(geo[0], geo[1]) - 0.5 * Math.PI ) 
      vec.push(first)
      for (var i = 1; i < anzahl - 1; i++) {
		  
		//vec.push(v_azi2vec((v_azi(geo[i-1], geo[i]) + v_azi(geo[i], geo[i+1])  - Math.PI) / 2.) )
		vec.push(v_einheit(v_lot(v_sum(v_einheit(v_diff(geo[i-1], geo[i])), v_einheit(v_diff(geo[i], geo[i+1]))))))
      }
      //vec.push(v_azi2vec(v_azi(geo[anzahl-2], geo[anzahl-1]) - 0.5 * Math.PI ) )
	  vec.push(v_einheit(v_lot(v_diff(geo[anzahl-2], geo[anzahl-1]))));
	  


      querschnitte[absId][key]['linie'] = new ol.geom.LineString([v_sum(geo[0], v_multi(first, 30)), v_sum(geo[0], v_multi(first, -30))]);
      var feat = new ol.Feature({
        geometry: querschnitte[absId][key]['linie'],
        station: key
      });
      v_station.addFeature(feat);

      querschnitte[absId][key]['vec'] = vec

    }

    var len = l_len(geo)
    seg.push(0)
    var seg_len_add = 0
    for (var i = 1; i < anzahl; i++) {
      seg_len_add += v_len(v_diff(geo[i - 1], geo[i]))
      seg.push(seg_len_add / len)
      //console.log(seg_len_add/len)
    }
	querschnitte[absId][key]['seg'] = seg;
  }
}
	
function refreshQuerschnitte(absId) {
  for (var key in querschnitte[absId]) {
	var geo = querschnitte[absId][key]['geo']
	var vec = querschnitte[absId][key]['vec'];
	var seg = querschnitte[absId][key]['seg']
	var anzahl = geo.length;
	
    for (var st in querschnitte[absId][key]['streifen']) {
      for (var i in querschnitte[absId][key]['streifen'][st]) {
        var streifen = querschnitte[absId][key]['streifen'][st][i]
        var g = [];
		var l = [];
		var r = [];

        var abst1 = streifen['XVstR']
        var diff1 = streifen['XBstR'] - abst1
        var abst2 = streifen['XVstL']
        var diff2 = streifen['XBstL'] - abst2
		
		//console.log(diff1)

        for (var j = 0; j < anzahl; j++) {
			var coord = v_sum(geo[j], v_multi(vec[j], seg[j] * diff2 + abst2));
			g.push(coord);
			l.push(coord);
        }

        querschnitte[absId][key]['streifen'][st][i]['trenn'].setGeometry(new ol.geom.MultiLineString([g]))

        for (var j = anzahl - 1; j >= 0; j--) {
			var coord = v_sum(geo[j], v_multi(vec[j], seg[j] * diff1 + abst1));
			g.push(coord);
			r.unshift(coord);
        }
		
		if (st == "L") querschnitte[absId][key]['streifen'][st][i]['trenn'].setGeometry(new ol.geom.MultiLineString([l]))
		else if (st == "R")	querschnitte[absId][key]['streifen'][st][i]['trenn'].setGeometry(new ol.geom.MultiLineString([r]))
		else			querschnitte[absId][key]['streifen'][st][i]['trenn'].setGeometry(new ol.geom.MultiLineString([l, r]))

        g.push(g[0])
        querschnitte[absId][key]['streifen'][st][i]['flaeche'].setGeometry(new ol.geom.Polygon([g])) //setCoordinates([g])

      }
    }
  }
}
