// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Startscript ereignisraum.html
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.10.29
 * @license GPL-3.0-or-later
*/

import "./import_jquery.js";
import 'chosen-js';
import 'chosen-js/chosen.css';
import 'jquery-ui';
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css';
import '../css/html_forms.css';
import '../css/index.css';
import { HTML } from './HTML';
import { PublicWFS } from './PublicWFS';
import { Projekt } from "./Klassen/Projekt";

class ERauswahl {
    private er: Projekt[] = []
    private anlegenDialog: JQuery<HTMLElement>;
    private select: HTMLSelectElement;
    private jSelect: JQuery<HTMLElement>;

    constructor() {
        this.select = document.getElementById("er_select") as HTMLSelectElement;
        this.select.addEventListener("change", this.chosenElementSelected.bind(this));
        this.jSelect = $(this.select).chosen({ placeholder_text_single: "Ereignisräume werden geladen..." });
        this.jSelect.on("change", this.chosenElementSelected.bind(this));

        document.getElementById("pruefen").addEventListener("click", this.pruefeER.bind(this));
        document.getElementById("anlegen").addEventListener("click", this.legeERan.bind(this));

        this.loadER();
    }
    //?Service=WFS&Request=GetFeature&TypeName=Projekt&Filter=<Filter><PropertyIsEqualTo><PropertyName>status</PropertyName><Literal>1</Literal></PropertyIsEqualTo></Filter>

    private async loadER(projektnr?: number) {
        this.er = await Projekt.loadER();
        this.select.innerHTML = ""

        for (let projekt of this.er) {
            this.chosenCreateAuswahlPunkt(projekt, projektnr);
        }

        if (this.er.length > 0) {
            this.chosenElementSelected();
            this.select.disabled = false;
            (document.getElementById("submit") as HTMLInputElement).disabled = false;
            (document.getElementById("pruefen") as HTMLInputElement).disabled = false;
        } else {
            let option = document.createElement("option");
            option.id = "platzhalter";
            option.textContent = "Keine Ereignisräume vorhanden!";
            this.select.innerHTML = ""
            this.select.appendChild(option);
        }
        this.jSelect.trigger("chosen:updated")
    }

    private chosenCreateAuswahlPunkt(projekt: Projekt, auswahl_projektnr: number) {
        let o = document.createElement('option');
        let v = document.createAttribute("value");
        if (projekt.nr == auswahl_projektnr)
            o.selected = true;
        v.value = projekt.fid;
        o.setAttributeNode(v);
        let t = document.createTextNode(String(projekt.nr).substr(11) + " - " + projekt.kurzbez);
        o.appendChild(t);
        this.select.appendChild(o);
    }

    private chosenElementSelected() {
        for (let projekt of this.er) {
            if (projekt.fid != this.select.value) continue;
            (document.getElementById("ernr") as HTMLInputElement).value = projekt.nr.toString();
            document.getElementById("nummer").innerHTML = projekt.nr.toString();
            document.getElementById("kurzbez").innerHTML = projekt.kurzbez;
            document.getElementById("langbez").innerHTML = projekt.langbez;
            document.getElementById("bearbeiter").innerHTML = (projekt.ownerName != projekt.bearbeiter) ? (projekt.ownerName + "/" + projekt.bearbeiter) : projekt.bearbeiter;
            document.getElementById("datum").innerHTML = projekt.anlagedat;
            break;
        }
    }

    private pruefeER() {
        PublicWFS.testER((document.getElementById("ernr") as HTMLInputElement).value)
            .then((erg) => { this.pruefeCallback(erg.erfolgreich, erg.fehler ?? undefined) })
            .catch(() => { PublicWFS.showMessage("Fehler beim Prüfen", true) });
    }

    private pruefeCallback(erfolg: boolean, fehlerliste?: Element[]) {
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


    private legeERan() {
        let dialog = document.createElement("div");
        let sibnutzer = HTML.createTextInput(dialog, "SIB-Nutzer", "sibnutzer")
        let kurzBez = HTML.createTextInput(dialog, "Kurzbezeichnung", "kurzbez")
        HTML.createBreak(dialog);
        HTML.createBreak(dialog);
        let langBez = HTML.createTextInput(dialog, "Langbezeichnung", "langbez")
        this.anlegenDialog = $(dialog).dialog({
            resizable: true,
            height: "300",
            width: '250',
            title: "Ereignisraum anlegen",
            modal: true,
            buttons: {
                "Anlegen": () => {
                    Projekt.create(kurzBez.value, langBez.value, sibnutzer.value)
                        .then((projekt) => {
                            this.chosenCreateAuswahlPunkt(projekt, projekt.nr)
                            this.er.push(projekt);
                            this.jSelect.trigger("chosen:updated")
                            this.anlegenDialog.dialog("close");
                            this.chosenElementSelected();
                        });
                },
                "Abbrechen": () => {
                    this.anlegenDialog.dialog("close");
                }
            }
        });
    }
}


window.addEventListener('load', () => {
    new ERauswahl();
});