// SPDX-License-Identifier: GPL-3.0-or-later

import "../../import_jquery.js";
import 'chosen-js';
import 'chosen-js/chosen.css';
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css';
import { EventsKey } from 'ol/events';
import { never, pointerMove } from 'ol/events/condition';
import { Select as SelectInteraction } from 'ol/interaction';
import { SelectEvent } from 'ol/interaction/Select';
import { unByKey } from 'ol/Observable';
import '../../../css/vzadd.css';
import { Daten } from '../../Daten';
import { HTML } from '../../HTML';
import { Aufstellvorrichtung } from '../../Objekte/Aufstellvorrichtung';
import { Klartext } from '../../Objekte/Klartext';
import { Zeichen } from '../../Objekte/Zeichen';
import { Map } from "../../openLayers/Map";
import { PublicWFS } from '../../PublicWFS';
import { Tool } from '../prototypes/Tool';
var CONFIG = require('../../config.json');

/**
 * Funktion zum Hinzufügen von Verkehrsschildern
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.10.29
 * @license GPL-3.0-or-later
*/
export class AvVzAdd extends Tool {
    private ausblenden: any = null;
    private liste: any = null;
    private auswahl: Aufstellvorrichtung = null;
    private popup: HTMLDivElement;
    private select: SelectInteraction;
    private mouseOver: SelectInteraction;
    private lastOverlay: Aufstellvorrichtung;
    private buttonSpeichern: HTMLButtonElement;
    private selectKey: EventsKey;

    /**
     * Erzeugt eine Instanz des Verkehrszeichen-Hinzufügen-Tools
     * @param map Karten-Objekt
     * @param daten Daten-Objekt
     */
    constructor(map: Map) {
        super(map);

        this.select = Aufstellvorrichtung.getSelect();

        this.mouseOver = new SelectInteraction({
            layers: [Aufstellvorrichtung.getLayer()],
            toggleCondition: never,
            condition: pointerMove
        });
        this.mouseOver.on("select", this.mouseIsOver.bind(this))
    }

    /**
     * Listener für die Auswahl einer Aufstellvorrichtung
     * @param event Select-Event-Objekt
     */
    private featureSelected() {
        // Filtern, wenn nichts ausgewählt wurde
        if (this.select.getFeatures().getLength() == 0) {
            return;
        }
        this.auswahl = this.select.getFeatures().item(0) as Aufstellvorrichtung;

        // Popup erzeugen
        this.ausblenden = document.createElement("div");
        this.ausblenden.id = "vzadd_ausblenden";
        this.popup = document.createElement("div");
        this.popup.id = "vz_popup";
        this.popup.style.textAlign = "left";
        this.ausblenden.appendChild(this.popup);


        this.liste = document.createElement("div");
        $(this.liste).sortable({
            placeholder: "ui-state-highlight"
        });
        $(this.liste).disableSelection();
        this.liste.classList.add("schilderListe")
        this.popup.appendChild(this.liste);


        let stvoZNrNeu = Klartext.createKlartextSelectForm('Itvzstvoznr', this.popup, 'Verkehrszeichen', 'stvoznr_neu', undefined, "Neues Schild hinzufügen...")

        $(stvoZNrNeu.select).on("change", this.newSchild.bind(this));

        this.popup.appendChild(document.createElement("br"));

        this.buttonSpeichern = document.createElement('button');
        this.buttonSpeichern.addEventListener("click", this.save.bind(this));
        this.buttonSpeichern.innerHTML = "Speichern";
        this.buttonSpeichern.disabled = true;
        this.popup.appendChild(this.buttonSpeichern);

        let buttonAbbrechen = document.createElement('button');
        buttonAbbrechen.addEventListener("click", this._closePopup.bind(this));
        buttonAbbrechen.innerHTML = "Abbrechen";
        buttonAbbrechen.style.marginBottom = "250px";
        this.popup.appendChild(buttonAbbrechen);

        Promise.all([
            this.auswahl.getZeichen(true)
                .then((zeichen) => {
                    $(this.ausblenden).hide()
                    document.body.appendChild(this.ausblenden);
                    $(this.ausblenden).fadeIn("fast")
                    return this._zeichenGeladen(zeichen)
                }),
            stvoZNrNeu.promise
        ]).then(() => {
            this.buttonSpeichern.disabled = false;
        });
    }

