// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Startscript ereignisraum.html
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.10.29
 * @license GPL-3.0-or-later
*/

import 'chosen-js';
import 'chosen-js/chosen.css';
import 'jquery-ui';
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css';
import '../css/html_forms.css';
import '../css/index.css';
import HTML from './HTML';
import "./import_jquery.js";
import PublicWFS from './PublicWFS';


window.addEventListener('load', function () { loadER() });

var er: {
    fid: string,
    nr: number,
    kurzbez: string,
    langbez: string,
    ownerName: string,
    bearbeiter: string,
    anlagedat: string
}[] = []
let select: HTMLSelectElement = document.getElementById("er_select") as HTMLSelectElement;
select.addEventListener("change", aenderung);
let jSelect = $(select).chosen({ placeholder_text_single: "Ereignisräume werden geladen..." });
jSelect.on("change", aenderung);

document.getElementById("pruefen").addEventListener("click", pruefeER);
document.getElementById("anlegen").addEventListener("click", legeERan);

//?Service=WFS&Request=GetFeature&TypeName=Projekt&Filter=<Filter><PropertyIsEqualTo><PropertyName>status</PropertyName><Literal>1</Literal></PropertyIsEqualTo></Filter>

function loadER(projektnr?: number): Promise<void> {
    return PublicWFS.doQuery('Projekt',
        '<Filter><And>' +
        '<PropertyIsEqualTo><PropertyName>status</PropertyName>' +
        '<Literal>1</Literal>' +
        '</PropertyIsEqualTo><PropertyIsEqualTo>' +
        '<PropertyName>typ</PropertyName>' +
        '<Literal>D</Literal>' +
        '</PropertyIsEqualTo>' +
        '</And></Filter>').then((xml: Document) => { readER(xml, projektnr) });
}

function readER(xml: Document, projektnr?: number) {
    let proj = xml.getElementsByTagName("Projekt")
    select.innerHTML = ""

    er = [];

    for (var i = 0; i < proj.length; i++) {
        let projekt: {
            fid: string,
            nr: number,
            kurzbez: string,
            langbez: string,
            ownerName: string,
            bearbeiter: string,
            anlagedat: string
        } = {
            fid: null,
            nr: null,
            kurzbez: "",
            langbez: "",
            ownerName: "",
            bearbeiter: "",
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
        projekt.bearbeiter = proj[i].getElementsByTagName("bearbeiter")[0].firstChild.textContent
        projekt.anlagedat = proj[i].getElementsByTagName("anlagedat")[0].firstChild.textContent

        er.push(projekt);
    }

    er.sort(function (a, b) {
        return Number(a.nr) - Number(b.nr);
    });

    for (let projekt of er) {
        let o = document.createElement('option')
        let v = document.createAttribute("value")
        if (projekt.nr == projektnr)
            o.selected = true;
        v.value = projekt.fid
        o.setAttributeNode(v);
        let t = document.createTextNode(String(projekt.nr).substr(11) + " - " + projekt.kurzbez);
        o.appendChild(t)
        select.appendChild(o)
    }

    if (proj.length > 0) {
        aenderung();
        select.disabled = false;
        (document.getElementById("submit") as HTMLInputElement).disabled = false;
        (document.getElementById("pruefen") as HTMLInputElement).disabled = false;
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
        document.getElementById("bearbeiter").innerHTML = (projekt.ownerName != projekt.bearbeiter) ? (projekt.ownerName + "/" + projekt.bearbeiter) : projekt.bearbeiter;
        document.getElementById("datum").innerHTML = projekt.anlagedat;
        break;
    }
}

function pruefeER() {
    PublicWFS.testER((document.getElementById("ernr") as HTMLInputElement).value)
        .then((erg) => { pruefeCallback(erg.erfolgreich, erg.fehler ?? undefined) })
        .catch(() => { PublicWFS.showMessage("Fehler beim Prüfen", true) });
}

function pruefeCallback(erfolg: boolean, fehlerliste?: Element[]) {
    if (erfolg) {
        PublicWFS.showMessage("Erfolgreich geprüft");
        return;
    }

    let div = document.createElement("div");
    div.id = "fehlerliste"
    for (let fehler of fehlerliste) {
        let block = document.createElement("div");
        block.innerHTML = fehler.getElementsByTagNameNS("http://interfaceTypes.ttsib5.novasib.de/", 'message').item(0).innerHTML;
        if (fehler.getElementsByTagNameNS("http://interfaceTypes.ttsib5.novasib.de/", 'severity').item(0).innerHTML == "ERROR")
            block.className = "fehler"
        else
            block.className = "warnung"
        div.appendChild(block)
    }
    let jqueryDialog = $(div).dialog({
        resizable: true,
        height: "500",
        width: '500',
        title: "Prüfprotokoll " + (document.getElementById("ernr") as HTMLInputElement).value,
        modal: true,
        buttons: {
            "Schließen": function () {
                jqueryDialog.dialog("close");
            }
        }
    });
}

let anlegenDialog: JQuery<HTMLElement>;
function legeERan() {
    let dialog = document.createElement("div");
    let kurzBez = HTML.createTextInput(dialog, "Kurzbezeichnung", "kurzbez")
    HTML.createBreak(dialog);
    HTML.createBreak(dialog);
    let langBez = HTML.createTextInput(dialog, "Langbezeichnung", "langbez")
    anlegenDialog = $(dialog).dialog({
        resizable: true,
        height: "250",
        width: '250',
        title: "Ereignisraum anlegen",
        modal: true,
        buttons: {
            "Anlegen": function () {
                PublicWFS.anlegenER(kurzBez.value, langBez.value, false)
                    .then((xml) => {
                        let projektnr = Number.parseInt(xml.getElementsByTagNameNS('http://interfaceTypes.ttsib5.novasib.de/', 'ProjektNr').item(0).innerHTML)
                        return loadER(projektnr)
                    })
                    .then(() => { anlegenDialog.dialog("close") });
            },
            "Abbrechen": function () {
                anlegenDialog.dialog("close");
            }
        }
    });
}