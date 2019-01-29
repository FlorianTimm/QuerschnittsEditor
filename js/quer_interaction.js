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
	mod_select.getFeatures().clear()
	if (e.selected.length > 0) {
		auswahl = e.selected[0]
		var absid = auswahl.get('abschnittsid')
		var streifen = auswahl.get('streifen')
		var nr = auswahl.get('nr')
		var station = auswahl.get('station')
		a = querschnitte[absid][station][streifen][nr]['trenn']
		mod_select.getFeatures().push(a)
	}
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
  
  if (document.forms.modify.typ.value == "move") { 
	querschnitte[absid][station][streifen][nr][zuaendern] = abst
	edit_breite(ereignisraum, querschnitte[absid][station][streifen][nr]['objektid'], querschnitte[absid][station][streifen][nr]['breite'], querschnitte[absid][station][streifen][nr]['bisbreite'])
  } else {
	  diff = querschnitte[absid][station][streifen][nr][zuaendern] - abst;
	querschnitte[absid][station][streifen][nr][zuaendern] = abst
	edit_breite(ereignisraum, querschnitte[absid][station][streifen][nr]['objektid'], querschnitte[absid][station][streifen][nr]['breite'], querschnitte[absid][station][streifen][nr]['bisbreite'])
	if (streifen != "M" && (nr + 1) in querschnitte[absid][station][streifen]) {
		querschnitte[absid][station][streifen][nr+1][zuaendern] += diff;
		edit_breite(ereignisraum, querschnitte[absid][station][streifen][nr+1]['objektid'], querschnitte[absid][station][streifen][nr+1]['breite'], querschnitte[absid][station][streifen][nr+1]['bisbreite'])
	}
  }
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
	document.forms.modify.style.display = "block";
	map.addInteraction(mod_select);
	map.addInteraction(mod_select_fl);
	map.addInteraction(mod_modify);
	map.addInteraction(snap_trenn);
	map.addInteraction(snap_station);
	
	document.getElementById("info_art").disabled = "";
	document.getElementById("info_ober").disabled = "";
	document.getElementById("info_breite").disabled = "";
	document.getElementById("info_bisbreite").disabled = "";
}

function stopModify() {
	document.forms.modify.style.display = "none";
	map.removeInteraction(mod_select);
	map.removeInteraction(mod_select_fl);
	map.removeInteraction(mod_modify);
	map.removeInteraction(snap_trenn);
	map.removeInteraction(snap_station);
	
	document.getElementById("info_art").disabled = "disabled";
	document.getElementById("info_ober").disabled = "disabled";
	document.getElementById("info_breite").disabled = "disabled";
	document.getElementById("info_bisbreite").disabled = "disabled";
	
	document.forms.info.style.display = "none";
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
	document.forms.info.style.display = "none";
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
	info_select.getFeatures().clear()
	if (e.selected.length > 0) {
		auswahl = e.selected[0]
		var absid = auswahl.get('abschnittsid')
		var streifen = auswahl.get('streifen')
		var nr = auswahl.get('nr')
		var station = auswahl.get('station')
		a = querschnitte[absid][station][streifen][nr]['trenn']
		info_select.getFeatures().push(a)
	}
	logAuswahl(info_select)
});

function startInfo() {
	map.addInteraction(info_select);
	map.addInteraction(info_select_fl);
}

function stopInfo() {
	map.removeInteraction(info_select);
	map.removeInteraction(info_select_fl);
	document.forms.info.style.display = "none";
}



//////////////////////////
//// PART


part_select = new ol.interaction.Select({
  layers: [l_achse],
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(0, 50, 255, 0.5)',
      width: 5
    })
  })
});


var part_feat = new ol.Feature({geometry: new ol.geom.Point([0,0])});
part_feat.setStyle(
	new ol.style.Style({
		image: new ol.style.Circle({
			radius: 3,
			fill: new ol.style.Fill({color: [0,0,200],}),
			stroke: new ol.style.Stroke({
			  color: [0,0,200], width: 2
			})
		}),
	})
)	
v_overlay.addFeature(part_feat);

