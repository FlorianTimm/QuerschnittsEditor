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



mod_select.on('select', function (e) {
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



mod_select_fl.on('select', function (e) {
	mod_select.getFeatures().clear()
	if (e.selected.length > 0) {
		auswahl = e.selected[0]
		var absid = auswahl.get('abschnittsid')
		var streifen = auswahl.get('streifen')
		var nr = auswahl.get('nr')
		var station = auswahl.get('station')
		a = querschnitte[absid][station]['streifen'][streifen][nr]['trenn']
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
mod_modify.on('modifystart', function (e) {
	auswahl = e.features.getArray()[0]
	mod_geo_vorher = auswahl.getGeometry().clone()
});

mod_modify.on('modifyend', function (e) {
	console.log(e)
	auswahl = e.features.getArray()[0]

	var absid = auswahl.get('abschnittsid')
	var streifen = auswahl.get('streifen')
	var nr = auswahl.get('nr')
	var station = auswahl.get('station')

	var nachher = auswahl.getGeometry().getCoordinates()
	var vorher = mod_geo_vorher.getCoordinates()

	var diff = 0, edit = null;
	var max_diff_vst = null, max_diff_bst = null;
	if (document.getElementById("modify_fit").checked && (nr + 1) in querschnitte[absid][station]['streifen'][streifen]) {
		max_diff_vst = querschnitte[absid][station]['streifen'][streifen][nr + 1]['breite'] / 100;
		max_diff_bst = querschnitte[absid][station]['streifen'][streifen][nr + 1]['bisBreite'] / 100;
	}

	for (var i = 0; i < vorher.length; i++) {
		for (var j = 0; j < vorher[i].length; j += vorher[i].length - 1) {
			if (nachher[i][j][0] != vorher[i][j][0] || nachher[i][j][1] != vorher[i][j][1]) {
				var pos = get_pos(querschnitte[absid][station]['geo'], nachher[i][j]);
				var dist = Math.round(pos[4] * 100) / 100
				if (streifen == "L") dist *= -1;
				console.log(pos)

				if (j > 0) {
					diff = dist - querschnitte[absid][station]['streifen'][streifen][nr]['XBst' + streifen];
					console.log((streifen == 'L') ? (-diff) : (diff));
					console.log(max_diff_bst);
					if (max_diff_bst !== null && ((streifen == 'L') ? (-diff) : (diff)) > max_diff_bst) {
						diff = ((streifen == 'L') ? (-max_diff_bst) : (max_diff_bst));
					}
					edit = "Bst";
					querschnitte[absid][station]['streifen'][streifen][nr]['XBst' + streifen] += diff;
					querschnitte[absid][station]['streifen'][streifen][nr]['bisBreite'] =
						Math.round(100 * (querschnitte[absid][station]['streifen'][streifen][nr]['XBstR'] -
							querschnitte[absid][station]['streifen'][streifen][nr]['XBstL']));
				} else {
					diff = dist - querschnitte[absid][station]['streifen'][streifen][nr]['XVst' + streifen]
					edit = "Vst";

					console.log((streifen == 'L') ? (-diff) : (diff));
					console.log(max_diff_vst);

					if (max_diff_vst !== null && ((streifen == 'L') ? (-diff) : (diff)) > max_diff_vst) {
						diff = ((streifen == 'L') ? (-max_diff_vst) : (max_diff_vst));
					}

					querschnitte[absid][station]['streifen'][streifen][nr]['XVst' + streifen] += diff;
					querschnitte[absid][station]['streifen'][streifen][nr]['breite'] =
						Math.round(100 * (querschnitte[absid][station]['streifen'][streifen][nr]['XVstR'] -
							querschnitte[absid][station]['streifen'][streifen][nr]['XVstL']));
				}
				break;
			}
		}
	}

	if (edit == null) return;
	breiteNachfAnpassen(absid, station, streifen, nr, edit, diff);
});

function breiteNachfAnpassen(absid, station, streifen, nr, edit, diff) {

	querstreifen = [[absid, station, streifen, nr]];

	if (document.getElementById('modify_move').checked) {
		// Verschieben
		for (var nnr in querschnitte[absid][station]['streifen'][streifen]) {
			if (nnr <= nr) continue;

			querschnitte[absid][station]['streifen'][streifen][nnr]['X' + edit + 'L'] += diff
			querschnitte[absid][station]['streifen'][streifen][nnr]['X' + edit + 'R'] += diff
			querstreifen.push([absid, station, streifen, nnr]);
		}
	} else {
		// Anpassen
		if (streifen != "M" && (nr + 1) in querschnitte[absid][station]['streifen'][streifen]) {
			if (streifen == 'L')
				querschnitte[absid][station]['streifen'][streifen][nr + 1]['X' + edit + 'R'] += diff;
			else if (streifen == 'R')
				querschnitte[absid][station]['streifen'][streifen][nr + 1]['X' + edit + 'L'] += diff;
			querschnitte[absid][station]['streifen'][streifen][nr + 1]['breite'] =
				Math.round(100 * (querschnitte[absid][station]['streifen'][streifen][nr + 1]['XVstR'] -
					querschnitte[absid][station]['streifen'][streifen][nr + 1]['XVstL']));
			querschnitte[absid][station]['streifen'][streifen][nr + 1]['bisBreite'] =
				Math.round(100 * (querschnitte[absid][station]['streifen'][streifen][nr + 1]['XBstR'] -
					querschnitte[absid][station]['streifen'][streifen][nr + 1]['XBstL']));
			querstreifen.push([absid, station, streifen, nr + 1]);
		}
	}

	logAuswahl(mod_select)
	refreshQuerschnitte(absid)
	updateQuerschnitt(querstreifen)
}

function updateInfo() {
	var selection = mod_select.getFeatures();
	if (mod_select.getFeatures().getLength() <= 0) return;
	var auswahl = selection.item(0);

	var absid = auswahl.get('abschnittsid')
	var streifen = auswahl.get('streifen')
	var nr = auswahl.get('nr')
	var station = auswahl.get('station')



	querschnitte[absid][station]['streifen'][streifen][nr]['art'] = document.getElementById("info_art").value
	querschnitte[absid][station]['streifen'][streifen][nr]['flaeche'].set('art', document.getElementById("info_art").value)
	querschnitte[absid][station]['streifen'][streifen][nr]['artober'] = document.getElementById("info_ober").value
}

function updateInfoBreite() {
	var selection = mod_select.getFeatures();
	if (mod_select.getFeatures().getLength() <= 0) return;
	var auswahl = selection.item(0);

	var absid = auswahl.get('abschnittsid')
	var streifen = auswahl.get('streifen')
	var nr = auswahl.get('nr')
	var station = auswahl.get('station')

	var max_diff_vst = null, max_diff_bst = null;
	if (document.getElementById('modify_fit').checked && (nr + 1) in querschnitte[absid][station]['streifen'][streifen]) {
		max_diff_vst = querschnitte[absid][station]['streifen'][streifen][nr + 1]['breite'] / 100;
		max_diff_bst = querschnitte[absid][station]['streifen'][streifen][nr + 1]['bisBreite'] / 100;
	}

	if (querschnitte[absid][station]['streifen'][streifen][nr]['breite'] != Number(document.getElementById("info_breite").value)) {
		diff = (Math.round(Number(document.getElementById("info_breite").value)) - querschnitte[absid][station]['streifen'][streifen][nr]['breite']) / 100;
		if (max_diff_vst !== null && diff > max_diff_vst) {
			diff = (max_diff_vst);
		}

		querschnitte[absid][station]['streifen'][streifen][nr]['breite'] += diff * 100;
		if (streifen == 'L') {
			querschnitte[absid][station]['streifen'][streifen][nr]['XVstL'] -= diff;
		} else if (streifen == 'R') {
			querschnitte[absid][station]['streifen'][streifen][nr]['XVstR'] += diff;
		}
		breiteNachfAnpassen(absid, station, streifen, nr, "Vst", diff)
	} else if (querschnitte[absid][station]['streifen'][streifen][nr]['bisBreite'] != Number(document.getElementById("info_bisbreite").value)) {
		diff = (Math.round(Number(document.getElementById("info_bisbreite").value)) - querschnitte[absid][station]['streifen'][streifen][nr]['bisBreite']) / 100;

		if (max_diff_bst !== null && diff > max_diff_bst) {
			diff = (max_diff_bst);
		}

		querschnitte[absid][station]['streifen'][streifen][nr]['bisBreite'] += diff * 100;
		if (streifen == 'L') {
			querschnitte[absid][station]['streifen'][streifen][nr]['XBstL'] -= diff;
		} else if (streifen == 'R') {
			querschnitte[absid][station]['streifen'][streifen][nr]['XBstR'] += diff
		}
		breiteNachfAnpassen(absid, station, streifen, nr, "Bst", diff)
	}


}


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

del_select.on('select', function (e) {
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

info_select.on('select', function (e) {
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

info_select_fl.on('select', function (e) {
	info_select.getFeatures().clear()
	if (e.selected.length > 0) {
		auswahl = e.selected[0]
		var absid = auswahl.get('abschnittsid')
		var streifen = auswahl.get('streifen')
		var nr = auswahl.get('nr')
		var station = auswahl.get('station')
		a = querschnitte[absid][station]['streifen'][streifen][nr]['trenn']
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


var part_feat = new ol.Feature({ geometry: new ol.geom.Point([0, 0]) });
part_feat.setStyle(
	new ol.style.Style({
		image: new ol.style.Circle({
			radius: 3,
			fill: new ol.style.Fill({ color: [0, 0, 200], }),
			stroke: new ol.style.Stroke({
				color: [0, 0, 200], width: 2
			})
		}),
	})
)
v_overlay.addFeature(part_feat);

var part_neu = new ol.Feature({
	geometry: new ol.geom.LineString([[0, 0][0, 0]]),
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

var part_line = new ol.Feature({ geometry: new ol.geom.LineString([[0, 0][0, 0]]) });
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
		part_feat.getGeometry().setCoordinates([0, 0]);
		part_line.getGeometry().setCoordinates([[0, 0], [0, 0]]);
		return null;
	}

	return { achse: achse, pos: get_pos(achse.getGeometry().getCoordinates(), event.coordinate) };
}


function part_click(event) {
	if (!part_neu.get('isset')) {
		part_neu.set('isset', true);
		var daten = part_get_station(event);
		if (daten['pos'] == null) return;

		var vektor = v_multi(v_einheit(v_diff(daten['pos'][6], daten['pos'][5])), 50);
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
		part_neu.getGeometry().setCoordinates([[0, 0], [0, 0]]);
		document.getElementById("teilen_button").disabled = "disabled";
	}
}

function part_move(event) {
	//console.log(event);


	var daten = part_get_station(event);
	//console.log(daten['achse']);
	if (daten['pos'] == null) return;

	part_feat.getGeometry().setCoordinates(daten['pos'][6]);
	part_line.getGeometry().setCoordinates([daten['pos'][6], daten['pos'][5]]);

	if (!part_neu.get('isset')) {
		document.getElementById("teilen_vnk").innerHTML = daten['achse'].get('vnk')
		document.getElementById("teilen_nnk").innerHTML = daten['achse'].get('nnk')
		document.getElementById("teilen_station").innerHTML = Math.round(daten['pos'][2])
	}
}

function partQuerschnittButton() {
	//loadAufbaudaten(part_neu.get("abschnittid"));
	querTeilen(part_neu.get("abschnittid"), part_neu.get("station"));
}


function startPart() {
	loadAufbaudaten();
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
	part_feat.getGeometry().setCoordinates([0, 0]);
	part_neu.getGeometry().setCoordinates([[0, 0], [0, 0]]);
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

add_select.on('select', function (e) {
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
	addQuerschnitt();
}

function startAdd() {
	loadAufbaudaten();
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
	var befehl = document.forms.steuerung.befehl

	if (document.getElementById("befehl_info").checked) {
		startInfo();
	} else {
		stopInfo();
	}

	if (document.getElementById("befehl_modify").checked) {
		startModify();
	} else {
		stopModify();
	}

	if (document.getElementById("befehl_delete").checked)
		startDelete();
	else
		stopDelete();

	if (document.getElementById("befehl_part").checked)
		startPart();
	else
		stopPart();

	if (document.getElementById("befehl_add").checked)
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
	document.getElementById("info_nnk").innerHTML = abschnitte[absid].get('nnk');
	document.getElementById("info_station").innerHTML = querschnitte[absid][station]['vst'] + " - " + querschnitte[absid][station]['bst'];
	document.getElementById("info_streifen").innerHTML = streifen + " " + nr;

	document.getElementById("info_art").value = querschnitte[absid][station]['streifen'][streifen][nr]['art'];
	document.getElementById("info_ober").value = querschnitte[absid][station]['streifen'][streifen][nr]['artober'];

	document.getElementById("info_breite").value = querschnitte[absid][station]['streifen'][streifen][nr]['breite'];
	document.getElementById("info_bisbreite").value = querschnitte[absid][station]['streifen'][streifen][nr]['bisBreite'];
}