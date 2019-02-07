import '../css/index.css';
import PublicWFS from './PublicWFS.js';

window.addEventListener('load', loadER());

var er = {}
var select = document.getElementById("er_select")
select.addEventListener("change", aenderung);

//?Service=WFS&Request=GetFeature&TypeName=Projekt&Filter=<Filter><PropertyIsEqualTo><PropertyName>status</PropertyName><Literal>1</Literal></PropertyIsEqualTo></Filter>

function loadER() {
    let xml = PublicWFS.doQuery('Projekt',
        '<Filter><And>' +
        '<PropertyIsEqualTo><PropertyName>status</PropertyName>' +
        '<Literal>1</Literal>' +
        '</PropertyIsEqualTo><PropertyIsEqualTo>' +
        '<PropertyName>typ</PropertyName>' +
        '<Literal>D</Literal>' +
        '</PropertyIsEqualTo>' +
        '</And></Filter>',  readER);
}

function readER(xml) {
    console.log(xml)
    let proj = xml.getElementsByTagName("Projekt")
    select.innerHTML = ""

    for (var i = 0; i < proj.length; i++) {

        let projekt = proj[i].getAttribute("fid")

        er[projekt] = {}

        er[projekt]['nr'] = proj[i].getElementsByTagName("projekt")[0].firstChild.data
        let kurzbez = proj[i].getElementsByTagName("kurzbez")
        if (kurzbez.length > 0)
            er[projekt]['kurzbez'] = proj[i].getElementsByTagName("kurzbez")[0].firstChild.data
        else
            er[projekt]['kurzbez'] = ""
        let langbez = proj[i].getElementsByTagName("langbez")
        if (langbez.length > 0)
            er[projekt]['langbez'] = proj[i].getElementsByTagName("langbez")[0].firstChild.data
        else
            er[projekt]['langbez'] = ""
        er[projekt]['ownerName'] = proj[i].getElementsByTagName("ownerName")[0].firstChild.data
        er[projekt]['anlagedat'] = proj[i].getElementsByTagName("anlagedat")[0].firstChild.data
    }


    for (let pid in er) {
        let o = document.createElement('option')
        let v = document.createAttribute("value")
        v.value = pid
        o.setAttributeNode(v);
        let t = document.createTextNode(er[pid]['nr'].substr(11) + " - " + er[pid]['kurzbez']);
        o.appendChild(t)
        select.appendChild(o)
    }
    //document.getElementById("platzhalter").remove();
    select.disabled = false
    aenderung()
}

function aenderung() {
    var p = er[select.value]
    document.getElementById("nummer").innerHTML = p['nr']
    document.getElementById("kurzbez").innerHTML = p['kurzbez']
    document.getElementById("langbez").innerHTML = p['langbez']
    document.getElementById("bearbeiter").innerHTML = p['ownerName']
    document.getElementById("datum").innerHTML = p['anlagedat']
}