var part_neu = new ol.Feature({
	geometry: new ol.geom.LineString([[0,0][0,0]]),
	isset: false,
	abschnittid: null,
	station: 0,	
});
part_neu.setStyle(
	new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: 'rgba(255, 0, 0, 1)',
			width: 2
		}),
	})
);
v_overlay.addFeature(part_neu);

var part_line = new ol.Feature({geometry: new ol.geom.LineString([[0,0][0,0]])});	
part_line.setStyle(
	new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: 'rgba(0, 0, 255, 0.5)',
			width: 2
		}),
	})
);
v_overlay.addFeature(part_line);

function part_get_station(event) {
	var achse = null;
	if (part_select.getFeatures().getArray().length > 0) {
		achse = part_select.getFeatures().item(0);
	} else {
		achse = v_achse.getClosestFeatureToCoordinate(event.coordinate);
	}
	
	if (achse == null) {
		part_feat.getGeometry().setCoordinates([0,0]);
		part_line.getGeometry().setCoordinates([[0,0],[0,0]]);
		return null;
	}
	
	return {achse: achse, pos: get_pos(achse.getGeometry().getCoordinates(), event.coordinate)};
}


function part_click (event) {
	if (!part_neu.get('isset')) {
		part_neu.set('isset', true);
		var daten = part_get_station(event);
		if (daten['pos']==null) return;
		
		var vektor = v_multi(v_einheit(v_diff(daten['pos'][6],daten['pos'][5])), 50);
		var coord = [v_diff(daten['pos'][5], vektor), v_sum(daten['pos'][5], vektor)];
		
		part_neu.getGeometry().setCoordinates(coord);
		part_neu.set("abschnittid", daten['achse'].get('abschnittid'));
		part_neu.set("station", Math.round(daten['pos'][2]));
		
		
		document.getElementById("teilen_vnk").innerHTML = daten['achse'].get('vnk')
		document.getElementById("teilen_nnk").innerHTML = daten['achse'].get('nnk')
		document.getElementById("teilen_station").innerHTML = Math.round(daten['pos'][2])

		document.getElementById("teilen_button").disabled = "";
	} else {
		part_neu.set('isset', false);
		part_neu.getGeometry().setCoordinates([[0,0],[0,0]]);
		document.getElementById("teilen_button").disabled = "disabled";
	}
}

function part_move(event) {
	//console.log(event);
	
	
	var daten = part_get_station(event);
	//console.log(daten['achse']);
	if (daten['pos']==null) return;
	
	part_feat.getGeometry().setCoordinates(daten['pos'][6]);
	part_line.getGeometry().setCoordinates([daten['pos'][6], daten['pos'][5]]);
	
	if (!part_neu.get('isset')) {
		document.getElementById("teilen_vnk").innerHTML = daten['achse'].get('vnk')
		document.getElementById("teilen_nnk").innerHTML = daten['achse'].get('nnk')
		document.getElementById("teilen_station").innerHTML = Math.round(daten['pos'][2])
	}
}

function partQuerschnittButton() {
	querTeilen(part_neu.get("abschnittid"), part_neu.get("station"));
}


function startPart() {
	map.addInteraction(part_select);
	document.forms.teilen.style.display = 'block';
	map.on("pointermove", part_move);
	map.on("singleclick", part_click);
}

function stopPart() {
	map.removeInteraction(part_select);
	document.forms.teilen.style.display = 'none';
	map.un("pointermove", part_move);
	map.un("singleclick", part_click);
	part_feat.getGeometry().setCoordinates([0,0]);
	part_neu.getGeometry().setCoordinates([[0,0],[0,0]]);
	document.forms.info.style.display = "none";
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
	document.forms.info.style.display = "none";
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
  if (selection.getLength() <= 0) {
	  document.forms.info.style.display = "none";
	  return;
  }
  document.forms.info.style.display = "block";
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