// SPDX-License-Identifier: GPL-3.0-or-later

import 'chosen-js';
import 'chosen-js/chosen.css';
import { Map } from 'ol';
import { never } from 'ol/events/condition';
import Daten from "../Daten";
import HTML from '../HTML';
import "../import_jquery.js";
import { SelectInteraction } from '../openLayers/Interaction';
import { VectorLayer } from '../openLayers/Layer';
import PublicWFS from '../PublicWFS';
import Abschnitt from './Abschnitt';
import { default as Klartext, default as KlartextManager } from './Klartext';
import PunktObjekt from './prototypes/PunktObjekt';

/**
 * Strassenausstrattung (punktuell)
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.10.29
 * @license GPL-3.0-or-later
*/
export default class StrassenAusPunkt extends PunktObjekt {
    static loadErControlCounter: number = 0;
    static layer: any;
    private hasSekObj: number = null;
    private art: Klartext = null;
    private static select: SelectInteraction;

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

    static getSelect(): SelectInteraction {
        if (!StrassenAusPunkt.select) {
            StrassenAusPunkt.select = new SelectInteraction({
                layers: [StrassenAusPunkt.getLayer()],
                hitTolerance: 10,
                toggleCondition: never
            });
        }
        return StrassenAusPunkt.select;
    }

    getObjektKlassenName(): string {
        return "Otstrauspkt";
    }

    public static createForm(sidebar: HTMLDivElement, ausstattung?: StrassenAusPunkt, changeable: boolean = false, showForm: boolean = true): { form: HTMLFormElement, promise: Promise<void[]> } {
        let form = HTML.createToolForm(sidebar, showForm);

        // Art
        let promise = StrassenAusPunkt.createFields(form, ausstattung, changeable);

        return { form: form, promise: promise }
    }

    public getInfoForm(ziel: HTMLFormElement, changeable: boolean = false): Promise<void[]> {
        return StrassenAusPunkt.createFields(ziel, this, changeable);
    }

    static async loadER(): Promise<StrassenAusPunkt[]> {
        let daten = Daten.getInstanz();
        const xml = await PublicWFS.doQuery('Otstrauspkt', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></Filter>');
        return StrassenAusPunkt.loadErCallback(xml);
    }

    static async loadAbschnittER(abschnitt: Abschnitt): Promise<StrassenAusPunkt[]> {
        const xml = await PublicWFS.doQuery('Otstrauspkt', '<Filter>' +
            '<And><PropertyIsEqualTo><PropertyName>abschnittId</PropertyName>' +
            '<Literal>' + abschnitt.getAbschnittid() + '</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + Daten.getInstanz().ereignisraum + '</Literal></PropertyIsEqualTo></And></Filter>');
        return StrassenAusPunkt.loadErCallback(xml);
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

    public static fromXML(xml: Element): Promise<StrassenAusPunkt> {
        let r = new StrassenAusPunkt();
        return r.setDataFromXML(xml) as Promise<StrassenAusPunkt>;
    }

    protected static createFields(form: HTMLFormElement, ausstattung?: StrassenAusPunkt, changeable: boolean = false): Promise<void[]> {
        let art = KlartextManager.createKlartextSelectForm("Itstrauspktart", form, "Art", "art", ausstattung != undefined ? ausstattung.art : undefined);
        $(art.select).prop('disabled', !changeable).trigger("chosen:updated");

        // Lage
        let lage = KlartextManager.createKlartextSelectForm("Itallglage", form, "Lage", "lage", ausstattung != undefined ? ausstattung.rlageVst : undefined);
        $(lage.select).prop('disabled', !changeable).trigger("chosen:updated");

        // Quelle
        let quelle = KlartextManager.createKlartextSelectForm("Itquelle", form, "Quelle", "quelle", ausstattung != undefined ? ausstattung.quelle : undefined);
        $(quelle.select).prop('disabled', !changeable).trigger("chosen:updated");

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

        // Abstand Links
        let abstTxtL = "";
        let checked = false;
        if (ausstattung != undefined && ausstattung.labstbaVst != null && ausstattung.rabstbaVst != ausstattung.labstbaVst) {
            if (ausstattung.labstbaVst >= 0.01) abstTxtL = "R";
            else if (ausstattung.labstbaVst <= 0.01) abstTxtL = "L";
            else abstTxtL = "M";
            abstTxtL += " " + Math.abs(ausstattung.labstbaVst);
            checked = true;
        }
        let abstandL = HTML.createCheckboxTextInput(form, "linker Abstand", "abstandL", abstTxtL);
        abstandL.input.disabled = true;
        abstandL.checkbox.checked = checked;
        abstandL.checkbox.disabled = !changeable;

        return Promise.all([art.promise, lage.promise, quelle.promise]);
    }

    public async changeAttributes(form: HTMLFormElement): Promise<Document> {
        this.setArt($(form).find("#art").children("option:selected").val() as string);
        this.setRlageVst($(form).find("#lage").children("option:selected").val() as string);
        this.setQuelle($(form).find("#quelle").children("option:selected").val() as string);
        this.objektnr = $(form).find("#extid").val() as string;

        let update = {
            'art/@xlink:href': this.art,
            'rlageVst/@xlink:href': this.rlageVst,
            'quelle/@xlink:href': this.getQuelle(),
            'objektnr': this.getObjektnr(),
        };

        let vorher = this.labstbaVst != null && this.rabstbaVst != this.labstbaVst
        if ($(form).find("#abstandL_checkbox").is(":checked") as boolean != vorher) {
            if (vorher) {
                // vorher zweibeinig, nun nicht mehr
                this.labstbaVst = undefined;
                this.vabstVst = this.rabstbaVst;
            } else {
                // vorher einbeinig nun nicht mehr
                this.labstbaVst = this.rabstbaVst - 5;
                this.vabstVst = this.rabstbaVst - 2.5;
            }
            this.vabstBst = this.vabstVst;
            update['labstbaVst'] = this.labstbaVst;
            update['vabstVst'] = this.vabstVst;
            update['vabstBst'] = this.vabstBst;
            $(form).find("#abstandL").val(this.labstbaVst ?? '')
            this.calcGeometry();
        }

        let xml = this.createUpdateXML(update);
        return PublicWFS.doTransaction(xml);
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