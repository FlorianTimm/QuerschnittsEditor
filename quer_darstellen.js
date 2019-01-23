
function machen() {
	vnk = "252500109"
	nnk = "252500110"
	loadGeometry(vnk, nnk)
	getQuerschnitte(vnk, nnk)
}

function loadGeometry(vnk, nnk) {
	var xmlhttp = new XMLHttpRequest();

	if (vnk.length==9 && nnk.length == 10) {
		vnk = vnk+"O";
	}

	xmlhttp.open('GET', 'proxy.jsp?Service=WFS&Request=GetFeature&TypeName=VI_STRASSENNETZ&Filter=<Filter><And>' + 
	'<PropertyIsEqualTo><PropertyName>VNK</PropertyName><Literal>'+vnk+'</Literal></PropertyIsEqualTo>' + 
	'<PropertyIsEqualTo><PropertyName>NNK</PropertyName><Literal>'+nnk+'</Literal></PropertyIsEqualTo>' + 
	'</And></Filter>', true);
	xmlhttp.onreadystatechange = function () {
		drawGeometry(xmlhttp, vnk, nnk);
    }
    xmlhttp.setRequestHeader('Content-Type', 'text/xml');
    xmlhttp.send();
}

function drawGeometry(xmlhttp, vnk, nnk) {
	if (xmlhttp.readyState == 4) {
		if (xmlhttp.status == 200) {
			if (xmlhttp.responseXML.getElementsByTagName("gml:coordinates").length > 0) {
				var gml = xmlhttp.responseXML.getElementsByTagName("gml:coordinates")[0].firstChild.data;
				var len = Number(xmlhttp.responseXML.getElementsByTagName("LEN")[0].firstChild.data);
				var abschnittid = xmlhttp.responseXML.getElementsByTagName("ABSCHNITT_ID")[0].firstChild.data;
				var kp = gml.split(" ");
				var laenge=0;
				var ak = [];
				
				for (var i = 0; i < kp.length; i++) {
					var k = kp[i].split(",")
					var x = Number(k[0]);
					var y = Number(k[1]);
					ak.push([x,y]);
				}
				var len_faktor = l_len(ak) / len;
				var geom = new ol.geom.LineString(ak);
				var feat = new ol.Feature({
					geometry: geom
				});
				v_achse.addFeature(feat);
				console.log("ABSCHNITT_ID: " + abschnittid) 
				getQuerschnitte(abschnittid, len_faktor)
			}
		} else {
			alert("Fehler "+xmlhttp.status+"\n"+xmlhttp.responseXML.getElementsByTagName("faultstring")[0].firstChild.data);
		}
	}
}

function getQuerschnitte(abschnittid, len_faktor) {
	var xmlhttp = new XMLHttpRequest();

	if (vnk.length==9 && nnk.length == 10) {
		vnk = vnk+"O";
	}

	xmlhttp.open('GET', 'proxy.jsp?Service=WFS&Request=GetFeature&TypeName=Dotquer&Filter=<Filter>'+
	'<PropertyIsEqualTo><PropertyName>abschnittId</PropertyName><Literal>'+abschnittid+'</Literal></PropertyIsEqualTo></Filter>', true);
	xmlhttp.onreadystatechange = function () {
		readQuerschnitte(xmlhttp, abschnittid);
    }
    xmlhttp.setRequestHeader('Content-Type', 'text/xml');
    xmlhttp.send();	
}

function sortQuerschnitte(a, b) {
	if (a['nr'] > b['nr']) {
		return 1
	} else if (a['nr'] < b['nr']) {
		return -1
	}
	return 0
}

var quer = []

