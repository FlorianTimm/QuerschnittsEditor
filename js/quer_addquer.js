function addQuerschnitt() {
	var selection = add_select.getFeatures();
	if (add_select.getFeatures().getLength() <= 0) return;
	var auswahl = selection.item(0);
	
	console.log(auswahl);

	var abschnittid = auswahl.get("abschnittsid")
	var station = auswahl.get("station")
	var streifen = auswahl.get("streifen")
	var nr = auswahl.get("nr")
	
	var bstl,bstr,vstr,vstl;
	if (streifen == 'L') {
		bstr = querschnitte[abschnittid][station]['streifen'][streifen][nr]['XBstL']
		vstr = querschnitte[abschnittid][station]['streifen'][streifen][nr]['XVstL']
		bstl = bstr - 2.75;
		vstl = vstr - 2.75;
	} else if (streifen == 'R') {
		bstl = querschnitte[abschnittid][station]['streifen'][streifen][nr]['XBstR']
		vstl = querschnitte[abschnittid][station]['streifen'][streifen][nr]['XVstR']
		bstr = bstl + 2.75;
		vstr = vstl + 2.75;
	}

	querschnitte[abschnittid][station]['streifen'][streifen][nr+1] = {
		breite: 275,
		bisBreite: 275,
		XBstL: bstl,
		XBstR: bstr,
		XVstL: vstl,
		XVstR: vstr,
		art: "100",
		artober: "00",
		objektId: null,
		aufbau: {},
		trenn: new ol.Feature({
			geometry: null,
			abschnittsid: abschnittid,
			station: station,
			streifen: streifen,
			nr: nr+1
		}),
		flaeche: new ol.Feature({
			geometry: null,
			abschnittsid: abschnittid,
			station: station,
			streifen: streifen,
			nr: nr+1,
			//art: querschnitte[absId][vst]['streifen'][streifen][streifennr]['art']
		 }),
	}
	
	refreshQuerschnitte(abschnittid);
	
	insertQuerschnittDb(abschnittid,station);
}


function insertQuerschnittDb(abschnittid,station) {
	
	var sr = '<wfs:Delete typeName="Dotquer">' +
		'	<ogc:Filter>' +
		'		<ogc:And>' +
		'			<ogc:PropertyIsEqualTo>' +
		'				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>' +
		'				<ogc:Literal>' + ereignisraum +'</ogc:Literal>' +
		'			</ogc:PropertyIsEqualTo>' +
		'			<ogc:PropertyIsEqualTo>' +
		'				<ogc:PropertyName>abschnittId</ogc:PropertyName>' +
		'				<ogc:Literal>' + abschnittid +'</ogc:Literal>' +
		'			</ogc:PropertyIsEqualTo>' +
		'			<ogc:PropertyIsEqualTo>' +
		'				<ogc:PropertyName>vst</ogc:PropertyName>' +
		'				<ogc:Literal>' + station +'</ogc:Literal>' +
		'			</ogc:PropertyIsEqualTo>' +
		'			<ogc:PropertyIsEqualTo>' +
		'				<ogc:PropertyName>bst</ogc:PropertyName>' +
		'				<ogc:Literal>' + querschnitte[abschnittid][station]['bst'] +'</ogc:Literal>' +
		'			</ogc:PropertyIsEqualTo>' +
		'		</ogc:And>' +
		'	</ogc:Filter>' +
		'</wfs:Delete>';
		
		
	for (var streifen in querschnitte[abschnittid][station]['streifen']) {
		for (var nr in querschnitte[abschnittid][station]['streifen'][streifen]) {
			sr += '<wfs:Insert><Dotquer>';
			if (querschnitte[abschnittid][station]['streifen'][streifen][nr]['objektId'] != null) {
				sr += '	<objektId>' + querschnitte[abschnittid][station]['streifen'][streifen][nr]['objektId'] + '</objektId>';
			}
			sr += '	<projekt xlink:href="#' + ereignisraum + '" typeName="Projekt" />' +
				'	<XBstL>' + querschnitte[abschnittid][station]['streifen'][streifen][nr]['XBstL'] + '</XBstL>' +
				'	<XBstR>' + querschnitte[abschnittid][station]['streifen'][streifen][nr]['XBstR'] + '</XBstR>' +
				'	<XVstL>' + querschnitte[abschnittid][station]['streifen'][streifen][nr]['XVstL'] + '</XVstL>' +
				'	<XVstR>' + querschnitte[abschnittid][station]['streifen'][streifen][nr]['XVstR'] + '</XVstR>' +
				'	<vst>' + station + '</vst>' +
				'	<bst>' + querschnitte[abschnittid][station]['bst'] + '</bst>' +
				'	<streifen>' + streifen + '</streifen>' +
				'	<streifennr>' + nr + '</streifennr>' +
				'	<art xlink:href="#' + kt_art[querschnitte[abschnittid][station]['streifen'][streifen][nr]['art']]['objektId'] + 
				'" typeName="Itquerart" luk="' + querschnitte[abschnittid][station]['streifen'][streifen][nr]['art'] + '"/>' +
				'	<artober xlink:href="#' + kt_ober[querschnitte[abschnittid][station]['streifen'][streifen][nr]['artober']]['objektId'] + 
				'" typeName="Itquerober" luk="' + querschnitte[abschnittid][station]['streifen'][streifen][nr]['artober'] + '"/>' +
				'	<breite>' + querschnitte[abschnittid][station]['streifen'][streifen][nr]['breite'] + '</breite>' +
				'	<bisBreite>' + querschnitte[abschnittid][station]['streifen'][streifen][nr]['bisBreite'] + '</bisBreite>' +
				'	<abschnittId>' + abschnittid + '</abschnittId>' +
				'</Dotquer></wfs:Insert>';
		}
	}

	wfs_transaction(sr, function(xml) {
			querschnittHinzu(abschnittid,station);
		}, function() {
			showMessage("Fehler", true)
	});
}

function querschnittHinzu (abschnittid, station, xml) {
	console.log(xml);
	showMessage("Erfolgreich!", false);
	
	for (var streifen in querschnitte[abschnittid][station]['streifen']) {
		for (var nr in querschnitte[abschnittid][station]['streifen'][streifen]) {
		}
	}
}
