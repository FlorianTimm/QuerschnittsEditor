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
import KlartextManager from './Klartext';
import Abschnitt from './Abschnitt';
import PunktObjekt from './prototypes/PunktObjekt';
import HTML from '../HTML';
import { VectorLayer } from '../openLayers/Layer';
import { Map } from 'ol';
import Klartext from './Klartext';

export default class StrassenAusPunkt extends PunktObjekt {
    static loadErControlCounter: number = 0;
    static layer: any;
    private hasSekObj: number = null;
    private art: Klartext = null;

    colorFunktion1(): import("ol/colorlike").ColorLike {
        return 'rgba(0,120,0,0.8)'
    }

    colorFunktion2(): import("ol/colorlike").ColorLike {
        return 'black';
    }

    static getLayer(map?: Map): VectorLayer {
        if (!StrassenAusPunkt.layer) {
            StrassenAusPunkt.layer = StrassenAusPunkt.createLayer(map);
        }
        return StrassenAusPunkt.layer;
    }

    getObjektKlassenName(): string {
        return "Otstrauspkt";
    }

    public static createForm(sidebar: HTMLDivElement, ausstattung?: StrassenAusPunkt, changeable: boolean = false, showForm: boolean = true): HTMLFormElement {
        let form = HTML.createToolForm(sidebar, showForm);

        // Art
        StrassenAusPunkt.createFields(form, ausstattung, changeable);

        return form;
    }

    public getInfoForm(ziel: HTMLFormElement, changeable: boolean = false): void {
        StrassenAusPunkt.createFields(ziel, this, changeable);
    }

    static loadER(): Promise<StrassenAusPunkt[]> {
        let daten = Daten.getInstanz();
        return PublicWFS.doQuery('Otstrauspkt', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></Filter>')
            .then((xml) => { return StrassenAusPunkt.loadErCallback(xml) });
    }

    static loadAbschnittER(abschnitt: Abschnitt): Promise<StrassenAusPunkt[]> {
        return PublicWFS.doQuery('Otstrauspkt', '<Filter>' +
            '<And><PropertyIsEqualTo><PropertyName>abschnittId</PropertyName>' +
            '<Literal>' + abschnitt.getAbschnittid() + '</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + Daten.getInstanz().ereignisraum + '</Literal></PropertyIsEqualTo></And></Filter>')
            .then((xml) => { return StrassenAusPunkt.loadErCallback(xml) });
    }

    public static loadErCallback(xml: XMLDocument): Promise<StrassenAusPunkt[]> {
        let straus = xml.getElementsByTagName("Otstrauspkt");
        let tasks: Promise<StrassenAusPunkt>[] = [];
        for (let i = 0; i < straus.length; i++) {
            StrassenAusPunkt.loadErControlCounter += 1
            tasks.push(StrassenAusPunkt.fromXML(straus[i])
                .then((f: StrassenAusPunkt) => {
                    StrassenAusPunkt.getLayer().getSource().addFeature(f)
                    return f
                }))
        }
        return Promise.all(tasks);
    }

    private static loadErControlCallback(callback?: (...args: any[]) => void, ...args: any[]) {
        StrassenAusPunkt.loadErControlCounter -= 1
        StrassenAusPunkt.loadErControlCheck(callback, ...args)
    }

    private static loadErControlCheck(callback?: (...args: any[]) => void, ...args: any[]) {
        if (StrassenAusPunkt.loadErControlCounter > 0) return;
        if (callback) callback(...args)
    }

    public static fromXML(xml: Element): Promise<StrassenAusPunkt> {
        let r = new StrassenAusPunkt();
        return r.setDataFromXML(xml) as Promise<StrassenAusPunkt>;
    }

    protected static createFields(form: HTMLFormElement, ausstattung?: StrassenAusPunkt, changeable: boolean = false) {
        let art = KlartextManager.createKlartextSelectForm("Itstrauspktart", form, "Art", "art", ausstattung != undefined ? ausstattung.art : undefined);
        $(art).prop('disabled', !changeable).trigger("chosen:updated");

        // Lage
        let lage = KlartextManager.createKlartextSelectForm("Itallglage", form, "Lage", "lage", ausstattung != undefined ? ausstattung.rlageVst : undefined);
        $(lage).prop('disabled', !changeable).trigger("chosen:updated");

        // Quelle
        let quelle = KlartextManager.createKlartextSelectForm("Itquelle", form, "Quelle", "quelle", ausstattung != undefined ? ausstattung.quelle : undefined);
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
        this.setArt($(form).find("#art").children("option:selected").val() as string);
        this.setRlageVst($(form).find("#lage").children("option:selected").val() as string);
        this.setQuelle($(form).find("#quelle").children("option:selected").val() as string);
        this.objektnr = $(form).find("#extid").val() as string;

        let xml = this.createUpdateXML({
            'art/@xlink:href': this.art,
            'rlageVst/@xlink:href': this.rlageVst,
            'quelle/@xlink:href': this.quelle,
            'objektnr': this.objektnr,
        });
        PublicWFS.doTransaction(xml);
    }

    // Setter
    public setArt(art: Klartext | string) {
        if (art instanceof Klartext)
            this.art = art;
        else {
            this.art = Klartext.get("Itstrauspktart", art)
        }
    }
}