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
import { Map } from 'ol';
import Zeichen from '../../Objekte/Zeichen';
import { SelectEvent } from 'ol/interaction/Select';
import Klartext from '../../Objekte/Klartext';
import HTML from '../../HTML';
import Aufstellvorrichtung from 'src/js/Objekte/Aufstellvorrichtung';
var CONFIG = require('../../config.json');

/**
 * Funktion zum Hinzufügen von Verkehrsschildern
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */
class AvVzAdd extends Tool {
    private _map: Map;
    private _daten: Daten;
    private _ausblenden: any = null;
    private _liste: any = null;
    private _auswahl: Aufstellvorrichtung = null;
    private _popup: HTMLDivElement;
    private _select: SelectInteraction;

    /**
     * Erzeugt eine Instanz des Verkehrszeichen-Hinzufügen-Tools
     * @param map Karten-Objekt
     * @param daten Daten-Objekt
     */
    constructor(map: Map) {
        super();
        this._map = map;
        this._daten = Daten.getInstanz();

        this._select = new SelectInteraction({
            layers: [this._daten.layerAufstell],
            hitTolerance: 10
        });

        this._select.on("select", this._selected.bind(this));
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
        this._auswahl = event.selected[0] as Aufstellvorrichtung;

        // Popup erzeugen
        this._ausblenden = document.createElement("div");
        this._ausblenden.id = "vzadd_ausblenden";
        document.body.appendChild(this._ausblenden);
        this._popup = document.createElement("div");
        this._popup.id = "vz_popup";
        this._popup.style.textAlign = "left";

        this._ausblenden.appendChild(this._popup);

        this._liste = document.createElement("div");
        $(this._liste).sortable({
            placeholder: "ui-state-highlight"
        });
        $(this._liste).disableSelection();
        this._liste.classList.add("schilderListe")
        this._popup.appendChild(this._liste);


        let stvoZNrNeu = Klartext.createKlartextSelectForm('Itvzstvoznr', this._popup, 'Verkehrszeichen', 'stvoznr_neu', undefined, "Neues Schild hinzufügen...")

        $(stvoZNrNeu).on("change", this.newSchild.bind(this));

        this._popup.appendChild(document.createElement("br"));

        let buttonSpeichern = document.createElement('button');
        buttonSpeichern.addEventListener("click", this._save.bind(this));
        buttonSpeichern.innerHTML = "Speichern";
        this._popup.appendChild(buttonSpeichern);

        let buttonAbbrechen = document.createElement('button');
        buttonAbbrechen.addEventListener("click", this._closePopup.bind(this));
        buttonAbbrechen.innerHTML = "Abbrechen";
        buttonAbbrechen.style.marginBottom = "250px";
        this._popup.appendChild(buttonAbbrechen);

        this._auswahl.getZeichen(this._zeichenGeladen.bind(this))
    }

    /**
     * Listener für das Hinzufügen eines neuen Verkehrszeichens
     * @param {MouseEvent} event Event-Objekt
     */
    private newSchild(event: MouseEvent) {
        let schild = new Zeichen();
        schild.setStvoznr((event.target as HTMLInputElement).value);
        this._createSchildForm(schild);
    }