function readQuerschnitte(xmlhttp, abschnittid) {
	if (xmlhttp.readyState == 4) {
		if (xmlhttp.status == 200) {
			var quer = xmlhttp.responseXML.getElementsByTagName("Dotquer")
			
			querschnitte = {}
			
			for (var i = 0; i < quer.length; i++) {
				
				
				var vst = Number(quer[i].getElementsByTagName("vst")[0].innerHTML)
				var bst = Number(quer[i].getElementsByTagName("bst")[0].innerHTML)
				var breite = Number(quer[i].getElementsByTagName("breite")[0].innerHTML)/100.
				var bisbreite = Number(quer[i].getElementsByTagName("bisBreite")[0].innerHTML)/100.
				var streifen = quer[i].getElementsByTagName("streifen")[0].innerHTML
				var streifennr = Number(quer[i].getElementsByTagName("streifennr")[0].innerHTML)
			
				if (!(vst in querschnitte)) {
					querschnitte[vst] = {}
					querschnitte[vst]['L'] = []
					querschnitte[vst]['R'] = []
					querschnitte[vst]['vst'] = vst
					querschnitte[vst]['bst'] = bst
					querschnitte[vst]['geo'] = []
					gml = quer[i].getElementsByTagName("gml:coordinates")[0].firstChild.data;
					var kp = gml.split(" ");

					for (var j = 0; j < kp.length; j++) {
						var k = kp[j].split(",")
						//console.log(k)
						var x = Number(k[0]);
						var y = Number(k[1]);
						if (x > 0 && y > 0)
							querschnitte[vst]['geo'].push([x,y]);
					}
				}
				
				var d = {'nr': streifennr, 'breite': breite, 'bisbreite':bisbreite}
				if (streifen == 'L') {
					querschnitte[vst]['L'].push(d)
				} else if (streifen == 'R') {
					querschnitte[vst]['R'].push(d)
				} else {
					d['breite'] = d['breite'] / 2
					d['bisbreite'] = d['bisbreite'] / 2
					querschnitte[vst]['R'].push(d)
					querschnitte[vst]['L'].push(d)
				}
			}
			
			for (var key in querschnitte){
				
				querschnitte[key]['L'] = querschnitte[key]['L'].sort(sortQuerschnitte)
				querschnitte[key]['R'] = querschnitte[key]['R'].sort(sortQuerschnitte)
				
				var von_summe = 0
				var bis_summe = 0
				for (var i = 0; i < querschnitte[key]['L'].length; i++) {
					querschnitte[key]['L'][i]['abs_von1'] = von_summe
					querschnitte[key]['L'][i]['abs_bis1'] = bis_summe
					von_summe -= querschnitte[key]['L'][i]['breite']
					bis_summe -= querschnitte[key]['L'][i]['bisbreite']
					querschnitte[key]['L'][i]['abs_von2'] = von_summe
					querschnitte[key]['L'][i]['abs_bis2'] = bis_summe
				}
				
				var von_summe = 0
				var bis_summe = 0
				for (var i = 0; i < querschnitte[key]['R'].length; i++) {
					querschnitte[key]['R'][i]['abs_von1'] = von_summe
					querschnitte[key]['R'][i]['abs_bis1'] = bis_summe
					von_summe += querschnitte[key]['R'][i]['breite']
					bis_summe += querschnitte[key]['R'][i]['bisbreite']
					querschnitte[key]['R'][i]['abs_von2'] = von_summe
					querschnitte[key]['R'][i]['abs_bis2'] = bis_summe
				}
				
				var geo = querschnitte[key]['geo']
				var vec = []
				var seg = []
				var anzahl = geo.length
				if (anzahl >= 2) {
					//console.log(v_einheit(v_lot(v_diff(geo[0], geo[1]))))
					var first = v_einheit(v_lot(v_diff(geo[0], geo[1])))
					vec.push(first)
					for (var i = 1; i < anzahl - 1; i++) {
						vec.push(v_einheit(v_sum(v_diff(geo[i-1], geo[i]), v_diff(geo[i+1], geo[i]))))						
					}
					vec.push(v_einheit(v_lot(v_diff(geo[anzahl-2], geo[anzahl-1]))))
					
					
					var geom = new ol.geom.LineString([v_sum(geo[0], v_multi(first, 30)), v_sum(geo[0], v_multi(first, -30))]);
					var feat = new ol.Feature({
						geometry: geom
					});
					v_station.addFeature(feat);
					
					querschnitte[key]['vec'] = vec
				}
				
				var len = l_len(geo)
				seg.push(0)
				var seg_len_add = 0
				for (var i = 1; i < anzahl; i++) {
					seg_len_add += v_len(v_diff(geo[i-1], geo[i]))
					seg.push(seg_len_add/len)		
					//console.log(seg_len_add/len)
				}
				
				var links = querschnitte[key]['L']
				links = links.concat(querschnitte[key]['R'])
				
				
				for(var i = 0; i < links.length; i++) {
					var streifen = links[i]
					var g = [];
					
					var abst1 = streifen['abs_von1']
					var diff1 = streifen['abs_bis1'] - streifen['abs_von1']
					var abst2 = streifen['abs_von2']
					var diff2 = streifen['abs_bis2'] - streifen['abs_von2']
					
					for (var j = 0; j < anzahl; j++) {
						g.push(v_sum(geo[j], v_multi(vec[j], seg[j] * diff2 + abst2)));
					}
					var gt = new ol.geom.LineString(g);
					var ft = new ol.Feature({
						geometry: gt
					});
					v_trenn.addFeature(ft);
					
					for (var j = anzahl - 1; j >= 0 ; j--) {
						g.push(v_sum(geo[j], v_multi(vec[j], seg[j] * diff1 + abst1)));
					}
					//console.log(seg)
					g.push(g[0])
					
					var geom = new ol.geom.Polygon([g]);
					var feat = new ol.Feature({
						geometry: geom
					});
					v_quer.addFeature(feat);
				}
				
				
			}
			
			console.log(querschnitte);
			
		} else {
			alert("Fehler "+xmlhttp.status+"\n"+xmlhttp.responseXML.getElementsByTagName("faultstring")[0].firstChild.data);
		}
		map.getView().fit(v_achse.getExtent())
	}
}