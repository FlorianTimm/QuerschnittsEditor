import { Select as SelectInteraction } from 'ol/interaction';
import '../../../css/vzadd.css';
import "../../import_jquery.js";
import 'chosen-js';
import 'chosen-js/chosen.css';
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css'
import PublicWFS from '../../PublicWFS';
import Tool from '../Tool';
import Daten from '../../Daten';
import { Map } from 'ol';
import Zeichen from '../../Objekte/Zeichen';
import { SelectEvent } from 'ol/interaction/Select';
import Klartext from '../../Objekte/Klartext';
var CONFIG = require('../../config.json');

/**
 * Funktion zum Hinzufügen von Verkehrsschildern
 * @author Florian Timm, LGV HH 
 * @version 2019.05.20
 * @copyright MIT
 */
class AvVzAdd implements Tool {
    private _map: Map;
    private _daten: Daten;
    private _ausblenden: any = null;
    private _liste: any = null;
    private _auswahl: any = null;
    private _popup: HTMLDivElement;
    private _select: SelectInteraction;

    /**
     * Erzeugt eine Instanz des Verkehrszeichen-Hinzufügen-Tools
     * @param map Karten-Objekt
     * @param daten Daten-Objekt
     */
    constructor(map: Map, daten: Daten) {
        this._map = map;
        this._daten = daten;

        this._select = new SelectInteraction({
            layers: [this._daten.l_aufstell],
            hitTolerance: 10
        });

        this._select.on("select", this._selected.bind(this));
        AvVzAdd.loadKlartexte();
    }

    /**
     * Listener für die Auswahl einer Aufstellvorrichtung
     * @param event Select-Event-Objekt
     */
    _selected(event: SelectEvent) {
        // Filtern, wenn nichts ausgewählt wurde
        if (event.selected.length == 0) {
            return;
        }
        this._auswahl = event.selected[0];

        // Popup erzeugen
        this._ausblenden = document.createElement("div");
        this._ausblenden.id = "vzadd_ausblenden";
        document.body.appendChild(this._ausblenden);
        this._popup = document.createElement("div");
        this._popup.id = "vz_popup";
        this._popup.style.textAlign = "left";

        this._popup.innerHTML += '<div style="color: #f00; width: 100%; text-align: center;">ACHTUNG: Änderungen im aktuellen ER werden nicht angezeigt!<br/>Der Fehler wurde bereits an NOVASIB gemeldet.</div>'

        this._ausblenden.appendChild(this._popup);

        this._liste = document.createElement("div");
        $(this._liste).sortable({
            placeholder: "ui-state-highlight"
        });
        $(this._liste).disableSelection();
        this._liste.classList.add("schilderListe")
        this._popup.appendChild(this._liste);


        let stvoZNrNeu = document.createElement("select");
        stvoZNrNeu.id = "schilder";
        stvoZNrNeu.appendChild(document.createElement("option"));
        for (let stvoznr of Klartext.getInstanz().getAllSorted("Itvzstvoznr")) {
            let ele = document.createElement("option");
            ele.value = stvoznr['objektId'];
            ele.innerHTML = stvoznr['beschreib'];
            stvoZNrNeu.appendChild(ele);
        }
        this._popup.appendChild(stvoZNrNeu);

        $(stvoZNrNeu).on("change", this.newSchild.bind(this));

        $(stvoZNrNeu).chosen({
            search_contains: true,
            placeholder_text_single: "Schild hinzufügen...",
            no_results_text: "Nichts gefunden!",
            width: "600px"
        });

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

        this._auswahl.getZeichen(AvVzAdd._zeichenGeladen, this)
    }

    /**
     * Listener für das Hinzufügen eines neuen Verkehrszeichens
     * @param {MouseEvent} event Event-Objekt
     */
    newSchild(event: MouseEvent) {
        let schild = new Zeichen(this._daten);
        schild.stvoznr = (event.target as HTMLInputElement).value;
        this._createSchildForm(schild);
    }

    static _zeichenGeladen(zeichen: Zeichen[], _this: AvVzAdd) {
        zeichen.sort(function (a: Zeichen, b: Zeichen) {
            if (a.sort != null && b.sort != null) {
                return Number(a.sort) - Number(b.sort);
            }
        });
        for (let eintrag of zeichen) {
            _this._createSchildForm(eintrag);
        }
    }

