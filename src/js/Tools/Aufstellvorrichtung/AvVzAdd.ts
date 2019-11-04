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
    private _auswahl: any = null;
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

        this._auswahl.getZeichen(this._zeichenGeladen.bind(this))
    }

    /**
     * Listener für das Hinzufügen eines neuen Verkehrszeichens
     * @param {MouseEvent} event Event-Objekt
     */
    newSchild(event: MouseEvent) {
        let schild = new Zeichen();
        schild.setStvoznr((event.target as HTMLInputElement).value);
        this._createSchildForm(schild);
    }

    _zeichenGeladen(zeichen: Zeichen[]) {
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
    _createSchildForm(eintrag: Zeichen) {
        let div = document.createElement("form");
        this._liste.appendChild(div);
        div.dataset.oid = eintrag.getObjektId();
        div.classList.add('ui-state-default');
        div.classList.add('schild');
        let img = document.createElement("img");
        img.classList.add('schildBild');
        img.style.height = "50px";
        img.src = "http://gv-srv-w00118:8080/schilder/" + Klartext.getInstanz().get("Itvzstvoznr", eintrag.getStvoznr())['kt'] + ".svg";
        img.title = Klartext.getInstanz().get("Itvzstvoznr", eintrag.getStvoznr())['beschreib'] + (eintrag.getVztext() != null) ? ("\n" + eintrag.getVztext()) : ('');
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
        text_group.innerHTML += '<input type="text" name="vztext" value="' + ((eintrag.getVztext() != null) ? (eintrag.getVztext()) : ('')) + '" />';
        text.appendChild(text_group);

        // Lage FB
        if (eintrag.getLageFb() == undefined) eintrag.setLageFb(CONFIG.LAGEFB);
        text.appendChild(this._createSelect(eintrag, 'Lage', 'lageFb', 'Itvzlagefb'));

        // Lesbarkeit
        text.appendChild(this._createSelect(eintrag, 'Lesbarkeit', 'lesbarkeit', 'Itvzlesbarkeit'));

        // Beleuchtet
        if (eintrag.getBeleucht() == undefined) eintrag.setBeleucht(CONFIG.BELEUCHTET);
        text.appendChild(this._createSelect(eintrag, 'Beleuchtung', 'beleucht', 'Itvzbeleucht'));

        //Einzelschild
        if (eintrag.getArt() == undefined) eintrag.setArt(CONFIG.EINZELSCHILD);
        text.appendChild(this._createSelect(eintrag, 'Einzelschild', 'art', 'Itvzart'));

        // Größe des Schilder
        if (eintrag.getGroesse() == undefined) eintrag.setGroesse(CONFIG.GROESSE);
        text.appendChild(this._createSelect(eintrag, 'Gr&ouml;&szlig;e', 'groesse', 'Itvzgroesse'));

        // Straßenbezug
        if (eintrag.getStrbezug() == undefined) eintrag.setStrbezug(CONFIG.STRASSENBEZUG);
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
        aufstellField.value = ((eintrag.getAufstelldat() != null) ? (eintrag.getAufstelldat()) : (''));
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
        extnr_group.innerHTML += '<input type="text" name="objektnr" value="' + ((eintrag.getObjektnr() != null) ? (eintrag.getObjektnr()) : ('')) + '" />';
        text.appendChild(extnr_group);

        // Erfassungsart
        if (eintrag.getErfart() == undefined) eintrag.setErfart(CONFIG.ERFASSUNG);
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
                width: "200px",
                search_contains: true,
            }).change(function (event: any, data: { selected: any; }) {
                img.src = "http://gv-srv-w00118:8080/schilder/" + Klartext.getInstanz().get("Itvzstvoznr", data.selected)['kt'] + ".svg";
            }.bind(this));

            alle.first().nextAll().children('select').chosen({
                width: "200px",
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
        select.id = id + "[" + eintrag.getObjektId() + "]";

        for (let kt of Klartext.getInstanz().getAllSorted(klartext)) {
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
            let schild = new Zeichen();
            schild.setObjektId(forms[i].dataset.oid);
            schild.setSort(i + 1);
            schild.setStvoznr(($(eintrag).children().children("select[name='stvoznr']")[0] as HTMLInputElement).value);
            schild.setVztext(($(eintrag).children().children("input[name='vztext']")[0] as HTMLInputElement).value);
            if (schild.getVztext() == "") schild.setVztext(null);
            schild.setLageFb(($(eintrag).children().children("select[name='lageFb']")[0] as HTMLInputElement).value);
            schild.setLesbarkeit(($(eintrag).children().children("select[name='lesbarkeit']")[0] as HTMLInputElement).value);
            schild.setBeleucht(($(eintrag).children().children("select[name='beleucht']")[0] as HTMLInputElement).value);
            schild.setArt(($(eintrag).children().children("select[name='art']")[0] as HTMLInputElement).value);
            schild.setGroesse(($(eintrag).children().children("select[name='groesse']")[0] as HTMLInputElement).value);
            schild.setStrbezug(($(eintrag).children().children("select[name='strbezug']")[0] as HTMLInputElement).value);
            schild.setAufstelldat(($(eintrag).children().children("input[name='aufstelldat']")[0] as HTMLInputElement).value);
            schild.setErfart(($(eintrag).children().children("select[name='erfart']")[0] as HTMLInputElement).value);
            schild.setQuelle(($(eintrag).children().children("select[name='quelle']")[0] as HTMLInputElement).value);
            schild.setObjektnr(($(eintrag).children().children("input[name='objektnr']")[0] as HTMLInputElement).value);
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
        for (let oldZeichen_i in zeichen) {
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
                    upd += '<wfs:Property>\n<wfs:Name>vztext</wfs:Name>\n<wfs:Value>' + modiZeichen.getVztext() + '</wfs:Value>\n</wfs:Property>\n';
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
                    upd += '<wfs:Property>\n<wfs:Name>beleucht/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.getBeleucht + '</wfs:Value>\n</wfs:Property>\n';
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
                '<vztext>' + zeichen.getVztext() + '</vztext>\n' +
                '<lageFb xlink:href="#S' + zeichen.getLageFb() + '" typeName="Itvzlagefb" />\n' +
                '<lesbarkeit xlink:href="#S' + zeichen.getLesbarkeit() + '" typeName="Itvzlesbarkeit" />\n' +
                '<beleucht xlink:href="#S' + zeichen.getBeleucht() + '" typeName="Itvzbeleucht" />\n' +
                '<art xlink:href="#' + zeichen.getArt() + '" typeName="Itvzart" />\n' +
                '<parent typeName="Otaufstvor" xlink:href="#' + this._auswahl.fid + '"/>\n' +
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
    _erCallback(__: any, update: string, _auswahl: any) {
        console.log("Update: " + update)
        PublicWFS.doTransaction(update, this._updateCallback.bind(this), undefined, _auswahl);
    }


    /**
     * wird nach der Ausführung des Updates ausgeführt
     * @param {*} __ 
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