    private mouseIsOver(event: SelectEvent) {
        for (let sel of event.deselected) {
            (sel as Aufstellvorrichtung).hideOverlay(this.map);
            this.lastOverlay = (sel as Aufstellvorrichtung);
        }
        for (let sel of event.selected) {
            (sel as Aufstellvorrichtung).showOverlay(this.map);
            this.lastOverlay = undefined;
        }
    }

    /**
     * Listener für das Hinzufügen eines neuen Verkehrszeichens
     */
    private newSchild(event: JQueryEventObject) {
        let schild = new Zeichen();
        schild.setStvoznr((event.target as HTMLInputElement).value);
        let vorherDisabled = false;
        if (!this.buttonSpeichern.disabled) {
            this.buttonSpeichern.disabled = true;
            vorherDisabled = true;
        }
        this.createSchildForm(schild)
            .then(() => {
                if (vorherDisabled)
                    this.buttonSpeichern.disabled = false;
            });

    }

    private _zeichenGeladen(zeichen: Zeichen[]): Promise<void[][]> {
        zeichen.sort(function (a: Zeichen, b: Zeichen) {
            if (a.getSort() == null && b.getSort() == null) return 0;
            if (a.getSort() == null) return -1;
            if (b.getSort() == null) return 1;
            return Number(a.getSort()) - Number(b.getSort());
        });
        let tasks = [];
        for (let eintrag of zeichen) {
            tasks.push(this.createSchildForm(eintrag));
        }
        return Promise.all(tasks);
    }

    /**
     * Erzeugt pro Schild ein Änderungsformular
     * @param {Zeichen} eintrag Schild, für welches das Formular erzeugt werden soll
     */
    private async createSchildForm(eintrag: Zeichen): Promise<void[]> {
        let div = document.createElement("form");
        this.liste.appendChild(div);
        div.dataset.oid = eintrag.getObjektId();
        div.classList.add('ui-state-default');
        div.classList.add('schild');

        // Abbildung
        let img = document.createElement("img");
        img.classList.add('schildBild');
        img.style.height = "50px";
        Klartext.load("Itvzstvoznr")
            .then(() => {
                img.src = CONFIG['SCHILDERPFAD'] + eintrag.getStvoznr().getKt() + ".svg";
                img.title = eintrag.getStvoznr().getBeschreib() + (eintrag.getVztext() != null) ? ("\n" + eintrag.getVztext()) : ('');
            });
        div.appendChild(img);

        //Formular
        let text = document.createElement("div");
        let tasks: Promise<void>[] = [];
        div.appendChild(text);
        text.classList.add('schildText');

        // StVOZNR
        let stvoznr = Klartext.createKlartextSelectForm('Itvzstvoznr', text, 'Verkehrszeichen', 'stvoznr', eintrag.getStvoznr())
        tasks.push(stvoznr.promise)
        $(stvoznr.select).on("change", function () {
            let schild = Klartext.get("Itvzstvoznr", stvoznr.select.value)
            img.src = CONFIG['SCHILDERPFAD'] + schild.getKt() + ".svg";
            img.title = schild['beschreib'];
        });

        // Text
        HTML.createTextInput(text, "Text", "vztext", ((eintrag.getVztext() !== null) ? (eintrag.getVztext()) : ('')))

        // Lage FB
        if (eintrag.getLageFb() == undefined) eintrag.setLageFb(CONFIG.LAGEFB);
        tasks.push(Klartext.createKlartextSelectForm('Itvzlagefb', text, 'Lage', 'lageFb', eintrag.getLageFb()).promise)

        // Lesbarkeit
        if (eintrag.getLesbarkeit() == undefined) eintrag.setLesbarkeit(CONFIG.LESBARKEIT);
        tasks.push(Klartext.createKlartextSelectForm('Itvzlesbarkeit', text, 'Lesbarkeit', 'lesbarkeit', eintrag.getLesbarkeit()).promise)

        // Beleuchtet
        if (eintrag.getBeleucht() == undefined) eintrag.setBeleucht(CONFIG.BELEUCHTET);
        tasks.push(Klartext.createKlartextSelectForm('Itvzbeleucht', text, 'Beleuchtung', 'beleucht', eintrag.getBeleucht()).promise)

        //Einzelschild
        if (eintrag.getArt() == undefined) eintrag.setArt(CONFIG.EINZELSCHILD);
        tasks.push(Klartext.createKlartextSelectForm('Itvzart', text, 'Art', 'art', eintrag.getArt()).promise)

        // Größe des Schilder
        if (eintrag.getGroesse() == undefined) eintrag.setGroesse(CONFIG.GROESSE);
        tasks.push(Klartext.createKlartextSelectForm('Itvzgroesse', text, 'Größe', 'groesse', eintrag.getGroesse()).promise)

        // Straßenbezug
        if (eintrag.getStrbezug() == undefined) eintrag.setStrbezug(CONFIG.STRASSENBEZUG);
        tasks.push(Klartext.createKlartextSelectForm('Itbesstrbezug', text, 'Straßenbezug', 'strbezug', eintrag.getStrbezug()).promise)

        // Aufstelldatum
        let aufstdat = HTML.createDateInput(text, "Aufstelldatum", "aufstelldat" + Math.round(Math.random() * 2000), ((eintrag.getAufstelldat() != null) ? (eintrag.getAufstelldat()) : ('')));
        aufstdat.classList.add("aufstelldat")

        // Ext. Objektnummer
        HTML.createTextInput(text, 'Externe Objektnummer', "objektnr", ((eintrag.getObjektnr() != null) ? (eintrag.getObjektnr()) : ('')));

        // Erfassungsart
        if (eintrag.getErfart() == undefined) eintrag.setErfart(CONFIG.ERFASSUNG);
        tasks.push(Klartext.createKlartextSelectForm('Iterfart', text, 'Erfassung', 'erfart', eintrag.getErfart()).promise)

        // Quelle
        if (eintrag.getQuelle() == undefined) eintrag.setQuelle(CONFIG.QUELLE);
        tasks.push(Klartext.createKlartextSelectForm('Itquelle', text, 'Quelle', 'quelle', eintrag.getQuelle()).promise)

        // Löschen
        let del_group = document.createElement("div");
        del_group.className = "form_group";
        let buttonLoeschen = document.createElement('button');
        buttonLoeschen.addEventListener("click", function (event) {
            event.preventDefault();
            $("#dialog-confirm")[0].title = "Schild wirklich löschen?";
            $("#dialog-confirm #text")[0].innerHTML = "M&ouml;chten Sie dieses Schild wirklich löschen?";
            $("#dialog-confirm").dialog({
                resizable: false,
                height: "auto",
                width: 400,
                modal: true,
                buttons: {
                    "Schild löschen": function () {
                        $((event.target as HTMLUnknownElement).parentElement.parentElement.parentElement).remove();
                        $(this).dialog("close");
                    },
                    "Schließen": function () {
                        $(this).dialog("close");
                    }
                }
            });

        });
        buttonLoeschen.innerHTML = "Löschen";
        buttonLoeschen.style.backgroundColor = "#f99";
        $(buttonLoeschen).button();
        del_group.appendChild(buttonLoeschen);
        text.appendChild(del_group);
        return Promise.all(tasks);
    }

