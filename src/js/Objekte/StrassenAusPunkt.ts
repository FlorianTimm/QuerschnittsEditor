/**
 * Strassenausstrattung (punktuell)
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */

import PublicWFS from '../PublicWFS';
import "../import_jquery.js";
import 'chosen-js';
import 'chosen-js/chosen.css';
import Daten from "../Daten";
import Klartext from './Klartext';
import Abschnitt from './Abschnitt';
import PunktObjekt from './prototypes/PunktObjekt';
import HTML from '../HTML';

export default class StrassenAusPunkt extends PunktObjekt {
    getWFSKonfigName(): string {
        return "STAUSPKT";
    }
    private hasSekObj: number = null;
    private art: string = null;

    colorFunktion1(): import("ol/colorlike").ColorLike {
        return 'rgba(0,120,0,0.8)'
    }

    colorFunktion2(): import("ol/colorlike").ColorLike {
        return 'black';
    }

    getObjektKlassenName(): string {
        return "Otstrauspkt";
    }

    public static createForm(ausstattung?: StrassenAusPunkt, changeable: boolean = false, showForm: boolean = true): HTMLFormElement {
        let sidebar = document.getElementById("sidebar");
        let form = HTML.createToolForm(sidebar, showForm);

        // Art
        StrassenAusPunkt.createFields(form, ausstattung, changeable);

        return form;
    }

    public getInfoForm(ziel: HTMLFormElement, changeable: boolean = false): void {
        StrassenAusPunkt.createFields(ziel, this, changeable);
    }

    static loadER(callback?: (...args: any) => void, ...args: any) {
        let daten = Daten.getInstanz();
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
        //console.log(callback);
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
        r.setDataFromXML(xml);
        return r;
    }

    protected static createFields(form: HTMLFormElement, ausstattung?: StrassenAusPunkt, changeable: boolean = false) {
        let art = Klartext.createKlartextSelectForm("Itstrauspktart", form, "Art", "art", ausstattung != undefined ? ausstattung.art : undefined);
        $(art).prop('disabled', !changeable).trigger("chosen:updated");

        // Lage
        let lage = Klartext.createKlartextSelectForm("Itallglage", form, "Lage", "lage", ausstattung != undefined ? ausstattung.rlageVst : undefined);
        $(lage).prop('disabled', !changeable).trigger("chosen:updated");

        // Quelle
        let quelle = Klartext.createKlartextSelectForm("Itquelle", form, "Quelle", "quelle", ausstattung != undefined ? ausstattung.quelle : undefined);
        $(quelle).prop('disabled', !changeable).trigger("chosen:updated");

        // VNK
        let vnk = HTML.createTextInput(form, "VNK", "vnk", ausstattung != undefined ? ausstattung.abschnitt.getVnk() : undefined);
        vnk.disabled = true;

        // NNK
        let nnk = HTML.createTextInput(form, "NNK", "nnk", ausstattung != undefined ? ausstattung.abschnitt.getNnk() : undefined);
        nnk.disabled = true;

        // Station
        let station = HTML.createTextInput(form, "Station", "station", ausstattung != undefined ? ausstattung.vst.toString() : undefined);
        station.disabled = true;

        // Abstand
        let abstTxt = "";
        if (ausstattung != undefined) {
            if (ausstattung.rabstbaVst >= 0.01) abstTxt = "R";
            else if (ausstattung.rabstbaVst <= 0.01) abstTxt = "L";
            else abstTxt = "M";
            abstTxt += " " + Math.abs(ausstattung.rabstbaVst);
        }
        let abstand = HTML.createTextInput(form, "Abstand", "abstand", abstTxt);
        abstand.disabled = true;
    }

    public changeAttributes(form: HTMLFormElement): void {
        this.art = $(form).find("#art").children("option:selected").val() as string;
        this.rlageVst = $(form).find("#lage").children("option:selected").val() as string;
        this.quelle = $(form).find("#quelle").children("option:selected").val() as string;
        this.objektnr = $(form).find("#extid").val() as string;

        let xml = this.createUpdateXML({
            'art/@xlink:href': this.art,
            'rlageVst/@xlink:href': this.rlageVst,
            'quelle/@xlink:href': this.quelle,
            'objektnr': this.objektnr,
        });
        PublicWFS.doTransaction(xml);
    }
}