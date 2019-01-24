var ereignisraum = (new URLSearchParams(window.location.search)).get('er')

var querschnitte = {}

function loadGeometry(abschnittid) {
  var xmlhttp = new XMLHttpRequest();

  xmlhttp.open('GET', 'proxy.jsp?Service=WFS&Request=GetFeature&TypeName=VI_STRASSENNETZ&Filter=<Filter>' +
    '<PropertyIsEqualTo><PropertyName>ABSCHNITT_ID</PropertyName><Literal>' + abschnittid + '</Literal></PropertyIsEqualTo>' +
    '</Filter>', true);

  xmlhttp.onreadystatechange = function() {
    drawGeometry(xmlhttp);
  }
  xmlhttp.setRequestHeader('Content-Type', 'text/xml');
  xmlhttp.send();
}

function drawGeometry(xmlhttp) {
  console.log("drawGeometry()")
  if (xmlhttp.readyState == 4) return;
  if (xmlhttp.status == 200) return;
  
  var netz = xmlhttp.responseXML.getElementsByTagName("VI_STRASSENNETZ")

  for (var i = 0; i < netz.length; i++) {
    var abschnitt = netz[i];
    var gml = abschnitt.getElementsByTagName("gml:coordinates")[0].firstChild.data;
    var len = Number(abschnitt.getElementsByTagName("LEN")[0].firstChild.data);
    var abschnittid = abschnitt.getElementsByTagName("ABSCHNITT_ID")[0].firstChild.data;
    var vnk = abschnitt.getElementsByTagName("VNK")[0].firstChild.data;
    var nnk = abschnitt.getElementsByTagName("NNK")[0].firstChild.data;
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
    var feat = new ol.Feature({
      geometry: geom,
      abschnittid: abschnittid,
      len: len,
      vnk: vnk,
      nnk: nnk
    });
    v_achse.addFeature(feat);
    console.log("ABSCHNITT_ID: " + abschnittid)
  }
}

function getQuerschnitte() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open('GET', 'proxy.jsp?Service=WFS&Request=GetFeature&TypeName=Dotquer&Filter=<Filter>' +
    '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName><Literal>' + ereignisraum + '</Literal></PropertyIsEqualTo></Filter>', true);
  xmlhttp.onreadystatechange = function() {
    readQuerschnitte(xmlhttp);
  }
  xmlhttp.setRequestHeader('Content-Type', 'text/xml');
  xmlhttp.send();
}


