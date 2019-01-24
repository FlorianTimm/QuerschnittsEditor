var select, // TrennLinienSelect
  select_fl, // FlächenSelect
  modify, // Bearbeitungsfunktion
  geo_vorher = null, // Speicher für Geo vor der Bearbeitung
  snap_trenn, // Auf Trennlinie einrasten
  snap_station; // Auf Station einrasten


select = new ol.interaction.Select({
  layers: [l_trenn]
});
map.addInteraction(select)


select.on('select', function(e) {
  if (e.selected.length == 0)
    return
  logAuswahl(e.selected[0])
});

select_fl = new ol.interaction.Select({
  layers: [l_quer],
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(128, 128, 255, 0.2)'
    })
  })
});
map.addInteraction(select_fl)


select_fl.on('select', function(e) {
  if (e.selected.length == 0)
    return
  auswahl = e.selected[0]
  var absid = auswahl.get('abschnittsid')
  var streifen = auswahl.get('streifen')
  var nr = auswahl.get('nr')
  var station = auswahl.get('station')
  select.getFeatures().clear()
  a = querschnitte[absid][station][streifen][nr]['trenn']
  select.getFeatures().push(a)
  logAuswahl(a)
  //select_fl.getFeatures().clear()
});

var modify = new ol.interaction.Modify({
  deleteCondition: ol.events.condition.never,
  insertVertexCondition: ol.events.condition.never,
  features: select.getFeatures()
});
map.addInteraction(modify)

geo_vorher = null;
modify.on('modifystart', function(e) {
  auswahl = e.features.getArray()[0]
  geo_vorher = auswahl.getGeometry().clone()
});

modify.on('modifyend', function(e) {
  console.log(e)
  auswahl = e.features.getArray()[0]

  var absid = auswahl.get('abschnittsid')
  var streifen = auswahl.get('streifen')
  var nr = auswahl.get('nr')
  var station = auswahl.get('station')

  var nachher = auswahl.getGeometry().getCoordinates()
  var vorher = geo_vorher.getCoordinates()

  var zuaendern, abst;

  if (nachher[0][0] != vorher[0][0] ||
    nachher[0][1] != vorher[0][1]) {
    zuaendern = 'breite'
    var punkt = querschnitte[absid][station]['geo'][0]
    abst = v_len(v_diff(punkt, nachher[0]))
    abst -= Math.abs(querschnitte[absid][station][streifen][nr]['abs_von1'])

  } else if (nachher[nachher.length - 1][0] != vorher[vorher.length - 1][0] ||
    nachher[nachher.length - 1][1] != vorher[vorher.length - 1][1]) {
    zuaendern = 'bisbreite'
    var punkt = querschnitte[absid][station]['geo'][querschnitte[absid][station]['geo'].length - 1]
    abst = v_len(v_diff(punkt, nachher[nachher.length - 1]))
    abst -= Math.abs(querschnitte[absid][station][streifen][nr]['abs_bis1'])
  }

  if (abst < 0) abst = 0;

  abst = Math.round(abst * 10) / 10
  querschnitte[absid][station][streifen][nr][zuaendern] = abst

  refreshQuerschnitte(absid)
});



function logAuswahl(auswahl) {
  var absid = auswahl.get('abschnittsid')
  var streifen = auswahl.get('streifen')
  var nr = auswahl.get('nr')
  var station = auswahl.get('station')
  console.log(station + streifen + nr)
  console.log(querschnitte[absid][station][streifen][nr])

  querschnitte[absid][station]['linie']
  text = "<table>"
  text += "<tr><td>Streifen:</td><td>"
  text += streifen + nr + "</td></tr>"
  text += "<tr><td>Art:</td><td>"
  text += kt_art[querschnitte[absid][station][streifen][nr]['art']] + "</td></tr>"
  text += "<tr><td>Art der Oberfl&auml;che:</td><td>"
  text += kt_ober[querschnitte[absid][station][streifen][nr]['artober']] + "</td></tr>"
  text += "</table>"
  document.getElementById("info").innerHTML = text


}


snap_trenn = new ol.interaction.Snap({
  source: v_trenn,
  edge: false
});
map.addInteraction(snap_trenn)

snap_station = new ol.interaction.Snap({
  source: v_station,
  pixelTolerance: 50,
  vertex: false
});
map.addInteraction(snap_station)
