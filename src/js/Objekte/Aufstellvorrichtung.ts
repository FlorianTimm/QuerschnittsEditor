/**
 * Aufstellvorrichtung
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */
import "../import_jquery.js";
import 'chosen-js';
import 'chosen-js/chosen.css';
import Daten from "../Daten";
import PublicWFS from '../PublicWFS';
import Abschnitt from './Abschnitt';
import Klartext, { KlartextMap } from './Klartext';
import PunktObjekt from './prototypes/PunktObjekt';
import Zeichen from './Zeichen';
import HTML from "../HTML";
import Dokument from "./Dokument.js";

export default class Aufstellvorrichtung extends PunktObjekt {
    getWFSKonfigName(): string {
        return "AUFSTELL";
    }
    private zeichen: Zeichen[] = null;
    private hasSekObj: number;
    private art: string;

    public colorFunktion1(): import("ol/colorlike").ColorLike {
        if (this.hasSekObj > 0 || (this.zeichen != null && this.zeichen.length > 0)) {
            return 'rgba(250,120,0,0.8)';
        } else {
            return 'rgba(255,0,0,0.8)';
        }
    }

    public colorFunktion2(): import("ol/colorlike").ColorLike {
        return 'black';
    }

    getObjektKlassenName(): string {
        return "Otaufstvor";
    }

    private vzAddHTML(zeichen: Zeichen[], ziel: HTMLElement) {
        let div = document.createElement('div');
        div.style.marginTop = '5px';
        for (let eintrag of zeichen) {
            let img = document.createElement("img");
            img.style.height = "30px";
            Klartext.getInstanz().load("Itvzstvoznr", function (klartext: KlartextMap) {
                img.src = "http://gv-srv-w00118:8080/schilder/" + klartext[eintrag.getStvoznr()].kt + ".svg";
                img.title = klartext[eintrag.getStvoznr()]['beschreib'] + (eintrag.getVztext() != null) ? ("\n" + eintrag.getVztext()) : ('');
            });
            div.appendChild(img);
        }
        ziel.appendChild(div);
    }