    /**
     * Erzeugt pro Schild ein Änderungsformular
     * @param {Zeichen} eintrag Schild, für welches das Formular erzeugt werden soll
     */
    _createSchildForm(eintrag: Zeichen) {
        let div = document.createElement("form");
        this._liste.appendChild(div);
        div.dataset.oid = eintrag.objektId;
        div.classList.add('ui-state-default');
        div.classList.add('schild');
        let img = document.createElement("img");
        img.classList.add('schildBild');
        img.style.height = "50px";
        img.src = "http://gv-srv-w00118:8080/schilder/" + Klartext.getInstanz().get("Itvzstvoznr", eintrag.stvoznr)['kt'] + ".svg";
        img.title = Klartext.getInstanz().get("Itvzstvoznr", eintrag.stvoznr)['beschreib'] + (eintrag.vztext != null) ? ("\n" + eintrag.vztext) : ('');
        div.appendChild(img);
        let text = document.createElement("div");
        div.appendChild(text);
        text.classList.add('schildText');


        // StVOZNR
        text.appendChild(this._createSelect(eintrag, 'Verkehrszeichen', 'stvoznr', 'Itvzstvoznr'));

        // Text
        let text_group = document.createElement("div");
        text_group.className = "form_group";
        let text_label = document.createElement("label");
        text_label.innerHTML = 'Text';
        text_group.appendChild(text_label);
        text_group.appendChild(document.createElement("br"));
        text_group.innerHTML += '<input type="text" name="vztext" value="' + ((eintrag.vztext != null) ? (eintrag.vztext) : ('')) + '" />';
        text.appendChild(text_group);

        // Lage FB
        if (eintrag.lageFb == undefined) eintrag.lageFb = CONFIG.LAGEFB;
        text.appendChild(this._createSelect(eintrag, 'Lage', 'lageFb', 'Itvzlagefb'));

        // Lesbarkeit
        text.appendChild(this._createSelect(eintrag, 'Lesbarkeit', 'lesbarkeit', 'Itvzlesbarkeit'));

        // Beleuchtet
        if (eintrag.beleucht == undefined) eintrag.beleucht = CONFIG.BELEUCHTET;
        text.appendChild(this._createSelect(eintrag, 'Beleuchtung', 'beleucht', 'Itvzbeleucht'));

        //Einzelschild
        if (eintrag.art == undefined) eintrag.art = CONFIG.EINZELSCHILD;
        text.appendChild(this._createSelect(eintrag, 'Einzelschild', 'art', 'Itvzart'));

        // Größe des Schilder
        if (eintrag.groesse == undefined) eintrag.groesse = CONFIG.GROESSE;
        text.appendChild(this._createSelect(eintrag, 'Gr&ouml;&szlig;e', 'groesse', 'Itvzgroesse'));

        // Straßenbezug
        if (eintrag.strbezug == undefined) eintrag.strbezug = CONFIG.STRASSENBEZUG;
        text.appendChild(this._createSelect(eintrag, 'Stra&szlig;enbezug', 'strbezug', 'Itbesstrbezug'));

        // Aufstelldatum
        let aufstellGroup = document.createElement("div");
        aufstellGroup.className = "form_group";
        let aufstell_label = document.createElement("label");
        aufstell_label.innerHTML = 'Aufstelldatum';
        aufstellGroup.appendChild(aufstell_label);
        aufstellGroup.appendChild(document.createElement("br"));
        let aufstellField = document.createElement("input");
        aufstellField.autocomplete = "off";
        aufstellField.name = "aufstelldat";
        aufstellField.value = ((eintrag.aufstelldat != null) ? (eintrag.aufstelldat) : (''));
        aufstellGroup.appendChild(aufstellField);

        $.datepicker.regional['de'] = {
            closeText: 'Done',
            prevText: 'Prev',
            nextText: 'Next',
            currentText: 'heute',
            monthNames: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
            monthNamesShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
                'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
            dayNames: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
            dayNamesShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
            dayNamesMin: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
            weekHeader: 'KW',
            dateFormat: 'dd.mm.yy',
            firstDay: 0,
            isRTL: false,
            showMonthAfterYear: false,
            yearSuffix: ''
        };
        $(aufstellField).datepicker($.datepicker.regional["de"]);
        $(aufstellField).datepicker('option', 'dateFormat', 'yy-mm-dd');
        $(aufstellField).datepicker('option', 'changeMonth', true);
        $(aufstellField).datepicker('option', 'changeYear', true);

        text.appendChild(aufstellGroup);

        // Externe Objektnr
        let extnr_group = document.createElement("div");
        extnr_group.className = "form_group";
        let extnr_label = document.createElement("label");
        extnr_label.innerHTML = 'Externe Objektnummer';
        extnr_group.appendChild(extnr_label);
        extnr_group.appendChild(document.createElement("br"));
        extnr_group.innerHTML += '<input type="text" name="objektnr" value="' + ((eintrag.objektnr != null) ? (eintrag.objektnr) : ('')) + '" />';
        text.appendChild(extnr_group);

        // Erfassungsart
        if (eintrag.erfart == undefined) eintrag.erfart = CONFIG.ERFASSUNG;
        text.appendChild(this._createSelect(eintrag, 'Erfassung', 'erfart', 'Iterfart'));

        // Quelle
        text.appendChild(this._createSelect(eintrag, 'Quelle', 'quelle', 'Itquelle'));

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

        $(function () {
            let alle = $(text).children('div')
            alle.first().children("select").chosen({
                width: "220px",
                search_contains: true,
            }).change(function (event: any, data: { selected: any; }) {
                img.src = "http://gv-srv-w00118:8080/schilder/" + this._Klartext.getInstanz().get("Itvzstvoznr", data.selected)['kt'] + ".svg";
            }.bind(this));

            alle.first().nextAll().children('select').chosen({
                width: "220px",
                search_contains: true,
            });
        }.bind(this));

    }

