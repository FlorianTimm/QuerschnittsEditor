var select, // TrennLinienSelect
  select_fl, // FlächenSelect
  modify, // Bearbeitungsfunktion
  geo_vorher = null, // Speicher für Geo vor der Bearbeitung
  snap_trenn, // Auf Trennlinie einrasten
  snap_station; // Auf Station einrasten


select = new ol.interaction.Select({
  layers: [l_trenn],
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(255, 0, 0, 0.5)',
      width: 3
    })
  })
});
map.addInteraction(select)


select.on('select', function(e) {
  if (e.selected.length == 0)
    return
  logAuswahl()
});

select_fl = new ol.interaction.Select({
  layers: [l_quer],
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 0, 0, 0.3)'
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
  logAuswahl()
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
  
  
  edit_breite(ereignisraum, querschnitte[absid][station][streifen][nr]['objektid'], querschnitte[absid][station][streifen][nr]['breite'], querschnitte[absid][station][streifen][nr]['bisbreite'])
  
  logAuswahl()
  refreshQuerschnitte(absid)
});



function logAuswahl() {
  var selection = select.getFeatures();
  if (select.getFeatures().getLength() <= 0) return;
  var auswahl = selection.item(0);
  var absid = auswahl.get('abschnittsid')
  var streifen = auswahl.get('streifen')
  var nr = auswahl.get('nr')
  var station = auswahl.get('station')

  document.getElementById("info_vnk").innerHTML = abschnitte[absid].get('vnk');
  document.getElementById("info_nnk").innerHTML  = abschnitte[absid].get('nnk');
  document.getElementById("info_station").innerHTML = querschnitte[absid][station]['vst'] + " - " + querschnitte[absid][station]['bst'];
  document.getElementById("info_streifen").innerHTML = streifen + " " + nr;
  
  document.getElementById("info_art").value = querschnitte[absid][station][streifen][nr]['art'];
  document.getElementById("info_ober").value = querschnitte[absid][station][streifen][nr]['artober'];
  
  document.getElementById("info_breite").value = querschnitte[absid][station][streifen][nr]['breite'].toFixed(2);
  document.getElementById("info_bisbreite").value = querschnitte[absid][station][streifen][nr]['bisbreite'].toFixed(2);
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
