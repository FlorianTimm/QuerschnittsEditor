function loadArt() {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open('GET', 'proxy.jsp?Service=WFS&Request=GetFeature&TYPENAME=Itquerart', true);
	xmlhttp.onreadystatechange = function () {
		readArt(xmlhttp);
    }
    xmlhttp.setRequestHeader('Content-Type', 'text/xml');
    xmlhttp.send();
}

kt_art = {}

function readArt(xmlhttp) {
	if (xmlhttp.readyState == 4) {
		if (xmlhttp.status == 200) {
			var quer = xmlhttp.responseXML.getElementsByTagName("Itquerart")
			
			for (var i = 0; i < quer.length; i++) {			
				var art = quer[i].getElementsByTagName("art")[0].firstChild.data
				var beschreib = quer[i].getElementsByTagName("beschreib")[0].firstChild.data
				kt_art[art] = beschreib
			}
		} else {
			alert("Fehler "+xmlhttp.status+"\n"+xmlhttp.responseXML.getElementsByTagName("faultstring")[0].firstChild.data);
		}
	}
}


function loadOber() {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open('GET', 'proxy.jsp?Service=WFS&Request=GetFeature&TYPENAME=Itquerober', true);
	xmlhttp.onreadystatechange = function () {
		readOber(xmlhttp);
    }
    xmlhttp.setRequestHeader('Content-Type', 'text/xml');
    xmlhttp.send();
}

kt_ober = {}

function readOber(xmlhttp) {
	if (xmlhttp.readyState == 4) {
		if (xmlhttp.status == 200) {
			var quer = xmlhttp.responseXML.getElementsByTagName("Itquerober")
			
			for (var i = 0; i < quer.length; i++) {			
				var artober = quer[i].getElementsByTagName("artober")[0].firstChild.data
				var beschreib = quer[i].getElementsByTagName("beschreib")[0].firstChild.data
				kt_ober[artober] = beschreib
			}
		} else {
			alert("Fehler "+xmlhttp.status+"\n"+xmlhttp.responseXML.getElementsByTagName("faultstring")[0].firstChild.data);
		}
	}
}

loadArt()
loadOber()