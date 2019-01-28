var mod_select, // TrennLinienSelect
  mod_select_fl, // FlächenSelect
  mod_modify, // Bearbeitungsfunktion
  mod_geo_vorher = null, // Speicher für Geo vor der Bearbeitung
  snap_trenn, // Auf Trennlinie einrasten
  snap_station; // Auf Station einrasten


  
  
//////////////////////////
//// MODIFY


mod_select = new ol.interaction.Select({
  layers: [l_trenn],
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(255, 0, 0, 0.5)',
      width: 3
    })
  })
});



mod_select.on('select', function(e) {
  if (e.selected.length == 0)
    return
  logAuswahl(mod_select)
});

mod_select_fl = new ol.interaction.Select({
  layers: [l_quer],
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 0, 0, 0.3)'
    })
  })
});



mod_select_fl.on('select', function(e) {
  if (e.selected.length == 0)
    return
  auswahl = e.selected[0]
  var absid = auswahl.get('abschnittsid')
  var streifen = auswahl.get('streifen')
  var nr = auswahl.get('nr')
  var station = auswahl.get('station')
  mod_select.getFeatures().clear()
  a = querschnitte[absid][station][streifen][nr]['trenn']
  mod_select.getFeatures().push(a)
  logAuswahl(mod_select)
  //mod_select_fl.getFeatures().clear()
});

var mod_modify = new ol.interaction.Modify({
  deleteCondition: ol.events.condition.never,
  insertVertexCondition: ol.events.condition.never,
  features: mod_select.getFeatures()
});

mod_geo_vorher = null;
mod_modify.on('modifystart', function(e) {
  auswahl = e.features.getArray()[0]
  mod_geo_vorher = auswahl.getGeometry().clone()
});

mod_modify.on('modifyend', function(e) {
  console.log(e)
  auswahl = e.features.getArray()[0]

  var absid = auswahl.get('abschnittsid')
  var streifen = auswahl.get('streifen')
  var nr = auswahl.get('nr')
  var station = auswahl.get('station')

  var nachher = auswahl.getGeometry().getCoordinates()
  var vorher = mod_geo_vorher.getCoordinates()

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
  
  logAuswahl(mod_select)
  refreshQuerschnitte(absid)
});



snap_trenn = new ol.interaction.Snap({
  source: v_trenn,
  edge: false
});


snap_station = new ol.interaction.Snap({
  source: v_station,
  pixelTolerance: 50,
  vertex: false
});

snap_achse = new ol.interaction.Snap({
  source: v_achse,
  pixelTolerance: 50,
  vertex: false
});


function startModify() {
	map.addInteraction(mod_select);
	map.addInteraction(mod_select_fl);
	map.addInteraction(mod_modify);
	map.addInteraction(snap_trenn);
	map.addInteraction(snap_station);
}

function stopModify() {
	map.removeInteraction(mod_select);
	map.removeInteraction(mod_select_fl);
	map.removeInteraction(mod_modify);
	map.removeInteraction(snap_trenn);
	map.removeInteraction(snap_station);
}


//////////////////////////
//// DELETE


var del_select = new ol.interaction.Select({
  layers: [l_quer],
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 0, 0, 0.3)'
    })
  })
});

del_select.on('select', function(e) {
  if (e.selected.length == 0) {
	document.forms.loeschen.getElementsByTagName("input")[0].style.backgroundColor = "";
	document.forms.loeschen.getElementsByTagName("input")[0].disabled = true;
    return
  }
  auswahl = e.selected[0]
  var absid = auswahl.get('abschnittsid')
  var streifen = auswahl.get('streifen')
  var nr = auswahl.get('nr')
  var station = auswahl.get('station')

  logAuswahl(del_select)
  document.forms.loeschen.getElementsByTagName("input")[0].style.backgroundColor = "#ff0000";
  document.forms.loeschen.getElementsByTagName("input")[0].disabled = false;
});


function delQuerschnittButton() {
	if (confirm("Möchten Sie den Querschnitt wirklich löschen?")) {
		alert("noch ohne Funktion");
	}
}

