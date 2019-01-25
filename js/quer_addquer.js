function addQuerschnitt() {
	var selection = select.getFeatures();
	if (select.getFeatures().getLength() <= 0) return;
	var auswahl = selection.item(0);
	
	console.log(auswahl);
}

function updateStreifenNr (auswahl) {
	var abschnittid = auswahl.get("abschnittid")
	var station = auswahl.get("station")
	var streifen = auswahl.get("streifen")
	var nr = auswahl.get("streifen")
	
	for (var str in querschnitte[abschnittid][station][streifen]) {
		
	}
	
	
}


function insertQuerschnittDb() {
	var sr = 
	`<wfs:Insert><Dotquer>
		<projekt xlink:href="#` + ereignisraum + `" typeName="Projekt" />
		<vtkNummer>2525</vtkNummer>
		<vnkLfd>109</vnkLfd>
		<vzusatz>O</vzusatz>
		<ntkNummer>2525</ntkNummer>
		<nnkLfd>110</nnkLfd>
		<nzusatz>O</nzusatz>
		<vst>136</vst>
		<bst>172</bst>
		<streifen>R</streifen>
		<streifennr>9</streifennr>
		<art xlink:href="#S8ac892a121c9f5cf0121e3aa55f77bff" typeName="Itquerart" luk="999"/>
		<artober xlink:href="#S8ac892a125682d4c0126bd468f3c585d" typeName="Itquerober" luk="87"/>
		<breite>275</breite>
		<bisBreite>275</bisBreite>
		<abschnittId>181C232CDE0B4E718F965D8CF7F11B91</abschnittId>
	</Dotquer></wfs:Insert>`;

	wfs_transaction(sr, function() {
			alert("erfolgreich")
		}, function() {
			alert("Fehler")
	});
}