    /**
     * Erzeugt HTML-Select-Feld für einen Eintrag 
     * @param  {Zeichen} eintrag Verkehrszeichen
     * @param  {string} label Beschriftung des Feldes
     * @param  {string} id Bezeichner des Attributes des Eintrages
     * @param  {string} klartext Bezeichnung des zugehörigen Klartextes
     */
    _createSelect(eintrag: Zeichen, label: string, id: string, klartext: string) {
        let group = document.createElement("div");
        group.className = "form_group";
        let label_ele = document.createElement("label");
        label_ele.innerHTML = label;
        group.appendChild(label_ele);
        group.appendChild(document.createElement("br"));
        let select = document.createElement("select");
        select.classList.add("big");
        select.classList.add(id);
        select.name = id;
        select.id = id + "[" + eintrag.objektId + "]";

        for (let kt of Daten.getInstanz().klartexte.getAllSorted(klartext)) {
            let option = document.createElement("option");
            option.value = kt['objektId'];
            option.innerHTML = kt['beschreib'];
            if (eintrag[id] != null && eintrag[id].substr(-32) == kt['objektId']) {
                option.setAttribute("selected", "selected");
            }
            select.appendChild(option);
        }
        group.appendChild(select);
        return group;
    }

    /**
     * Lädt die benötigen Klartexte (sofern nciht schon vorhanden)
     */
    static loadKlartexte() {
        Klartext.getInstanz().load('Itvzstvoznr');
        Klartext.getInstanz().load('Itquelle');
        Klartext.getInstanz().load('Iterfart');
        Klartext.getInstanz().load('Itvzlagefb');
        Klartext.getInstanz().load('Itvzlesbarkeit');
        Klartext.getInstanz().load("Itvzart");
        Klartext.getInstanz().load("Itvzbeleucht");
        Klartext.getInstanz().load("Itvzgroesse");
        Klartext.getInstanz().load("Itbesstrbezug");
    }