    private _zeichenGeladen(zeichen: Zeichen[]) {
        zeichen.sort(function (a: Zeichen, b: Zeichen) {
            if (a.getSort() != null && b.getSort() != null) {
                return Number(a.getSort()) - Number(b.getSort());
            }
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
        this._liste.appendChild(div);
        div.dataset.oid = eintrag.getObjektId();
        div.classList.add('ui-state-default');
        div.classList.add('schild');

        // Abbildung
        let img = document.createElement("img");
        img.classList.add('schildBild');
        img.style.height = "50px";
        Klartext.getInstanz().load("Itvzstvoznr", function (klartext: { [oid: string]: { kt: string, beschreib: string, objektId: string } }) {
            img.src = "http://gv-srv-w00118:8080/schilder/" + klartext[eintrag.getStvoznr()].kt + ".svg";
            img.title = klartext[eintrag.getStvoznr()]['beschreib'] + (eintrag.getVztext() != null) ? ("\n" + eintrag.getVztext()) : ('');
        });
        div.appendChild(img);

        //Formular
        let text = document.createElement("div");
        div.appendChild(text);
        text.classList.add('schildText');

        // StVOZNR
        let stvoznr = Klartext.createKlartextSelectForm('Itvzstvoznr', text, 'Verkehrszeichen', 'stvoznr', eintrag.getStvoznr())
        $(stvoznr).on("change", function () {
            let schild = Klartext.getInstanz().get("Itvzstvoznr", stvoznr.value)
            img.src = "http://gv-srv-w00118:8080/schilder/" + schild['kt'] + ".svg";
            img.title = schild['beschreib'];
        });

        // Text
        HTML.createTextInput(text, "Text", "vztext", ((eintrag.getVztext() !== null) ? (eintrag.getVztext()) : ('')))

        // Lage FB
        if (eintrag.getLageFb() == undefined) eintrag.setLageFb(CONFIG.LAGEFB);
        Klartext.createKlartextSelectForm('Itvzlagefb', text, 'Lage', 'lageFb', eintrag.getLageFb())

        // Lesbarkeit
        if (eintrag.getLesbarkeit() == undefined) eintrag.setLesbarkeit(CONFIG.LESBARKEIT);
        Klartext.createKlartextSelectForm('Itvzlesbarkeit', text, 'Lesbarkeit', 'lesbarkeit', eintrag.getLesbarkeit())

        // Beleuchtet
        if (eintrag.getBeleucht() == undefined) eintrag.setBeleucht(CONFIG.BELEUCHTET);
        Klartext.createKlartextSelectForm('Itvzbeleucht', text, 'Beleuchtung', 'beleucht', eintrag.getBeleucht())

        //Einzelschild
        if (eintrag.getArt() == undefined) eintrag.setArt(CONFIG.EINZELSCHILD);
        Klartext.createKlartextSelectForm('Itvzart', text, 'Art', 'art', eintrag.getArt())

        // Größe des Schilder
        if (eintrag.getGroesse() == undefined) eintrag.setGroesse(CONFIG.GROESSE);
        Klartext.createKlartextSelectForm('Itvzgroesse', text, 'Größe', 'groesse', eintrag.getGroesse())

        // Straßenbezug
        if (eintrag.getStrbezug() == undefined) eintrag.setStrbezug(CONFIG.STRASSENBEZUG);
        Klartext.createKlartextSelectForm('Itbesstrbezug', text, 'Straßenbezug', 'strbezug', eintrag.getStrbezug())

        // Aufstelldatum
        HTML.createDateInput(text, "Aufstelldatum", "aufstelldat", ((eintrag.getAufstelldat() != null) ? (eintrag.getAufstelldat()) : ('')));

        // Ext. Objektnummer
        HTML.createTextInput(text, 'Externe Objektnummer', "objektnr", ((eintrag.getObjektnr() != null) ? (eintrag.getObjektnr()) : ('')));

        // Erfassungsart
        if (eintrag.getErfart() == undefined) eintrag.setErfart(CONFIG.ERFASSUNG);
        Klartext.createKlartextSelectForm('Iterfart', text, 'Erfassung', 'erfart', eintrag.getErfart())

        // Quelle
        if (eintrag.getQuelle() == undefined) eintrag.setQuelle(CONFIG.QUELLE);
        Klartext.createKlartextSelectForm('Itquelle', text, 'Quelle', 'quelle', eintrag.getQuelle())

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
                    Cancel: function () {
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
        let forms = this._popup.getElementsByTagName("form");
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
        console.log(this._auswahl.getZeichen());
        console.log(neu);
        console.log(alt);

        let update = ""
        let anzDelete = 0, anzUpdate = 0;
        let zeichen = this._auswahl.getZeichen();
        for (let oldZeichen_i in zeichen as Zeichen[]) {
            let oldZeichen = zeichen[oldZeichen_i] as Zeichen;
            if (oldZeichen.getObjektId() in alt) {
                let modiZeichen = alt[oldZeichen.getObjektId()] as Zeichen;
                let upd = "";
                if (oldZeichen.getSort() != modiZeichen.getSort()) {
                    upd += '<wfs:Property>\n<wfs:Name>sort</wfs:Name>\n<wfs:Value>' + modiZeichen.getSort() + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update sort");
                }
                if (oldZeichen.getStvoznr().substr(-32) != modiZeichen.getStvoznr()) {
                    upd += '<wfs:Property>\n<wfs:Name>stvoznr/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getStvoznr() + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update stvoznr");
                }
                if (oldZeichen.getVztext() != modiZeichen.getVztext()) {
                    upd += '<wfs:Property>\n<wfs:Name>vztext</wfs:Name>\n<wfs:Value>' + ((modiZeichen.getVztext() != null) ? modiZeichen.getVztext() : '') + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update text");
                }
                if (oldZeichen.getLageFb() == null || oldZeichen.getLageFb().substr(-32) != modiZeichen.getLageFb()) {
                    upd += '<wfs:Property>\n<wfs:Name>lageFb/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getLageFb() + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update lageFb");
                }
                if (oldZeichen.getLesbarkeit() == null || oldZeichen.getLesbarkeit().substr(-32) != modiZeichen.getLesbarkeit()) {
                    upd += '<wfs:Property>\n<wfs:Name>lesbarkeit/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getLesbarkeit() + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update text");
                }
                if (oldZeichen.getBeleucht() == null || oldZeichen.getBeleucht().substr(-32) != modiZeichen.getBeleucht()) {
                    upd += '<wfs:Property>\n<wfs:Name>beleucht/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getBeleucht() + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update beleucht");
                }
                if (oldZeichen.getArt() == null || oldZeichen.getArt().substr(-32) != modiZeichen.getArt()) {
                    upd += '<wfs:Property>\n<wfs:Name>art/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getArt() + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update art");
                }

                if (oldZeichen.getGroesse() == null || oldZeichen.getGroesse().substr(-32) != modiZeichen.getGroesse()) {
                    upd += '<wfs:Property>\n<wfs:Name>groesse/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getGroesse() + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update groesse");
                }

                if (oldZeichen.getStrbezug() == null || oldZeichen.getStrbezug().substr(-32) != modiZeichen.getStrbezug()) {
                    upd += '<wfs:Property>\n<wfs:Name>strbezug/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getStrbezug() + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update strbezug");
                }

                if (oldZeichen.getAufstelldat() != modiZeichen.getAufstelldat() && !(oldZeichen.getAufstelldat() == null && modiZeichen.getAufstelldat() == "")) {
                    upd += '<wfs:Property>\n<wfs:Name>aufstelldat</wfs:Name>\n<wfs:Value>' + modiZeichen.getAufstelldat() + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update aufstelldat");
                }

                if (oldZeichen.getErfart() == null || oldZeichen.getErfart().substr(-32) != modiZeichen.getErfart()) {
                    upd += '<wfs:Property>\n<wfs:Name>erfart/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getErfart() + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update erfart");
                }

                if (oldZeichen.getQuelle() == null || oldZeichen.getQuelle().substr(-32) != modiZeichen.getQuelle()) {
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
                        '				<ogc:Literal>#' + this._daten.ereignisraum + '</ogc:Literal>\n' +
                        '			</ogc:PropertyIsEqualTo>\n' +
                        '		</ogc:And>\n' +
                        '	</ogc:Filter>\n' + upd +
                        '</wfs:Update>\n';
                }
                //console.log("update");
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
                    '				<ogc:Literal>#' + this._daten.ereignisraum + '</ogc:Literal>\n' +
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
                '<projekt typeName="Projekt" xlink:href="#' + this._daten.ereignisraum + '"/>\n' +
                '<sort>' + zeichen.getSort() + '</sort>\n' +
                '<stvoznr xlink:href="#S' + zeichen.getStvoznr() + '" typeName="Itvzstvoznr" />\n' +
                '<vztext>' + ((zeichen.getVztext() != null) ? zeichen.getVztext() : '') + '</vztext>\n' +
                '<lageFb xlink:href="#S' + zeichen.getLageFb() + '" typeName="Itvzlagefb" />\n' +
                '<lesbarkeit xlink:href="#S' + zeichen.getLesbarkeit() + '" typeName="Itvzlesbarkeit" />\n' +
                '<beleucht xlink:href="#S' + zeichen.getBeleucht() + '" typeName="Itvzbeleucht" />\n' +
                '<art xlink:href="#' + zeichen.getArt() + '" typeName="Itvzart" />\n' +
                '<parent typeName="Otaufstvor" xlink:href="#' + this._auswahl.getFid() + '"/>\n' +
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
                    "Daten schreiben": function () {
                        $((event.target as HTMLElement).parentElement.parentElement).remove();
                        console.log("bestätigt")
                        console.log(this)
                        // Unterscheidung zwischen neuer Aufstellvorrichtung und alter, leider nicht möglich
                        /*if (this._auswahl.hasSekObj == 0)
                            PublicWFS.doTransaction(update, this._updateCallback, undefined, this, this._auswahl);
                        else
                            PublicWFS.addSekInER(this._auswahl, "Otaufstvor", "Otvzeichlp", this._daten.ereignisraum_nr, this._erCallback, undefined, this, update, this._auswahl);
                        */
                        PublicWFS.addSekInER(this._auswahl, "Otaufstvor", "Otvzeichlp", this._daten.ereignisraum_nr, this._erCallback.bind(this), this._erCallback.bind(this), update, this._auswahl);
                        //this._closePopup(event);
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
        Daten.getInstanz()
        this._select.getFeatures().clear();
    }

    /**
     * Schließt das Popup mit den Schildern
     * @param {*} event 
     */
    _closePopup(event: any) {
        //this._ausblenden.remove();
        document.body.removeChild(this._ausblenden);
        this._select.getFeatures().clear();
        this._auswahl = null;
    }

    start() {
        this._map.addInteraction(this._select);
    }

    stop() {
        this._map.removeInteraction(this._select);
    }
}

export default AvVzAdd;
