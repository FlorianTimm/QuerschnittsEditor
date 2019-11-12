/**
 * Startscript ereignisraum.html
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */

import PublicWFS from './PublicWFS';
import "./import_jquery.js";
import 'chosen-js';
import 'chosen-js/chosen.css';
import '../css/index.css';

window.addEventListener('load', loadER);

var er: {
    fid: string,
    nr: number,
    kurzbez: string,
    langbez: string,
    ownerName: string,
    anlagedat: string
}[] = []
let select: HTMLSelectElement = document.getElementById("er_select") as HTMLSelectElement;
select.addEventListener("change", aenderung);
let jSelect = $(select).chosen({ placeholder_text_single: "Ereignisräume werden geladen..." });

//?Service=WFS&Request=GetFeature&TypeName=Projekt&Filter=<Filter><PropertyIsEqualTo><PropertyName>status</PropertyName><Literal>1</Literal></PropertyIsEqualTo></Filter>

function loadER() {
    PublicWFS.doQuery('Projekt',
        '<Filter><And>' +
        '<PropertyIsEqualTo><PropertyName>status</PropertyName>' +
        '<Literal>1</Literal>' +
        '</PropertyIsEqualTo><PropertyIsEqualTo>' +
        '<PropertyName>typ</PropertyName>' +
        '<Literal>D</Literal>' +
        '</PropertyIsEqualTo>' +
        '</And></Filter>', readER);
}

function readER(xml: Document) {
    let proj = xml.getElementsByTagName("Projekt")
    select.innerHTML = ""

    for (var i = 0; i < proj.length; i++) {
        let projekt: {
            fid: string,
            nr: number,
            kurzbez: string,
            langbez: string,
            ownerName: string,
            anlagedat: string
        } = {
            fid: null,
            nr: null,
            kurzbez: "",
            langbez: "",
            ownerName: "",
            anlagedat: null
        };

        projekt.fid = proj[i].getAttribute("fid")
        projekt.nr = parseInt(proj[i].getElementsByTagName("projekt")[0].firstChild.textContent);
        let kurzbez = proj[i].getElementsByTagName("kurzbez")
        if (kurzbez.length > 0)
            projekt.kurzbez = proj[i].getElementsByTagName("kurzbez")[0].firstChild.textContent
        else
            projekt.kurzbez = ""
        let langbez = proj[i].getElementsByTagName("langbez")
        if (langbez.length > 0)
            projekt.langbez = proj[i].getElementsByTagName("langbez")[0].firstChild.textContent
        else
            projekt.langbez = ""
        projekt.ownerName = proj[i].getElementsByTagName("ownerName")[0].firstChild.textContent
        projekt.anlagedat = proj[i].getElementsByTagName("anlagedat")[0].firstChild.textContent

        er.push(projekt);
    }

    console.log(er);
    er.sort(function (a, b) {
        return Number(a.nr) - Number(b.nr);
    });
    console.log(er);

    for (let projekt of er) {
        let o = document.createElement('option')
        let v = document.createAttribute("value")
        v.value = projekt.fid
        o.setAttributeNode(v);
        let t = document.createTextNode(String(projekt.nr).substr(11) + " - " + projekt.kurzbez);
        o.appendChild(t)
        select.appendChild(o)
    }
    //document.getElementById("platzhalter").remove();
    if (proj.length > 0) {
        aenderung();
        select.disabled = false;
        (document.getElementById("submit") as HTMLInputElement).disabled = false;
    } else {
        let option = document.createElement("option");
        option.id = "platzhalter";
        option.textContent = "Keine Ereignisräume vorhanden!";
        select.innerHTML = ""
        select.appendChild(option);
    }
    jSelect.trigger("chosen:updated")
}

function aenderung() {
    for (let projekt of er) {
        if (projekt.fid != select.value) continue;
        (document.getElementById("ernr") as HTMLInputElement).value = projekt.nr.toString();
        document.getElementById("nummer").innerHTML = projekt.nr.toString();
        document.getElementById("kurzbez").innerHTML = projekt.kurzbez;
        document.getElementById("langbez").innerHTML = projekt.langbez;
        document.getElementById("bearbeiter").innerHTML = projekt.ownerName;
        document.getElementById("datum").innerHTML = projekt.anlagedat;
        break;
    }
}