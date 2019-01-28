//?Service=WFS&Request=GetFeature&TypeName=Projekt&Filter=<Filter><PropertyIsEqualTo><PropertyName>status</PropertyName><Literal>1</Literal></PropertyIsEqualTo></Filter>

function loadER() {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open('GET', 'proxy.jsp?Service=WFS&Request=GetFeature&TypeName=Projekt&Filter=' + encodeURIComponent('<Filter><And><PropertyIsEqualTo><PropertyName>status</PropertyName><Literal>1</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>typ</PropertyName><Literal>D</Literal></PropertyIsEqualTo></And></Filter>'), true);
	xmlhttp.onreadystatechange = function () {
		readER(xmlhttp);
    }
    xmlhttp.setRequestHeader('Content-Type', 'text/xml');
    xmlhttp.send();
}

er = {}
var select = document.getElementById("er_select")

function readER(xmlhttp) {
	if (xmlhttp.readyState == 4) {
		if (xmlhttp.status == 200) {
			var proj = xmlhttp.responseXML.getElementsByTagName("Projekt")
			select.innerHTML = ""
			
			for (var i = 0; i < proj.length; i++) {
				
				projekt = proj[i].getAttribute("fid")
				
				er[projekt] = {}
				
				er[projekt]['nr'] = proj[i].getElementsByTagName("projekt")[0].firstChild.data
				var kurzbez = proj[i].getElementsByTagName("kurzbez")
				if (kurzbez.length > 0)
					er[projekt]['kurzbez'] = proj[i].getElementsByTagName("kurzbez")[0].firstChild.data
				else
					er[projekt]['kurzbez'] = ""
				var langbez = proj[i].getElementsByTagName("langbez")
				if (langbez.length > 0)
					er[projekt]['langbez'] = proj[i].getElementsByTagName("langbez")[0].firstChild.data
				else
					er[projekt]['langbez'] = ""
				er[projekt]['ownerName'] = proj[i].getElementsByTagName("ownerName")[0].firstChild.data
				er[projekt]['anlagedat'] = proj[i].getElementsByTagName("anlagedat")[0].firstChild.data
			}
			
			
			for (var pid in er) {
				var o = document.createElement('option')
				var v = document.createAttribute("value")
				v.value = pid
				o.setAttributeNode(v);
				var t = document.createTextNode(er[pid]['nr'].substr(11) + " - " + er[pid]['kurzbez']);
				o.appendChild(t)				
				select.appendChild(o)
			}
			//document.getElementById("platzhalter").remove();
			select.disabled = false
			aenderung()
		} else {
			alert("Fehler "+xmlhttp.status+"\n"+xmlhttp.responseXML.getElementsByTagName("faultstring")[0].firstChild.data);
		}
	}
}

function aenderung() {
	var p = er[select.value]
	document.getElementById("nummer").innerHTML = p['nr']
	document.getElementById("kurzbez").innerHTML = p['kurzbez']
	document.getElementById("langbez").innerHTML = p['langbez']
	document.getElementById("bearbeiter").innerHTML = p['ownerName']
	document.getElementById("datum").innerHTML = p['anlagedat']
}