    /**
     * Wird durch Klick auf "Speichern" ausgelöst, prüft Änderungen und listet diese auf
     * @param {MouseEvent} event 
     */
    _save(event: MouseEvent) {
        let neu: Zeichen[] = [];
        let alt = {};

        // Alle Schilder-Formulare auf Änderungen prüfen
        let forms = this._popup.getElementsByTagName("form");
        for (let i = 0; i < forms.length; i++) {
            //form of this._popup.getElementsByTagName("form")) {
            let eintraege = $(forms[i]).children(".schildText");
            if (eintraege.length == 0) break;
            let eintrag = eintraege[0];
            let schild = new Zeichen(this._daten);
            schild.objektId = forms[i].dataset.oid;
            schild.sort = i + 1;
            schild.stvoznr = ($(eintrag).children().children("select[name='stvoznr']")[0] as HTMLInputElement).value;
            schild.vztext = ($(eintrag).children().children("input[name='vztext']")[0] as HTMLInputElement).value;
            if (schild.vztext == "") schild.vztext = null;
            schild.lageFb = ($(eintrag).children().children("select[name='lageFb']")[0] as HTMLInputElement).value;
            schild.lesbarkeit = ($(eintrag).children().children("select[name='lesbarkeit']")[0] as HTMLInputElement).value;
            schild.beleucht = ($(eintrag).children().children("select[name='beleucht']")[0] as HTMLInputElement).value;
            schild.art = ($(eintrag).children().children("select[name='art']")[0] as HTMLInputElement).value;
            schild.groesse = ($(eintrag).children().children("select[name='groesse']")[0] as HTMLInputElement).value;
            schild.strbezug = ($(eintrag).children().children("select[name='strbezug']")[0] as HTMLInputElement).value;
            schild.aufstelldat = ($(eintrag).children().children("input[name='aufstelldat']")[0] as HTMLInputElement).value;
            schild.erfart = ($(eintrag).children().children("select[name='erfart']")[0] as HTMLInputElement).value;
            schild.quelle = ($(eintrag).children().children("select[name='quelle']")[0] as HTMLInputElement).value;
            schild.objektnr = ($(eintrag).children().children("input[name='objektnr']")[0] as HTMLInputElement).value;
            if (schild.objektnr == "") schild.objektnr = null;
            if (schild.objektId.length < 10) { // undefined
                neu.push(schild);
            } else {
                alt[schild.objektId] = schild;
            }
        }
        console.log(this._auswahl.getZeichen());
        console.log(neu);
        console.log(alt);

        let update = ""
        let anzDelete = 0, anzUpdate = 0;
        let zeichen = this._auswahl.getZeichen();
        for (let oldZeichen_i in zeichen) {
            let oldZeichen = zeichen[oldZeichen_i] as Zeichen;
            if (oldZeichen.objektId in alt) {
                let modiZeichen = alt[oldZeichen.objektId] as Zeichen;
                let upd = "";
                if (oldZeichen.sort != modiZeichen.sort) {
                    upd += '<wfs:Property>\n<wfs:Name>sort</wfs:Name>\n<wfs:Value>' + modiZeichen.sort + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update sort");
                }
                if (oldZeichen.stvoznr.substr(-32) != modiZeichen.stvoznr) {
                    upd += '<wfs:Property>\n<wfs:Name>stvoznr/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.stvoznr + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update stvoznr");
                }
                if (oldZeichen.vztext != modiZeichen.vztext) {
                    upd += '<wfs:Property>\n<wfs:Name>vztext</wfs:Name>\n<wfs:Value>' + modiZeichen.vztext + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update text");
                }
                if (oldZeichen.lageFb.substr(-32) != modiZeichen.lageFb) {
                    upd += '<wfs:Property>\n<wfs:Name>lageFb/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.lageFb + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update lageFb");
                }
                if (oldZeichen.lesbarkeit.substr(-32) != modiZeichen.lesbarkeit) {
                    upd += '<wfs:Property>\n<wfs:Name>lesbarkeit/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.lesbarkeit + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update text");
                }
                if (oldZeichen.beleucht.substr(-32) != modiZeichen.beleucht) {
                    upd += '<wfs:Property>\n<wfs:Name>beleucht/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.beleucht + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update beleucht");
                }
                if (oldZeichen.art.substr(-32) != modiZeichen.art) {
                    upd += '<wfs:Property>\n<wfs:Name>art/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.art + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update art");
                }

                if (oldZeichen.groesse.substr(-32) != modiZeichen.groesse) {
                    upd += '<wfs:Property>\n<wfs:Name>groesse/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.groesse + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update groesse");
                }

                if (oldZeichen.strbezug.substr(-32) != modiZeichen.strbezug) {
                    upd += '<wfs:Property>\n<wfs:Name>strbezug/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.strbezug + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update strbezug");
                }

                if (oldZeichen.aufstelldat != modiZeichen.aufstelldat) {
                    upd += '<wfs:Property>\n<wfs:Name>aufstelldat</wfs:Name>\n<wfs:Value>' + modiZeichen.aufstelldat + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update aufstelldat");
                }

                if (oldZeichen.erfart.substr(-32) != modiZeichen.erfart) {
                    upd += '<wfs:Property>\n<wfs:Name>erfart/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.erfart + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update erfart");
                }

                if (oldZeichen.quelle.substr(-32) != modiZeichen.quelle) {
                    upd += '<wfs:Property>\n<wfs:Name>quelle/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.quelle + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update quelle");
                }

                if (oldZeichen.objektnr != modiZeichen.objektnr) {
                    upd += '<wfs:Property>\n<wfs:Name>objektnr</wfs:Name>\n<wfs:Value>' + modiZeichen.objektnr + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update objektnr");
                }

                if (upd != "") {
                    anzUpdate += 1
                    update += '<wfs:Update typeName="Otvzeichlp">\n' + upd +
                        '	<ogc:Filter>\n' +
                        '		<ogc:And>\n' +
                        '			<ogc:PropertyIsEqualTo>\n' +
                        '				<ogc:PropertyName>objektId</ogc:PropertyName>\n' +
                        '				<ogc:Literal>' + oldZeichen.objektId + '</ogc:Literal>\n' +
                        '			</ogc:PropertyIsEqualTo>\n' +
                        '			<ogc:PropertyIsEqualTo>\n' +
                        '				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
                        '				<ogc:Literal>' + this._daten.ereignisraum + '</ogc:Literal>\n' +
                        '			</ogc:PropertyIsEqualTo>\n' +
                        '		</ogc:And>\n' +
                        '	</ogc:Filter>\n' +
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
                    '				<ogc:Literal>' + oldZeichen.objektId + '</ogc:Literal>\n' +
                    '			</ogc:PropertyIsEqualTo>\n' +
                    '			<ogc:PropertyIsEqualTo>\n' +
                    '				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
                    '				<ogc:Literal>' + this._daten.ereignisraum + '</ogc:Literal>\n' +
                    '			</ogc:PropertyIsEqualTo>\n' +
                    '		</ogc:And>\n' +
                    '	</ogc:Filter>\n' +
                    '</wfs:Delete>\n';
            }
        }
        for (let zeichen of neu) {
            console.log("neu");
            if (zeichen.vztext == null) zeichen.vztext = "";
            update += '<wfs:Insert>\n<Otvzeichlp>\n' +
                '<projekt typeName="Projekt" xlink:href="#' + this._daten.ereignisraum + '"/>\n' +
                '<sort>' + zeichen.sort + '</sort>\n' +
                '<stvoznr xlink:href="#S' + zeichen.stvoznr + '" typeName="Itvzstvoznr" />\n' +
                '<vztext>' + zeichen.vztext + '</vztext>\n' +
                '<lageFb xlink:href="#S' + zeichen.lageFb + '" typeName="Itvzlagefb" />\n' +
                '<lesbarkeit xlink:href="#S' + zeichen.lesbarkeit + '" typeName="Itvzlesbarkeit" />\n' +
                '<beleucht xlink:href="#S' + zeichen.beleucht + '" typeName="Itvzbeleucht" />\n' +
                '<art xlink:href="#' + zeichen.art + '" typeName="Itvzart" />\n' +
                '<parent typeName="Otaufstvor" xlink:href="#' + this._auswahl.fid + '"/>\n' +
                '<groesse xlink:href="#' + zeichen.groesse + '" typeName="Itvzgroesse" />\n' +
                '<strbezug xlink:href="#' + zeichen.strbezug + '" typeName="Itbesstrbezug" />\n' +
                '<aufstelldat>' + zeichen.aufstelldat + '</aufstelldat>\n' +
                ((zeichen.objektnr != null && zeichen.objektnr != '') ? ('<objektnr>' + zeichen.objektnr + '</objektnr>\n') : '') +
                '<erfart xlink:href="#' + zeichen.erfart + '" typeName="Iterfart" />\n' +
                '<quelle xlink:href="#' + zeichen.quelle + '" typeName="Itquelle" />\n' +
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
    _erCallback(__: any, update: string, _auswahl: any) {
        console.log("Update: " + update)
        PublicWFS.doTransaction(update, this._updateCallback.bind(this), undefined, _auswahl);
    }


    /**
     * wird nach der Ausführung des Updates ausgeführt
     * @param {*} __ 
     * @param {AvVzAdd} _this 
     * @param {*} _auswahl 
     */
    _updateCallback(__: any, _auswahl: { reloadZeichen: () => void; }) {
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
