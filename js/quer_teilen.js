function querTeilen(abschnittid, station) {
	//alert("noch ohne Funktion\n" + abschnittid + "\n" + station);
	console.log("noch ohne Funktion\n" + abschnittid + "\n" + station);
	
	if (station in querschnitte[abschnittid]) {
		
	}
	
	var von_station = 0;
	var bis_station = 0;
	for (var st in querschnitte[abschnittid]) {
		bis_station = st;
		if (st == station) {
			alert("Station schon vorhanden!");
			return;
		} else if (st > station) {
			break;
		}
		von_station = st;
	}
	
	if (bis_station == von_station) {
		bis_station = abschnitte[abschnittid].get("len");
	}
	
	var faktor =  (station - von_station) / (bis_station - von_station);
	console.log(faktor);
	
	var se = '<wfs:Update typeName="Otschicht">' +
			'	<wfs:Property>' +
			'		<wfs:Name>bst</wfs:Name>' +
			'		<wfs:Value>' + station + '</wfs:Value>' +
			'	</wfs:Property>' +
			'	<ogc:Filter>' +
			'		<ogc:And>' +
			'			<ogc:PropertyIsEqualTo>' +
			'				<ogc:PropertyName>abschnittOderAst/@xlink:href</ogc:PropertyName>' +
			'				<ogc:Literal>' + abschnittid + '</ogc:Literal>' +
			'			</ogc:PropertyIsEqualTo>' +
			'			<ogc:PropertyIsEqualTo>' +
			'				<ogc:PropertyName>vst</ogc:PropertyName>' +
			'				<ogc:Literal>' + von_station + '</ogc:Literal>' +
			'			</ogc:PropertyIsEqualTo>' +
			'			<ogc:PropertyIsGreaterThan>' +
			'				<ogc:PropertyName>bst</ogc:PropertyName>' +
			'				<ogc:Literal>' + station + '</ogc:Literal>' +
			'			</ogc:PropertyIsGreaterThan>' +
			'			<ogc:PropertyIsEqualTo>' +
			'				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>' +
			'				<ogc:Literal>' + ereignisraum +'</ogc:Literal>' +
			'			</ogc:PropertyIsEqualTo>' +
			'		</ogc:And>' +
			'	</ogc:Filter>' +
			'</wfs:Update>';
	var si = ""

	for (var streifen in {'M':null,'R':null, 'L':null}) {
		for (var nr in querschnitte[abschnittid][von_station][streifen]) {
			var str = querschnitte[abschnittid][von_station][streifen][nr];
			console.log(str)
			var neueBreite = Math.round((str['breite'] + (str['bisbreite'] - str['breite']) * faktor)*100);
			console.log(neueBreite);
			se += '<wfs:Update typeName="Dotquer">' +
			'	<wfs:Property>' +
			'		<wfs:Name>bst</wfs:Name>' +
			'		<wfs:Value>' + station + '</wfs:Value>' +
			'	</wfs:Property>' +
			'	<wfs:Property>' +
			'		<wfs:Name>bisBreite</wfs:Name>' +
			'		<wfs:Value>' + neueBreite + '</wfs:Value>' +
			'	</wfs:Property>' +
			'	<ogc:Filter>' +
			'		<ogc:And>' +
			'			<ogc:PropertyIsEqualTo>' +
			'				<ogc:PropertyName>objektId</ogc:PropertyName>' +
			'				<ogc:Literal>' + str['objektid'] + '</ogc:Literal>' +
			'			</ogc:PropertyIsEqualTo>' +
			'			<ogc:PropertyIsEqualTo>' +
			'				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>' +
			'				<ogc:Literal>' + ereignisraum +'</ogc:Literal>' +
			'			</ogc:PropertyIsEqualTo>' +
			'		</ogc:And>' +
			'	</ogc:Filter>' +
			'</wfs:Update>';
			
			si += '<wfs:Insert><Dotquer>' +
			'	<projekt xlink:href="#' + ereignisraum + '" typeName="Projekt" />' +
			'	<vst>' + station + '</vst>' +
			'	<bst>' + bis_station + '</bst>' +
			'	<streifen>' + streifen + '</streifen>' +
			'	<streifennr>' + nr + '</streifennr>' +
			'	<art xlink:href="#' + kt_art[str['art']]['objektid'] + '" typeName="Itquerart" luk="' + str['art'] + '"/>' +
			'	<artober xlink:href="#' + kt_ober[str['artober']]['objektid'] + '" typeName="Itquerober" luk="' + str['artober'] + '"/>' +
			'	<breite>' + neueBreite + '</breite>' +
			'	<bisBreite>' + Math.round(str['bisbreite']*100) + '</bisBreite>' +
			'	<abschnittId>' + abschnittid + '</abschnittId>' +
			'</Dotquer></wfs:Insert>';
		}
	}
	
	var query = se + si;
	console.log(query);
			
	wfs_transaction(query, function() {
				showMessage("erfolgreich", false)
			}, function() {
				showMessage("Fehler", true)
			});
}