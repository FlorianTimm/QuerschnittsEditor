var kt_art = {},
  kt_ober = {};

function loadArt() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open('GET', PUBLIC_WFS_URL + '?Service=WFS&Request=GetFeature&TYPENAME=Itquerart', true);
  xmlhttp.onreadystatechange = function () {
    readArt(xmlhttp);
  }
  xmlhttp.setRequestHeader('Content-Type', 'text/xml');
  xmlhttp.send();
}

function readArt(xmlhttp) {
  if (xmlhttp.readyState != 4) return;
  if (xmlhttp.status != 200) {
    alert("Fehler " + xmlhttp.status + "\n" + xmlhttp.responseXML.getElementsByTagName("faultstring")[0].firstChild.data)
    return;
  }

  var quer = xmlhttp.responseXML.getElementsByTagName("Itquerart")

  for (var i = 0; i < quer.length; i++) {
    var art = quer[i].getElementsByTagName("art")[0].firstChild.data
    kt_art[art] = {
      "kt": quer[i].getElementsByTagName("beschreib")[0].firstChild.data,
      'select': document.createElement('option'),
      'objektId': quer[i].getElementsByTagName('objektId')[0].firstChild.data
    }
  }

  for (var key in kt_art) {
    var t = document.createTextNode(kt_art[key]['kt']);
    kt_art[key]['select'].appendChild(t);
    var v = document.createAttribute("value");
    v.value = key
    kt_art[key]['select'].setAttributeNode(v);
    document.forms.info.info_art.appendChild(kt_art[key]['select']);
  }
}

function loadOber() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open('GET', PUBLIC_WFS_URL + '?Service=WFS&Request=GetFeature&TYPENAME=Itquerober', true);
  xmlhttp.onreadystatechange = function () {
    readOber(xmlhttp);
  }
  xmlhttp.setRequestHeader('Content-Type', 'text/xml');
  xmlhttp.send();
}



function readOber(xmlhttp) {
  if (xmlhttp.readyState != 4) return;
  if (xmlhttp.status != 200) {
    alert("Fehler " + xmlhttp.status + "\n" + xmlhttp.responseXML.getElementsByTagName("faultstring")[0].firstChild.data)
    return;
  }

  var quer = xmlhttp.responseXML.getElementsByTagName("Itquerober")

  for (var i = 0; i < quer.length; i++) {
    var artober = quer[i].getElementsByTagName("artober")[0].firstChild.data

    kt_ober[artober] = {
      'kt': quer[i].getElementsByTagName("beschreib")[0].firstChild.data,
      'select': document.createElement('option'),
      'objektId': quer[i].getElementsByTagName('objektId')[0].firstChild.data
    }
  }

  for (var key in kt_ober) {
    var t = document.createTextNode(kt_ober[key]['kt']);
    kt_ober[key]['select'].appendChild(t);
    var v = document.createAttribute("value");
    v.value = key
    kt_ober[key]['select'].setAttributeNode(v);
    document.forms.info.info_ober.appendChild(kt_ober[key]['select']);
  }
}

loadArt()
loadOber()
