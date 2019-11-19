import { Select as SelectInteraction } from 'ol/interaction';
import '../../../css/vzadd.css';
import "../../import_jquery.js";
import 'chosen-js';
import 'chosen-js/chosen.css';
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css'
import PublicWFS from '../../PublicWFS';
import Tool from '../prototypes/Tool';
import Daten from '../../Daten';
import Map from "../../openLayers/Map";
import Zeichen from '../../Objekte/Zeichen';
import { SelectEvent } from 'ol/interaction/Select';
import KlartextManager, { KlartextMap } from '../../Objekte/Klartext';
import HTML from '../../HTML';
import Aufstellvorrichtung from '../../Objekte/Aufstellvorrichtung';
import Klartext from '../../Objekte/Klartext';
import { pointerMove, never } from 'ol/events/condition';
var CONFIG = require('../../config.json');

/**
 * Funktion zum Hinzufügen von Verkehrsschildern
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */
class AvVzAdd extends Tool {
    private ausblenden: any = null;
    private liste: any = null;
    private auswahl: Aufstellvorrichtung = null;
    private popup: HTMLDivElement;
    private select: SelectInteraction;
    private mouseOver: SelectInteraction;
    private lastOverlay: Aufstellvorrichtung;

    /**
     * Erzeugt eine Instanz des Verkehrszeichen-Hinzufügen-Tools
     * @param map Karten-Objekt
     * @param daten Daten-Objekt
     */
    constructor(map: Map) {
        super(map);

        this.select = new SelectInteraction({
            layers: [Aufstellvorrichtung.getLayer()],
            hitTolerance: 10
        });

        this.select.on("select", this._selected.bind(this));

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
    private _selected(event: SelectEvent) {
        // Filtern, wenn nichts ausgewählt wurde
        if (event.selected.length == 0) {
            return;
        }
        this.auswahl = event.selected[0] as Aufstellvorrichtung;

        // Popup erzeugen
        this.ausblenden = document.createElement("div");
        this.ausblenden.id = "vzadd_ausblenden";
        document.body.appendChild(this.ausblenden);
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


        let stvoZNrNeu = KlartextManager.createKlartextSelectForm('Itvzstvoznr', this.popup, 'Verkehrszeichen', 'stvoznr_neu', undefined, "Neues Schild hinzufügen...")

        $(stvoZNrNeu).on("change", this.newSchild.bind(this));

        this.popup.appendChild(document.createElement("br"));

        let buttonSpeichern = document.createElement('button');
        buttonSpeichern.addEventListener("click", this._save.bind(this));
        buttonSpeichern.innerHTML = "Speichern";
        this.popup.appendChild(buttonSpeichern);

        let buttonAbbrechen = document.createElement('button');
        buttonAbbrechen.addEventListener("click", this._closePopup.bind(this));
        buttonAbbrechen.innerHTML = "Abbrechen";
        buttonAbbrechen.style.marginBottom = "250px";
        this.popup.appendChild(buttonAbbrechen);

        this.auswahl.getZeichen(this._zeichenGeladen.bind(this))
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
        this._createSchildForm(schild);
    }

    private _zeichenGeladen(zeichen: Zeichen[]) {
        zeichen.sort(function (a: Zeichen, b: Zeichen) {
            if (a.getSort() == null && b.getSort() == null) return 0;
            if (a.getSort() == null) return -1;
            if (b.getSort() == null) return 1;
            return Number(a.getSort()) - Number(b.getSort());
        });
        for (let eintrag of zeichen) {
            this._createSchildForm(eintrag);
        }
    }

    /**
     * Erzeugt pro Schild ein Änderungsformular
     * @param {Zeichen} eintrag Schild, für welches das Formular erzeugt werden soll
     */
    private _createSchildForm(eintrag: Zeichen) {
        let div = document.createElement("form");
        this.liste.appendChild(div);
        div.dataset.oid = eintrag.getObjektId();
        div.classList.add('ui-state-default');
        div.classList.add('schild');

        // Abbildung
        let img = document.createElement("img");
        img.classList.add('schildBild');
        img.style.height = "50px";
        Klartext.load("Itvzstvoznr", function (_: KlartextMap) {
            img.src = "http://gv-srv-w00118:8080/schilder/" + eintrag.getStvoznr().getKt() + ".svg";
            img.title = eintrag.getStvoznr().getBeschreib() + (eintrag.getVztext() != null) ? ("\n" + eintrag.getVztext()) : ('');
        });
        div.appendChild(img);

        //Formular
        let text = document.createElement("div");
        div.appendChild(text);
        text.classList.add('schildText');

        // StVOZNR
        let stvoznr = Klartext.createKlartextSelectForm('Itvzstvoznr', text, 'Verkehrszeichen', 'stvoznr', eintrag.getStvoznr())
        $(stvoznr).on("change", function () {
            let schild = Klartext.get("Itvzstvoznr", stvoznr.value)
            img.src = "http://gv-srv-w00118:8080/schilder/" + schild.getKt() + ".svg";
            img.title = schild['beschreib'];
        });

        // Text
        HTML.createTextInput(text, "Text", "vztext", ((eintrag.getVztext() !== null) ? (eintrag.getVztext()) : ('')))

        // Lage FB
        if (eintrag.getLageFb() == undefined) eintrag.setLageFb(CONFIG.LAGEFB);
        KlartextManager.createKlartextSelectForm('Itvzlagefb', text, 'Lage', 'lageFb', eintrag.getLageFb())

        // Lesbarkeit
        if (eintrag.getLesbarkeit() == undefined) eintrag.setLesbarkeit(CONFIG.LESBARKEIT);
        KlartextManager.createKlartextSelectForm('Itvzlesbarkeit', text, 'Lesbarkeit', 'lesbarkeit', eintrag.getLesbarkeit())

        // Beleuchtet
        if (eintrag.getBeleucht() == undefined) eintrag.setBeleucht(CONFIG.BELEUCHTET);
        KlartextManager.createKlartextSelectForm('Itvzbeleucht', text, 'Beleuchtung', 'beleucht', eintrag.getBeleucht())

        //Einzelschild
        if (eintrag.getArt() == undefined) eintrag.setArt(CONFIG.EINZELSCHILD);
        KlartextManager.createKlartextSelectForm('Itvzart', text, 'Art', 'art', eintrag.getArt())

        // Größe des Schilder
        if (eintrag.getGroesse() == undefined) eintrag.setGroesse(CONFIG.GROESSE);
        KlartextManager.createKlartextSelectForm('Itvzgroesse', text, 'Größe', 'groesse', eintrag.getGroesse())

        // Straßenbezug
        if (eintrag.getStrbezug() == undefined) eintrag.setStrbezug(CONFIG.STRASSENBEZUG);
        KlartextManager.createKlartextSelectForm('Itbesstrbezug', text, 'Straßenbezug', 'strbezug', eintrag.getStrbezug())

        // Aufstelldatum
        HTML.createDateInput(text, "Aufstelldatum", "aufstelldat", ((eintrag.getAufstelldat() != null) ? (eintrag.getAufstelldat()) : ('')));

        // Ext. Objektnummer
        HTML.createTextInput(text, 'Externe Objektnummer', "objektnr", ((eintrag.getObjektnr() != null) ? (eintrag.getObjektnr()) : ('')));

        // Erfassungsart
        if (eintrag.getErfart() == undefined) eintrag.setErfart(CONFIG.ERFASSUNG);
        KlartextManager.createKlartextSelectForm('Iterfart', text, 'Erfassung', 'erfart', eintrag.getErfart())

        // Quelle
        if (eintrag.getQuelle() == undefined) eintrag.setQuelle(CONFIG.QUELLE);
        KlartextManager.createKlartextSelectForm('Itquelle', text, 'Quelle', 'quelle', eintrag.getQuelle())

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
    }

    /**
     * Wird durch Klick auf "Speichern" ausgelöst, prüft Änderungen und listet diese auf
     * @param {MouseEvent} event 
     */
    _save(event: MouseEvent) {
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
            schild.setAufstelldat(($(eintrag).children().children("input#aufstelldat")[0] as HTMLInputElement).value);
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
        let zeichen = this.auswahl.getZeichen();
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
                        '				<ogc:Literal>#' + Daten.getInstanz().ereignisraum + '</ogc:Literal>\n' +
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
            $("#dialog-confirm").dialog({
                resizable: false,
                height: "auto",
                width: 400,
                modal: true,
                buttons: {
                    "Daten schreiben": function (this: AvVzAdd) {
                        $((event.target as HTMLElement).parentElement.parentElement).remove();
                        PublicWFS.addSekInER(this.auswahl, "Otaufstvor", "Otvzeichlp", Daten.getInstanz().ereignisraum_nr, this._erCallback.bind(this), this._erCallback.bind(this), update, this.auswahl);
                        $("#dialog-confirm").dialog("close");
                    }.bind(this),
                    "Abbrechen": function () {
                        $(this).dialog("close");
                    }
                }
            });
        } else {
            $((event.target as HTMLElement).parentElement.parentElement).remove();
        }
    }

    /**
     * Wird aufgerufen, nachdem erfolgreich oder erfolglos versucht wurde, die Aufstellvorrichtung in den Ereignisraum zu laden
     * @param {*} __ 
     * @param {string} update Transaktion als Text
     * @param {*} _auswahl 
     */
    _erCallback(__: any, update: string, _auswahl: Aufstellvorrichtung) {
        console.log("Update: " + update)
        PublicWFS.doTransaction(update, this._updateCallback.bind(this), undefined, _auswahl);
    }


    /**
     * wird nach der Ausführung des Updates ausgeführt
     * @param {*} __ 
     * @param {*} _auswahl 
     */
    _updateCallback(__: any, _auswahl: Aufstellvorrichtung) {
        PublicWFS.showMessage("erfolgreich", false);
        console.log("reload");
        _auswahl.reloadZeichen();
        this.select.getFeatures().clear();
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
        this.map.addInteraction(this.mouseOver);
    }

    stop() {
        this.map.removeInteraction(this.select);
        this.map.removeInteraction(this.mouseOver);
        if (this.lastOverlay) this.lastOverlay.hideOverlay(this.map)
    }
}

export default AvVzAdd;