function readQuerschnitte(xmlhttp, absId) {
  if (xmlhttp.readyState == 4) return;
  if (xmlhttp.status == 200) return;

  var quer = xmlhttp.responseXML.getElementsByTagName("Dotquer")
  
  for (var i = 0; i < quer.length; i++) {
  
    var absId = quer[i].getElementsByTagName("abschnittId")[0].firstChild.data
    var vst = Number(quer[i].getElementsByTagName("vst")[0].firstChild.data)
    var bst = Number(quer[i].getElementsByTagName("bst")[0].firstChild.data)
    var breite = Number(quer[i].getElementsByTagName("breite")[0].firstChild.data) / 100.
    var bisbreite = Number(quer[i].getElementsByTagName("bisBreite")[0].firstChild.data) / 100.
    var streifen = quer[i].getElementsByTagName("streifen")[0].firstChild.data
    var streifennr = Number(quer[i].getElementsByTagName("streifennr")[0].firstChild.data)
    var art = quer[i].getElementsByTagName("art")[0].getAttribute('luk')
    var artober = quer[i].getElementsByTagName("artober")[0].getAttribute('luk')
    var objektid = quer[i].getElementsByTagName("objektId")[0].firstChild.data
  
    if (!(absId in querschnitte)) {
      querschnitte[absId] = {}
    }
  
    if (!(vst in querschnitte[absId])) {
      querschnitte[absId][vst] = {
        'L': {},
        'R': {},
        'M': {},
        'vst': vst,
        'bst': bst,
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
  
    querschnitte[absId][vst][streifen][streifennr] = {
      'breite': breite,
      'bisbreite': bisbreite,
      'art': art,
      'artober': artober,
      'objektid': objektid,
      'trenn': new ol.Feature({
        geometry: null,
        abschnittsid: absId,
        station: vst,
        streifen: streifen,
        nr: streifennr
      }),
      'flaeche': new ol.Feature({
        geometry: null,
        abschnittsid: absId,
        station: vst,
        streifen: streifen,
        nr: streifennr
      }),
    }
  
    v_quer.addFeature(querschnitte[absId][vst][streifen][streifennr]['flaeche']);
    v_trenn.addFeature(querschnitte[absId][vst][streifen][streifennr]['trenn']);
  
  
  }
  //console.log(querschnitte[absId]);
  
  for (var absId in querschnitte) {
    refreshQuerschnitte(absId)
    loadGeometry(absId)
  }
  
  map.getView().fit(v_quer.getExtent())
}



function refreshQuerschnitte(absId) {
  for (var key in querschnitte[absId]) {
    var von_m_summe = 0
    var bis_m_summe = 0
    for (var i in querschnitte[absId][key]['M']) {
      querschnitte[absId][key]['M'][i]['abs_von1'] = querschnitte[absId][key]['M'][i]['breite'] + von_m_summe
      querschnitte[absId][key]['M'][i]['abs_bis1'] = querschnitte[absId][key]['M'][i]['bisbreite'] + bis_m_summe
      querschnitte[absId][key]['M'][i]['abs_von2'] = -querschnitte[absId][key]['M'][i]['abs_von1']
      querschnitte[absId][key]['M'][i]['abs_bis2'] = -querschnitte[absId][key]['M'][i]['abs_bis1']
      von_m_summe += 0.5 * querschnitte[absId][key]['M'][i]['breite']
      bis_m_summe += 0.5 * querschnitte[absId][key]['M'][i]['bisbreite']
    }

    var von_summe = -von_m_summe
    var bis_summe = -bis_m_summe
    for (var i in querschnitte[absId][key]['L']) {
      querschnitte[absId][key]['L'][i]['abs_von1'] = von_summe
      querschnitte[absId][key]['L'][i]['abs_bis1'] = bis_summe
      von_summe -= querschnitte[absId][key]['L'][i]['breite']
      bis_summe -= querschnitte[absId][key]['L'][i]['bisbreite']
      querschnitte[absId][key]['L'][i]['abs_von2'] = von_summe
      querschnitte[absId][key]['L'][i]['abs_bis2'] = bis_summe
    }

    var von_summe = von_m_summe
    var bis_summe = bis_m_summe
    for (var i in querschnitte[absId][key]['R']) {
      querschnitte[absId][key]['R'][i]['abs_von1'] = von_summe
      querschnitte[absId][key]['R'][i]['abs_bis1'] = bis_summe
      von_summe += querschnitte[absId][key]['R'][i]['breite']
      bis_summe += querschnitte[absId][key]['R'][i]['bisbreite']
      querschnitte[absId][key]['R'][i]['abs_von2'] = von_summe
      querschnitte[absId][key]['R'][i]['abs_bis2'] = bis_summe
    }

    var geo = querschnitte[absId][key]['geo']
    var vec = []
    var seg = []
    var anzahl = geo.length
    if (anzahl >= 2) {
      //console.log(v_einheit(v_lot(v_diff(geo[0], geo[1]))))
      var first = v_einheit(v_lot(v_diff(geo[0], geo[1])))
      vec.push(first)
      for (var i = 1; i < anzahl - 1; i++) {
        vec.push(v_einheit(v_sum(v_diff(geo[i - 1], geo[i]), v_diff(geo[i + 1], geo[i]))))
      }
      vec.push(v_einheit(v_lot(v_diff(geo[anzahl - 2], geo[anzahl - 1]))))


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

    for (var st in {
        'L': 0,
        'M': 0,
        'R': 0
      }) {
      for (var i in querschnitte[absId][key][st]) {
        var streifen = querschnitte[absId][key][st][i]
        var g = [];

        var abst1 = streifen['abs_von1']
        var diff1 = streifen['abs_bis1'] - streifen['abs_von1']
        var abst2 = streifen['abs_von2']
        var diff2 = streifen['abs_bis2'] - streifen['abs_von2']

        for (var j = 0; j < anzahl; j++) {
          g.push(v_sum(geo[j], v_multi(vec[j], seg[j] * diff2 + abst2)));
        }

        querschnitte[absId][key][st][i]['trenn'].setGeometry(new ol.geom.LineString(g))

        for (var j = anzahl - 1; j >= 0; j--) {
          g.push(v_sum(geo[j], v_multi(vec[j], seg[j] * diff1 + abst1)));
        }
        //console.log(seg)
        g.push(g[0])
        querschnitte[absId][key][st][i]['flaeche'].setGeometry(new ol.geom.Polygon([g])) //setCoordinates([g])

      }
    }
  }
}