function startDelete() {
	document.forms.loeschen.style.display = 'block';
	map.addInteraction(del_select);
}

function stopDelete() {
	document.forms.loeschen.style.display = 'none';
	map.removeInteraction(del_select);
}


//////////////////////////
//// INFO

info_select = new ol.interaction.Select({
  layers: [l_trenn],
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(255, 0, 0, 0.5)',
      width: 3
    })
  })
});

info_select.on('select', function(e) {
  if (e.selected.length == 0)
    return
  logAuswahl(info_select)
});



info_select_fl = new ol.interaction.Select({
  layers: [l_quer],
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 0, 0, 0.3)'
    })
  })
});

info_select_fl.on('select', function(e) {
  if (e.selected.length == 0)
    return
  auswahl = e.selected[0]
  var absid = auswahl.get('abschnittsid')
  var streifen = auswahl.get('streifen')
  var nr = auswahl.get('nr')
  var station = auswahl.get('station')
  info_select.getFeatures().clear()
  a = querschnitte[absid][station][streifen][nr]['trenn']
  info_select.getFeatures().push(a)
  logAuswahl(info_select)
  //mod_select_fl.getFeatures().clear()
});

function startInfo() {
	map.addInteraction(info_select);
	map.addInteraction(info_select_fl);
}

function stopInfo() {
	map.removeInteraction(info_select);
	map.removeInteraction(info_select_fl);
}



//////////////////////////
//// PART

var part_feat = new ol.Feature({geometry: new ol.geom.Point([0,0])});	
v_overlay.addFeature(part_feat);

function part_move(event) {
	//console.log(event);
	part_feat.getGeometry().setCoordinates(event.coordinate);
	var achse = v_achse.getClosestFeatureToCoordinate(event.coordinate);
	if (achse == null) return;
	var p = get_pos(achse.getGeometry().getCoordinates(), event.coordinate);
	//console.log(achse.getGeometry().getCoordinates())
	//console.log(p);
	document.getElementById("teilen_station").value = Math.round(p[2])
	document.getElementById("teilen_abstand").value = Math.round(p[1]*10)/10
}

function partQuerschnittButton() {
	alert("noch ohne Funktion");
}


function startPart() {
	document.forms.teilen.style.display = 'block';
	map.on("pointermove", part_move);
}

function stopPart() {
	document.forms.teilen.style.display = 'none';
	map.un("pointermove", part_move);
	part_feat.getGeometry().setCoordinates([0,0]);
}

//////////////////////////
//// ADD


add_select = new ol.interaction.Select({
  layers: [l_trenn],
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(255, 0, 0, 0.5)',
      width: 5
    })
  })
});

add_select.on('select', function(e) {
  if (e.selected.length == 0) {
	document.forms.hinzu.getElementsByTagName("input")[0].style.backgroundColor = "";
	document.forms.hinzu.getElementsByTagName("input")[0].disabled = true;
    return
  }
  logAuswahl(add_select);
  document.forms.hinzu.getElementsByTagName("input")[0].style.backgroundColor = "#ffcc00";
  document.forms.hinzu.getElementsByTagName("input")[0].disabled = false;
});

function addQuerschnittButton() {
	alert("noch ohne Funktion");
}

function startAdd() {
	document.forms.hinzu.style.display = 'block';
	map.addInteraction(add_select);
}

function stopAdd() {
	document.forms.hinzu.style.display = 'none';
	map.removeInteraction(add_select);
}


//////////////////////////
//// Befehlsteuerung


function befehlChanged(wert) {
	var befehl = document.forms.steuerung.befehl.value
	
	if (befehl == "info") {
		startInfo();
	} else {
		stopInfo();
	}
	
	if (befehl == "modify") {
		startModify();
	} else {
		stopModify();
	}
	
	if (befehl == "delete")
		startDelete();
	else
		stopDelete();
	
	if (befehl == "part")
		startPart();
	else
		stopPart();
	
	if (befehl == "add")
		startAdd();
	else
		stopAdd();
}

befehlChanged(null);



function logAuswahl(selectBefehl) {
  var selection = selectBefehl.getFeatures();
  if (selection.getLength() <= 0) return;
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