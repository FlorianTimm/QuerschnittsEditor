function xml_db_request(xml, callbackSuccess, callbackFailed) {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open('POST', PUBLIC_WFS_URL, true);

	
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState != 4) return;
		if (xmlhttp.status == 200 && xmlhttp.responseXML.getElementsByTagName("SUCCESS").length > 0) {
			callbackSuccess(xmlhttp.responseXML)
		} else {
			callbackFailed(xmlhttp.responseXML)
		}
	}
    xmlhttp.setRequestHeader('Content-Type', 'text/xml');
    xmlhttp.send(xml);
}

function wfs_transaction(transaction, callbackSuccess, callbackFailed) {
	var xml = 
		'<?xml version="1.0" encoding="ISO-8859-1"?>' +
		'<wfs:Transaction service="WFS" version="1.0.0"' +
		'		xmlns="http://xml.novasib.de"' +
		'		xmlns:wfs="http://www.opengis.net/wfs" ' +
		'		xmlns:gml="http://www.opengis.net/gml" ' +
		'		xmlns:ogc="http://www.opengis.net/ogc" ' +
		'		xmlns:xlink="http://www.w3.org/1999/xlink" ' +
		'		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
		'		xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-transaction.xsd">' +
		transaction +
		'</wfs:Transaction>';
	return xml_db_request(xml, callbackSuccess, callbackFailed)
}


function showMessage(text, error) {
	var m = document.getElementById("nachricht");
	m.innerHTML = text;
	if (error) {
		m.style.backgroundColor = 'rgba(255,100,100,0.8)';
		window.setTimeout(function () {
			m.style.display = 'none';
		}, 3000);
	} else {
		m.style.backgroundColor = 'rgba(100, 200,100,0.8)';
		window.setTimeout(function () {
			m.style.display = 'none';
		}, 5000);
	}
	m.style.display = 'block';
}

function updateQuerschnitt(querstreifen) {
	// streifen[] => [[absid, station, streifen, nr],,]
	var sr = "";
	
	for(var i = 0; i < querstreifen.length; i++) {
		console.log(querstreifen[i]);
		var absid = querstreifen[i][0];
		var station = querstreifen[i][1];
		var streifen = querstreifen[i][2];
		var nr = querstreifen[i][3];
		console.log(querschnitte[absid][station]['streifen'][streifen]);
		sr += 
			'<wfs:Update typeName="Dotquer">' +
			'	<wfs:Property>' +
			'		<wfs:Name>breite</wfs:Name>' +
			'		<wfs:Value>' + Math.round(querschnitte[absid][station]['streifen'][streifen][nr]['breite']) + '</wfs:Value>' +
			'	</wfs:Property>' +
			'	<wfs:Property>' +
			'		<wfs:Name>bisBreite</wfs:Name>' +
			'		<wfs:Value>' + Math.round(querschnitte[absid][station]['streifen'][streifen][nr]['bisBreite']) + '</wfs:Value>' +
			'	</wfs:Property>' +
			'	<wfs:Property>' +
			'		<wfs:Name>XVstL</wfs:Name>' +
			'		<wfs:Value>' + Math.round(querschnitte[absid][station]['streifen'][streifen][nr]['XVstL']*100)/100 + '</wfs:Value>' +
			'	</wfs:Property>' +
			'	<wfs:Property>' +
			'		<wfs:Name>XVstR</wfs:Name>' +
			'		<wfs:Value>' + Math.round(querschnitte[absid][station]['streifen'][streifen][nr]['XVstR']*100)/100 + '</wfs:Value>' +
			'	</wfs:Property>' +
					'	<wfs:Property>' +
			'		<wfs:Name>XBstL</wfs:Name>' +
			'		<wfs:Value>' + Math.round(querschnitte[absid][station]['streifen'][streifen][nr]['XBstL']*100)/100 + '</wfs:Value>' +
			'	</wfs:Property>' +
			'	<wfs:Property>' +
			'		<wfs:Name>XBstR</wfs:Name>' +
			'		<wfs:Value>' + Math.round(querschnitte[absid][station]['streifen'][streifen][nr]['XBstR']*100)/100 + '</wfs:Value>' +
			'	</wfs:Property>' +
			'	<wfs:Property>' +
			'		<wfs:Name>art/@xlink:href</wfs:Name>' +
			'		<wfs:Value>' + kt_art[querschnitte[absid][station]['streifen'][streifen][nr]['art']]['objektId'] + '</wfs:Value>' +
			'	</wfs:Property>' +
			'	<wfs:Property>' +
			'		<wfs:Name>artober/@xlink:href</wfs:Name>' +
			'		<wfs:Value>' + kt_ober[querschnitte[absid][station]['streifen'][streifen][nr]['artober']]['objektId']+ '</wfs:Value>' +
			'	</wfs:Property>' +
			'	<ogc:Filter>' +
			'		<ogc:And>' +
			'			<ogc:PropertyIsEqualTo>' +
			'				<ogc:PropertyName>objektId</ogc:PropertyName>' +
			'				<ogc:Literal>' + querschnitte[absid][station]['streifen'][streifen][nr]['objektId'] + '</ogc:Literal>' +
			'			</ogc:PropertyIsEqualTo>' +
			'			<ogc:PropertyIsEqualTo>' +
			'				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>' +
			'				<ogc:Literal>' + ereignisraum +'</ogc:Literal>' +
			'			</ogc:PropertyIsEqualTo>' +
			'		</ogc:And>' +
			'	</ogc:Filter>' +
			'</wfs:Update>';
	}
	
	return wfs_transaction(sr, function() {
			showMessage("erfolgreich", false)
		}, function() {
			showMessage("Fehler", true)
	});
}