    /**
     * Wird durch Klick auf "Speichern" ausgelöst, prüft Änderungen und listet diese auf
     * @param {MouseEvent} event 
     */
    private save(event: MouseEvent) {
        let neu: Zeichen[] = [];
        let alt: { [objektid: string]: Zeichen } = {};

        // Alle Schilder-Formulare auf Änderungen prüfen
        let forms = this.popup.getElementsByTagName("form");
        for (let i = 0; i < forms.length; i++) {
            //form of this._popup.getElementsByTagName("form")) {
            let eintraege = $(forms[i]).children(".schildText");
            if (eintraege.length == 0) break;
            let eintrag = eintraege[0];
            let schild = new Zeichen();
            schild.setObjektId(forms[i].dataset.oid);
            schild.setSort(i + 1);
            schild.setStvoznr(($(eintrag).children().children("select#stvoznr")[0] as HTMLInputElement).value);
            schild.setVztext(($(eintrag).children().children("input#vztext")[0] as HTMLInputElement).value);
            if (schild.getVztext() == "") schild.setVztext(null);
            schild.setLageFb(($(eintrag).children().children("select#lageFb")[0] as HTMLInputElement).value);
            schild.setLesbarkeit(($(eintrag).children().children("select#lesbarkeit")[0] as HTMLInputElement).value);
            schild.setBeleucht(($(eintrag).children().children("select#beleucht")[0] as HTMLInputElement).value);
            schild.setArt(($(eintrag).children().children("select#art")[0] as HTMLInputElement).value);
            schild.setGroesse(($(eintrag).children().children("select#groesse")[0] as HTMLInputElement).value);
            schild.setStrbezug(($(eintrag).children().children("select#strbezug")[0] as HTMLInputElement).value);
            schild.setAufstelldat(($(eintrag).children().children("input.aufstelldat")[0] as HTMLInputElement).value);
            schild.setErfart(($(eintrag).children().children("select#erfart")[0] as HTMLInputElement).value);
            schild.setQuelle(($(eintrag).children().children("select#quelle")[0] as HTMLInputElement).value);
            schild.setObjektnr(($(eintrag).children().children("input#objektnr")[0] as HTMLInputElement).value);
            if (schild.getObjektnr() == "") schild.setObjektnr(null);
            if (schild.getObjektId().length < 10) { // undefined
                neu.push(schild);
            } else {
                alt[schild.getObjektId()] = schild;
            }
        }
        console.log(this.auswahl.getZeichen());
        console.log(neu);
        console.log(alt);

        let update = ""
        let anzDelete = 0, anzUpdate = 0;
        this.auswahl.getZeichen()
            .then((zeichen) => {
                for (let oldZeichen_i in zeichen as Zeichen[]) {
                    let oldZeichen = zeichen[oldZeichen_i] as Zeichen;
                    if (oldZeichen.getObjektId() in alt) {
                        let modiZeichen = alt[oldZeichen.getObjektId()] as Zeichen;
                        let upd = "";
                        if (oldZeichen.getSort() != modiZeichen.getSort()) {
                            upd += '<wfs:Property>\n<wfs:Name>sort</wfs:Name>\n<wfs:Value>' + modiZeichen.getSort() + '</wfs:Value>\n</wfs:Property>\n';
                            console.log("update sort");
                        }
                        if (oldZeichen.getStvoznr().getXlink() != modiZeichen.getStvoznr().getXlink()) {
                            upd += '<wfs:Property>\n<wfs:Name>stvoznr/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getStvoznr().getXlink() + '</wfs:Value>\n</wfs:Property>\n';
                            console.log("update stvoznr");
                        }
                        if (oldZeichen.getVztext() != modiZeichen.getVztext()) {
                            upd += '<wfs:Property>\n<wfs:Name>vztext</wfs:Name>\n<wfs:Value>' + ((modiZeichen.getVztext() != null) ? modiZeichen.getVztext() : '') + '</wfs:Value>\n</wfs:Property>\n';
                            console.log("update text");
                        }
                        if (oldZeichen.getLageFb() == null || oldZeichen.getLageFb().getXlink() != modiZeichen.getLageFb().getXlink()) {
                            upd += '<wfs:Property>\n<wfs:Name>lageFb/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getLageFb().getXlink() + '</wfs:Value>\n</wfs:Property>\n';
                            console.log("update lageFb");
                        }
                        if (oldZeichen.getLesbarkeit() == null || oldZeichen.getLesbarkeit().getXlink() != modiZeichen.getLesbarkeit().getXlink()) {
                            upd += '<wfs:Property>\n<wfs:Name>lesbarkeit/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getLesbarkeit().getXlink() + '</wfs:Value>\n</wfs:Property>\n';
                            console.log("update text");
                        }
                        if (oldZeichen.getBeleucht() == null || oldZeichen.getBeleucht().getXlink() != modiZeichen.getBeleucht().getXlink()) {
                            upd += '<wfs:Property>\n<wfs:Name>beleucht/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getBeleucht().getXlink() + '</wfs:Value>\n</wfs:Property>\n';
                            console.log("update beleucht");
                        }
                        if (oldZeichen.getArt() == null || oldZeichen.getArt().getXlink() != modiZeichen.getArt().getXlink()) {
                            upd += '<wfs:Property>\n<wfs:Name>art/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getArt().getXlink() + '</wfs:Value>\n</wfs:Property>\n';
                            console.log("update art");
                        }

                        if (oldZeichen.getGroesse() == null || oldZeichen.getGroesse().getXlink() != modiZeichen.getGroesse().getXlink()) {
                            upd += '<wfs:Property>\n<wfs:Name>groesse/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getGroesse().getXlink() + '</wfs:Value>\n</wfs:Property>\n';
                            console.log("update groesse");
                        }

                        if (oldZeichen.getStrbezug() == null || oldZeichen.getStrbezug().getXlink() != modiZeichen.getStrbezug().getXlink()) {
                            upd += '<wfs:Property>\n<wfs:Name>strbezug/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getStrbezug().getXlink() + '</wfs:Value>\n</wfs:Property>\n';
                            console.log("update strbezug");
                        }

                        if (oldZeichen.getAufstelldat() != modiZeichen.getAufstelldat() && !(oldZeichen.getAufstelldat() == null && modiZeichen.getAufstelldat() == "")) {
                            upd += '<wfs:Property>\n<wfs:Name>aufstelldat</wfs:Name>\n<wfs:Value>' + modiZeichen.getAufstelldat() + '</wfs:Value>\n</wfs:Property>\n';
                            console.log("update aufstelldat");
                        }

                        if (oldZeichen.getErfart() == null || oldZeichen.getErfart().getXlink() != modiZeichen.getErfart().getXlink()) {
                            upd += '<wfs:Property>\n<wfs:Name>erfart/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getErfart() + '</wfs:Value>\n</wfs:Property>\n';
                            console.log("update erfart");
                        }

                        if (oldZeichen.getQuelle() == null || oldZeichen.getQuelle().getXlink() != modiZeichen.getQuelle().getXlink()) {
                            upd += '<wfs:Property>\n<wfs:Name>quelle/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getQuelle() + '</wfs:Value>\n</wfs:Property>\n';
                            console.log("update quelle");
                        }

                        if (oldZeichen.getObjektnr() != modiZeichen.getObjektnr()) {
                            upd += '<wfs:Property>\n<wfs:Name>objektnr</wfs:Name>\n<wfs:Value>' + modiZeichen.getObjektnr() + '</wfs:Value>\n</wfs:Property>\n';
                            console.log("update objektnr");
                        }

                        if (upd != "") {
                            anzUpdate += 1
                            update += '<wfs:Update typeName="Otvzeichlp">\n' +
                                '	<ogc:Filter>\n' +
                                '		<ogc:And>\n' +
                                '			<ogc:PropertyIsEqualTo>\n' +
                                '				<ogc:PropertyName>objektId</ogc:PropertyName>\n' +
                                '				<ogc:Literal>' + oldZeichen.getObjektId() + '</ogc:Literal>\n' +
                                '			</ogc:PropertyIsEqualTo>\n' +
                                '			<ogc:PropertyIsEqualTo>\n' +
                                '				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
                                '				<ogc:Literal>' + Daten.getInstanz().ereignisraum + '</ogc:Literal>\n' +
                                '			</ogc:PropertyIsEqualTo>\n' +
                                '		</ogc:And>\n' +
                                '	</ogc:Filter>\n' + upd +
                                '</wfs:Update>\n';
                        }
                    } else {
                        console.log("delete");
                        anzDelete += 1
                        update += '<wfs:Delete typeName="Otvzeichlp">\n' +
                            '	<ogc:Filter>\n' +
                            '		<ogc:And>\n' +
                            '			<ogc:PropertyIsEqualTo>\n' +
                            '				<ogc:PropertyName>objektId</ogc:PropertyName>\n' +
                            '				<ogc:Literal>' + oldZeichen.getObjektId() + '</ogc:Literal>\n' +
                            '			</ogc:PropertyIsEqualTo>\n' +
                            '			<ogc:PropertyIsEqualTo>\n' +
                            '				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
                            '				<ogc:Literal>#' + Daten.getInstanz().ereignisraum + '</ogc:Literal>\n' +
                            '			</ogc:PropertyIsEqualTo>\n' +
                            '		</ogc:And>\n' +
                            '	</ogc:Filter>\n' +
                            '</wfs:Delete>\n';
                    }
                }
                for (let zeichen of neu) {
                    console.log("neu");
                    if (zeichen.getVztext == null) zeichen.setVztext("");
                    update += '<wfs:Insert>\n<Otvzeichlp>\n' +
                        '<projekt typeName="Projekt" xlink:href="#' + Daten.getInstanz().ereignisraum + '"/>\n' +
                        '<sort>' + zeichen.getSort() + '</sort>\n' +
                        '<stvoznr xlink:href="#S' + zeichen.getStvoznr() + '" typeName="Itvzstvoznr" />\n' +
                        '<vztext>' + ((zeichen.getVztext() != null) ? zeichen.getVztext() : '') + '</vztext>\n' +
                        '<lageFb xlink:href="#S' + zeichen.getLageFb() + '" typeName="Itvzlagefb" />\n' +
                        '<lesbarkeit xlink:href="#S' + zeichen.getLesbarkeit() + '" typeName="Itvzlesbarkeit" />\n' +
                        '<beleucht xlink:href="#S' + zeichen.getBeleucht() + '" typeName="Itvzbeleucht" />\n' +
                        '<art xlink:href="#' + zeichen.getArt() + '" typeName="Itvzart" />\n' +
                        '<parent typeName="Otaufstvor" xlink:href="#' + this.auswahl.getFid() + '"/>\n' +
                        '<groesse xlink:href="#' + zeichen.getGroesse() + '" typeName="Itvzgroesse" />\n' +
                        '<strbezug xlink:href="#' + zeichen.getStrbezug() + '" typeName="Itbesstrbezug" />\n' +
                        '<aufstelldat>' + zeichen.getAufstelldat() + '</aufstelldat>\n' +
                        ((zeichen.getObjektnr() != null && zeichen.getObjektnr() != '') ? ('<objektnr>' + zeichen.getObjektnr() + '</objektnr>\n') : '') +
                        '<erfart xlink:href="#' + zeichen.getErfart() + '" typeName="Iterfart" />\n' +
                        '<quelle xlink:href="#' + zeichen.getQuelle() + '" typeName="Itquelle" />\n' +
                        '<ADatum>' + new Date().toISOString().slice(0, 10) + '</ADatum>\n' +
                        '</Otvzeichlp>\n</wfs:Insert>';

                }

                if ((anzDelete + anzUpdate + neu.length) > 0) {
                    $("#dialog-confirm")[0].title = "Änderungen bestätigen";
                    $("#dialog-confirm #text")[0].innerHTML = "Es werden folgende Änderungen durchgeführt:<br /><br />" +
                        anzDelete + " Schilder löschen<br />" +
                        anzUpdate + " ändern<br />" +
                        neu.length + " hinzugefügen<br /><br />" +
                        "Wollen Sie fortfahren?";
                    let dialog = $("#dialog-confirm").dialog({
                        resizable: false,
                        height: "auto",
                        width: 400,
                        modal: true,
                        buttons: {
                            "Daten schreiben": () => {
                                this.writeData(update).then(() => {
                                    $(this.ausblenden).fadeOut();
                                })
                                    .catch()
                                    .finally(() => { dialog.dialog("close") });
                            },
                            "Abbrechen": function () {
                                dialog.dialog("close");
                            }
                        }
                    });
                } else {
                    $((event.target as HTMLElement).parentElement.parentElement).remove();
                }
            });
    }