    public static loadER(callback?: (...args: any) => void, ...args: any) {
        let daten = Daten.getInstanz();
        PublicWFS.doQuery('Otaufstvor', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></Filter>', Aufstellvorrichtung.loadERCallback, undefined, callback, ...args);

    }

    public static loadERCallback(xml: XMLDocument, callback?: (...args: any) => void, ...args: any) {
        let aufstell = xml.getElementsByTagName("Otaufstvor");
        for (let i = 0; i < aufstell.length; i++) {
            let f = Aufstellvorrichtung.fromXML(aufstell[i]);
            Daten.getInstanz().layerAufstell.getSource().addFeature(f);
        }
        if (callback != undefined)
            callback(...args);
    }

    /**
     * Lädt einen Abschnitt nach
     * @param {Daten} daten 
     * @param {Abschnitt} abschnitt 
     */
    public static loadAbschnittER(abschnitt: Abschnitt, callback: (...args: any[]) => void, ...args: any[]) {
        //console.log(daten);
        document.body.style.cursor = 'wait';
        PublicWFS.doQuery('Otaufstvor', '<Filter>' +
            '<And><PropertyIsEqualTo><PropertyName>abschnittId</PropertyName>' +
            '<Literal>' + abschnitt.getAbschnittid() + '</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + Daten.getInstanz().ereignisraum + '</Literal></PropertyIsEqualTo></And></Filter>', Aufstellvorrichtung._loadAbschnittER_Callback, undefined, callback, ...args);
    }

    private static _loadAbschnittER_Callback(xml: XMLDocument, callback: (...args: any[]) => void, ...args: any[]) {
        //console.log(daten);
        let aufstell = xml.getElementsByTagName("Otaufstvor");
        for (let i = 0; i < aufstell.length; i++) {
            let f = Aufstellvorrichtung.fromXML(aufstell[i]);
            Daten.getInstanz().layerAufstell.getSource().addFeature(f);
        }
        callback(...args);
        document.body.style.cursor = '';
    }

    public static fromXML(xml: Element) {
        let r = new Aufstellvorrichtung();
        r.setDataFromXML(xml);
        return r;
    }

    public getZeichen(callback: (zeichen: Zeichen[], ...args: any[]) => void, ...args: any[]): void;
    public getZeichen(): Zeichen[];
    public getZeichen(callback?: (zeichen: Zeichen[], ...args: any[]) => void, ...args: any[]): void | Zeichen[] {
        if (this.zeichen == null && this.hasSekObj > 0) {
            this.reloadZeichen(callback, ...args);
        } else if (this.hasSekObj > 0) {
            if (callback != undefined) {
                callback(this.zeichen, ...args);
            } else {
                return this.zeichen;
            }
        }
    }

    public reloadZeichen(callback?: (...args: any[]) => void, ...args: any[]) {
        PublicWFS.doQuery('Otvzeichlp', '<Filter>\n' +
            '  <PropertyIsEqualTo>\n' +
            '    <PropertyName>parent/@xlink:href</PropertyName>\n' +
            '    <Literal>' + this.fid + '</Literal>\n' +
            '  </PropertyIsEqualTo>\n' +
            '</Filter>', this.parseZeichen.bind(this), undefined, callback, ...args);
    }

    private parseZeichen(xml: XMLDocument, callback?: (...args: any[]) => void, ...args: any[]) {
        let zeichen: Zeichen[] = [];
        let zeichenXML = xml.getElementsByTagName('Otvzeichlp');

        for (let i = 0; i < zeichenXML.length; i++) {
            let eintrag = zeichenXML.item(i);
            if (!(eintrag.getElementsByTagName("enr").length > 0)) {
                zeichen.push(Zeichen.fromXML(eintrag));
            }
        }
        this.zeichen = zeichen;
        if (this.hasSekObj == 0 && zeichen.length > 0) this.hasSekObj = 1
        console.log(this);
        console.log(this.zeichen);
        if (callback != undefined) {
            callback(this.zeichen, ...args);
        }
    }

    public static createForm(formId: string, aufstell?: Aufstellvorrichtung, changeable: boolean = false, showForm: boolean = true): HTMLFormElement {
        let sidebar = document.getElementById("sidebar");
        let form = HTML.createToolForm(sidebar, showForm, formId);

        // Art
        Aufstellvorrichtung.createFields(form, aufstell, changeable);

        return form;
    }



    private static createFields(form: HTMLFormElement, aufstell?: Aufstellvorrichtung, changeable: boolean = false) {
        // Art
        let art = Klartext.createKlartextSelectForm("Itaufstvorart", form, "Art", "art", aufstell != undefined ? aufstell.art : undefined);
        $(art).prop('disabled', !changeable).trigger("chosen:updated");

        // Lage
        let lage = Klartext.createKlartextSelectForm("Itallglage", form, "Lage", "lage", aufstell != undefined ? aufstell.rlageVst : undefined);
        $(lage).prop('disabled', !changeable).trigger("chosen:updated");

        // Quelle
        let quelle = Klartext.createKlartextSelectForm("Itquelle", form, "Quelle", "quelle", aufstell != undefined ? aufstell.quelle : undefined);
        $(quelle).prop('disabled', !changeable).trigger("chosen:updated");

        // ext: Objektid
        let objektnr = HTML.createTextInput(form, "ext. Objektnummer", "extid", aufstell != undefined ? aufstell.objektnr : undefined);
        objektnr.disabled = !changeable;

        // VNK
        let vnk = HTML.createTextInput(form, "VNK", "vnk", aufstell != undefined ? aufstell.getAbschnitt().getVnk() : undefined);
        vnk.disabled = true;

        // NNK
        let nnk = HTML.createTextInput(form, "NNK", "nnk", aufstell != undefined ? aufstell.getAbschnitt().getNnk() : undefined);
        nnk.disabled = true;

        // Station
        let station = HTML.createTextInput(form, "Station", "station", aufstell != undefined ? aufstell.vst.toString() : undefined);
        station.disabled = true;

        // Abstand
        let abstTxt = "";
        if (aufstell != undefined) {
            if (aufstell.rabstbaVst >= 0.01) abstTxt = "R";
            else if (aufstell.rabstbaVst <= 0.01) abstTxt = "L";
            else abstTxt = "M";
            abstTxt += " " + Math.abs(aufstell.rabstbaVst);
        }
        let abstand = HTML.createTextInput(form, "Abstand", "abstand", abstTxt);
        abstand.disabled = true;

        if (aufstell != undefined) {
            let schilder = document.createElement("div");
            schilder.style.marginTop = "10px";
            form.appendChild(schilder);
            aufstell.getZeichen(aufstell.vzAddHTML.bind(aufstell), schilder);

            aufstell.getDokumente(aufstell.dokuAdd.bind(aufstell), form);
        }
    }

    private dokuAdd(doku: Dokument[], ziel: HTMLElement) {
        if (doku.length == 0) return;
        let button = document.createElement('input');
        button.type = "button";
        button.value = "Dokumente anzeigen";
        ziel.appendChild(button);

        button.addEventListener("click", this.showDokuPopup.bind(this))
    }

    private showDokuPopup(__: Event) {
        this.getDokumente(function (this: Aufstellvorrichtung, doks: Dokument[]) {
            let dialog = document.createElement("table");
            dialog.className = "tableWithBorder"
            for(let dok of doks){
                dialog.innerHTML += "<tr><td>" + dok.getBeschreib() + "</td><td>" + dok.getPfad() + "</td></tr>"
            }
            document.body.appendChild(dialog);
            let jqueryDialog = $(dialog).dialog({
                resizable: false,
                height: "auto",
                title: "Dokumente",
                width: 400,
                modal: true,
                buttons: {
                   /* "Speichern": function (this: Aufstellvorrichtung) {
                        jqueryDialog.dialog("close");
                    }.bind(this),*/
                    Cancel: function () {
                        jqueryDialog.dialog("close");
                    }
                }
            });
        }.bind(this));
    }

    public getInfoForm(ziel: HTMLFormElement, changeable: boolean = false): void {
        Aufstellvorrichtung.createFields(ziel, this, changeable);
    }

    public changeAttributes(form: HTMLFormElement): void {
        this.setArt($(form).find("#art").children("option:selected").val() as string);
        this.setRlageVst($(form).find("#lage").children("option:selected").val() as string);
        this.setQuelle($(form).find("#quelle").children("option:selected").val() as string);
        this.setObjektnr($(form).find("#extid").val() as string);

        let xml = this.createUpdateXML({
            'art/@xlink:href': this.getArt(),
            'rlageVst/@xlink:href': this.getRlageVst(),
            'quelle/@xlink:href': this.getQuelle(),
            'objektnr': this.getObjektnr(),
        });
        PublicWFS.doTransaction(xml);
    }

    // Getter
    public getArt() {
        return this.art;
    }

    public getRlageVst() {
        return this.rlageVst;
    }

    // Setter
    public setArt(art: string) {
        this.art = art;
    }

    public setRlageVst(rlageVst: string) {
        this.rlageVst = rlageVst;
    }


};

