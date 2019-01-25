function edit_breite(er, objid, breite, bisbreite) {

	var sr = 
		`<wfs:Update typeName="Dotquer">
			<wfs:Property>
				<wfs:Name>breite</wfs:Name>
				<wfs:Value>` + Math.round(breite*100) + `</wfs:Value>
			</wfs:Property>
			<wfs:Property>
				<wfs:Name>bisBreite</wfs:Name>
				<wfs:Value>` + Math.round(bisbreite*100) + `</wfs:Value>
			</wfs:Property>
			<ogc:Filter>
				<ogc:And>
					<ogc:PropertyIsEqualTo>
						<ogc:PropertyName>objektId</ogc:PropertyName>
						<ogc:Literal>` + objid + `</ogc:Literal>
					</ogc:PropertyIsEqualTo>
					<ogc:PropertyIsEqualTo>
						<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>
						<ogc:Literal>` + er +`</ogc:Literal>
					</ogc:PropertyIsEqualTo>
				</ogc:And>
			</ogc:Filter>
		</wfs:Update>`;
	wfs_transaction(sr, function() {
			showMessage("erfolgreich", false)
		}, function() {
			showMessage("Fehler", true)
	});
}


function xml_db_request(xml, callbackSuccess, callbackFailed) {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open('POST', 'proxy.jsp', true);

	
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState != 4) return;
		if (xmlhttp.status == 200) {
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
		`<?xml version="1.0" encoding="ISO-8859-1"?>
		<wfs:Transaction service="WFS" version="1.0.0"
				xmlns="http://xml.novasib.de"
				xmlns:wfs="http://www.opengis.net/wfs" 
				xmlns:gml="http://www.opengis.net/gml" 
				xmlns:ogc="http://www.opengis.net/ogc" 
				xmlns:xlink="http://www.w3.org/1999/xlink" 
				xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
				xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-transaction.xsd">` +
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
		}, 500);
	} else {
		m.style.backgroundColor = 'rgba(100, 200,100,0.8)';
		window.setTimeout(function () {
			m.style.display = 'none';
		}, 3000);
	}
	m.style.display = 'block';
}

function updateInfo() {
	var selection = select.getFeatures();
	if (select.getFeatures().getLength() <= 0) return;
	var auswahl = selection.item(0);
	
	var absid = auswahl.get('abschnittsid')
	var streifen = auswahl.get('streifen')
	var nr = auswahl.get('nr')
	var station = auswahl.get('station')
	
	querschnitte[absid][station][streifen][nr]['breite'] = Number(document.getElementById("info_breite").value)
	querschnitte[absid][station][streifen][nr]['bisbreite'] = Number(document.getElementById("info_bisbreite").value)
	querschnitte[absid][station][streifen][nr]['art'] = document.getElementById("info_art").value
	querschnitte[absid][station][streifen][nr]['flaeche'].set('art', document.getElementById("info_art").value)
	querschnitte[absid][station][streifen][nr]['artober'] = document.getElementById("info_ober").value
	
	refreshQuerschnitte(absid)
	
	var sr = 
		`<wfs:Update typeName="Dotquer">
			<wfs:Property>
				<wfs:Name>breite</wfs:Name>
				<wfs:Value>` + Math.round(querschnitte[absid][station][streifen][nr]['breite']*100) + `</wfs:Value>
			</wfs:Property>
			<wfs:Property>
				<wfs:Name>bisBreite</wfs:Name>
				<wfs:Value>` + Math.round(querschnitte[absid][station][streifen][nr]['bisbreite']*100) + `</wfs:Value>
			</wfs:Property>
			<wfs:Property>
				<wfs:Name>art/@xlink:href</wfs:Name>
				<wfs:Value>` + kt_art[querschnitte[absid][station][streifen][nr]['art']]['objektid'] + `</wfs:Value>
			</wfs:Property>
			<wfs:Property>
				<wfs:Name>artober/@xlink:href</wfs:Name>
				<wfs:Value>` + kt_ober[querschnitte[absid][station][streifen][nr]['artober']]['objektid']+ `</wfs:Value>
			</wfs:Property>
			<ogc:Filter>
				<ogc:And>
					<ogc:PropertyIsEqualTo>
						<ogc:PropertyName>objektId</ogc:PropertyName>
						<ogc:Literal>` + querschnitte[absid][station][streifen][nr]['objektid'] + `</ogc:Literal>
					</ogc:PropertyIsEqualTo>
					<ogc:PropertyIsEqualTo>
						<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>
						<ogc:Literal>` + ereignisraum +`</ogc:Literal>
					</ogc:PropertyIsEqualTo>
				</ogc:And>
			</ogc:Filter>
		</wfs:Update>`;
	wfs_transaction(sr, function() {
			showMessage("erfolgreich", false)
		}, function() {
			showMessage("Fehler", true)
	});
}