    /**
     * Wird aufgerufen, nachdem erfolgreich oder erfolglos versucht wurde, die Aufstellvorrichtung in den Ereignisraum zu laden
     * @param {string} update Transaktion als Text
     * @param {*} auswahl 
     */
    private async writeData(update: string): Promise<void> {
        $((event.target as HTMLElement).parentElement.parentElement).remove();

        return PublicWFS.addSekInER(this.auswahl, "Otaufstvor", "Otvzeichlp", Daten.getInstanz().ereignisraum_nr)
            .catch(() => {
                console.log("Nicht in ER kopiert")
            })
            .then(() => {
                console.log("Update wird ausgeführt...")
                return PublicWFS.doTransaction(update);
            })
            .then(() => {
                console.log("Zeichen wird neugeladen...")
                this.select.getFeatures().clear();
                return this.auswahl.reloadZeichen()
            })
            .then(() => {
                PublicWFS.showMessage("erfolgreich", false)
                return Promise.resolve();
            }).catch(() => {
                PublicWFS.showMessage("Fehler beim Schreiben von Daten", true);
                return Promise.reject();
            })

    }

    /**
     * Schließt das Popup mit den Schildern
     * @param {*} event 
     */
    _closePopup(__: any) {
        //this._ausblenden.remove();
        document.body.removeChild(this.ausblenden);
        this.select.getFeatures().clear();
        this.auswahl = null;
    }

    start() {
        this.map.addInteraction(this.select);
        this.selectKey = this.select.on("select", this.featureSelected.bind(this));
        this.map.addInteraction(this.mouseOver);
        if (this.select.getFeatures().getLength() > 0)
            this.featureSelected()
    }

    stop() {
        this.map.removeInteraction(this.select);
        unByKey(this.selectKey);
        this.map.removeInteraction(this.mouseOver);
        if (this.lastOverlay) this.lastOverlay.hideOverlay(this.map)
    }
}
