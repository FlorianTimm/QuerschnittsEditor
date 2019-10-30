/**
 * Strassenausstrattung (punktuell)
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */

import PublicWFS from '../PublicWFS';
import { Point } from 'ol/geom';
import "../import_jquery.js";
import 'chosen-js';
import 'chosen-js/chosen.css';
import Daten from "../Daten";
import Klartext from './Klartext';
import Abschnitt from './Abschnitt';
import PunktObjekt from './PunktObjekt';
import HTML from '../HTML';

var CONFIG_WFS: { [index: string]: { [index: string]: { kt?: string, art: number } } } = require('../config_wfs.json');


export default class StrassenAusPunkt extends PunktObjekt {
    private hasSekObj: number;
    private art: string;

    constructor() {
        super();
        StrassenAusPunkt.loadKlartexte();
    }

    colorFunktion1(): import("ol/colorlike").ColorLike {
        return 'rgba(0,120,0,0.8)'
    }

    colorFunktion2(): import("ol/colorlike").ColorLike {
        return 'black';
    }

    getObjektKlassenName(): string {
        return "Otstrauspkt";
    }

    public static createForm(formId: string, ausstattung?: StrassenAusPunkt, changeable: boolean = false): HTMLFormElement {
        let sidebar = document.getElementById("sidebar");
        let form = HTML.createToolForm(sidebar, true, formId);

        // Art
        StrassenAusPunkt.createFields(form, formId, ausstattung, changeable);

        return form;
    }

    private static loadKlartexte() {
        Klartext.getInstanz().load('Itstrauspktart');
        Klartext.getInstanz().load('Itallglage');
        Klartext.getInstanz().load('Itquelle');
    }

    public getInfoForm(ziel: HTMLFormElement, changeable: boolean = false): void {
        StrassenAusPunkt.createFields(ziel, "sap_info", this, changeable);
    }

    static loadER(callback?: (...args: any) => void, ...args: any) {
        let daten = Daten.getInstanz();
        StrassenAusPunkt.loadKlartexte();
        PublicWFS.doQuery('Otstrauspkt', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></Filter>', StrassenAusPunkt.loadER_Callback, undefined, callback, ...args);

    }

    public static loadER_Callback(xml: XMLDocument, callback?: (...args: any) => void, ...args: any) {
        let ausstattung = xml.getElementsByTagName("Otstrauspkt");
        for (let i = 0; i < ausstattung.length; i++) {
            let f = StrassenAusPunkt.fromXML(ausstattung[i]);
            Daten.getInstanz().layerStraus.getSource().addFeature(f);
        }
        if (callback != undefined)
            callback(...args);
    }

    /**
     * Lädt einen Abschnitt nach
     * @param {Abschnitt} abschnitt 
     */
    static loadAbschnittER(abschnitt: Abschnitt, callback?: (...args: any[]) => void, ...args: any[]) {
        //console.log(daten);
        document.body.style.cursor = 'wait';
        PublicWFS.doQuery('Otstrauspkt', '<Filter>' +
            '<And><PropertyIsEqualTo><PropertyName>abschnittId</PropertyName>' +
            '<Literal>' + abschnitt.getAbschnittid() + '</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + Daten.getInstanz().ereignisraum + '</Literal></PropertyIsEqualTo></And></Filter>', StrassenAusPunkt._loadAbschnittER_Callback, undefined, callback, ...args);
    }

    static _loadAbschnittER_Callback(xml: XMLDocument, callback?: (...args: any[]) => void, ...args: any[]) {
        console.log(callback);
        let straus = xml.getElementsByTagName("Otstrauspkt");
        for (let i = 0; i < straus.length; i++) {
            let f = StrassenAusPunkt.fromXML(straus[i]);
            Daten.getInstanz().layerStraus.getSource().addFeature(f);
        }
        document.body.style.cursor = '';
        if (callback != undefined) {
            callback(...args);
        }
    }

    public static fromXML(xml: Element) {
        let r = new StrassenAusPunkt();
        r.setDataFromXML("STAUSPKT", xml);
        return r;
    }

    protected static createFields(form: HTMLFormElement, formId: string, ausstattung?: StrassenAusPunkt, changeable: boolean = false) {
        let art = Klartext.createKlartextSelectForm("Itstrauspktart", form, "Art", formId + "_art", ausstattung != undefined ? ausstattung.art : undefined);
        $(art).prop('disabled', !changeable).trigger("chosen:updated");
        form.appendChild(document.createElement("br"));

        // Lage
        let lage = Klartext.createKlartextSelectForm("Itallglage", form, "Lage", formId + "_lage", ausstattung != undefined ? ausstattung.rlageVst : undefined);
        $(lage).prop('disabled', !changeable).trigger("chosen:updated");
        form.appendChild(document.createElement("br"));

        // Quelle
        let quelle = Klartext.createKlartextSelectForm("Itquelle", form, "Quelle", formId + "_quelle", ausstattung != undefined ? ausstattung.quelle : undefined);
        $(quelle).prop('disabled', !changeable).trigger("chosen:updated");
        form.appendChild(document.createElement("br"));

        // VNK
        let vnk = HTML.createTextInput(form, "VNK", formId + "_vnk", ausstattung != undefined ? ausstattung.abschnitt.getVnk() : undefined);
        vnk.disabled = true;
        form.appendChild(document.createElement("br"));

        // NNK
        let nnk = HTML.createTextInput(form, "NNK", formId + "_nnk", ausstattung != undefined ? ausstattung.abschnitt.getNnk() : undefined);
        nnk.disabled = true;
        form.appendChild(document.createElement("br"));

        // Station
        let station = HTML.createTextInput(form, "Station", formId + "_station", ausstattung != undefined ? ausstattung.vst.toString() : undefined);
        station.disabled = true;
        form.appendChild(document.createElement("br"));

        // Abstand
        let abstTxt = "";
        if (ausstattung != undefined) {
            if (ausstattung.rabstbaVst >= 0.01) abstTxt = "R";
            else if (ausstattung.rabstbaVst <= 0.01) abstTxt = "L";
            else abstTxt = "M";
            abstTxt += " " + Math.abs(ausstattung.rabstbaVst);
        }
        let abstand = HTML.createTextInput(form, "Abstand", formId + "_abstand", abstTxt);
        abstand.disabled = true;
        form.appendChild(document.createElement("br"));

        // Button
        if (changeable) {
            let input = document.createElement("input");
            input.id = formId + "_button";
            input.type = "button"
            input.value = "Ausstattung speichern"
            input.disabled = true;
            form.appendChild(input);
        }
    }

    public changeAttributes(form: HTMLFormElement): void {
        this.art = $(form).children("#sap_info_art").children("option:selected").val() as string;
        this.rlageVst = $(form).children("#sap_info_lage").children("option:selected").val() as string;
        this.quelle = $(form).children("#sap_info_quelle").children("option:selected").val() as string;
        this.objektnr = $(form).children("#sap_info_extid").val() as string;

        let xml = this.createUpdateXML({
            'art/@xlink:href': this.art,
            'rlageVst/@xlink:href': this.rlageVst,
            'quelle/@xlink:href': this.quelle,
            'objektnr': this.objektnr,
        });
        PublicWFS.doTransaction(xml);
    }
}