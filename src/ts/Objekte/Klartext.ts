// SPDX-License-Identifier: GPL-3.0-or-later

import { HTML } from '../HTML';
import { PublicWFS } from '../PublicWFS';
import { WaitBlocker } from '../WaitBlocker';

export interface KlartextMap { [oid: string]: Klartext };

/**
 * Klartexte (Singleton)
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.08.22
 * @license GPL-3.0-or-later
*/
export class Klartext {
    private objekt: string;
    private xlink: string;
    private kt: string;
    private beschreib: string;

    private static liste: { [klartext: string]: { [xlink: string]: Klartext } } = {}
    private static loadedKlartexte: { [klartext: string]: Promise<KlartextMap> } = {};

    private constructor(objekt: string, xlink: string, kt: string, beschreib?: string) {
        if (!(objekt in Klartext.liste)) Klartext.liste[objekt] = {}
        this.objekt = objekt;
        this.setXlinkKt(xlink, kt)
        this.beschreib = beschreib;
        Klartext.liste[objekt][xlink] = this;
    }

    static get(objekt: string, xlink: string, kt?: string, beschreib?: string): Klartext
    static get(objekt: string, klartext: Klartext): Klartext
    static get(objekt: string, param2: string | Klartext): Klartext
    static get(objekt: string, param2: string | Klartext, kt?: string, beschreib?: string): Klartext {
        let xlink: string;
        if (param2 instanceof Klartext) {
            kt = param2.kt;
            beschreib = param2.beschreib;
            xlink = param2.xlink.substr(-32)
        } else {
            xlink = param2.substr(-32);
        }

        if (!(objekt in Klartext.liste)) Klartext.liste[objekt] = {}
        if (xlink in Klartext.liste[objekt]) {
            if (kt) Klartext.liste[objekt][xlink].kt = kt;
            if (beschreib) Klartext.liste[objekt][xlink].beschreib = beschreib;
            return Klartext.liste[objekt][xlink];
        } else {
            return new Klartext(objekt, xlink, kt, beschreib);
        }
    }

    getXlink() {
        return this.xlink ? this.xlink.substr(-32) : null;
    }

    getKt() {
        return this.kt;
    }

    getObjekt() {
        return this.objekt
    }

    setXlinkKt(xlink: string, kt: string) {
        this.xlink = xlink;
        this.kt = kt;
        this.beschreib = undefined;
    }

    getBeschreib() {
        return this.beschreib ?? '';
    }

    toString() {
        return this.getXlink();
    }


    // STATIC METHODS

    public static async load(klartext: string, blocking = true): Promise<KlartextMap> {
        if (blocking)
            WaitBlocker.warteAdd();
        if (!(klartext in Klartext.loadedKlartexte))
            Klartext.loadedKlartexte[klartext] = PublicWFS.doQuery(klartext, '', blocking).then((xml) => { return Klartext.read(xml, klartext) });
        const map = await Klartext.loadedKlartexte[klartext];
        if (blocking)
            WaitBlocker.warteSub();
        return map;
    }

    private static read(xml: Document, klartext: string): KlartextMap {
        let quer = xml.getElementsByTagName(klartext)
        for (let i = 0; i < quer.length; i++) {
            let id = quer[i].getElementsByTagName('objektId')[0].firstChild.textContent.substr(-32);
            let beschreibListe = quer[i].getElementsByTagName('beschreib');
            let beschreib = "";
            if (beschreibListe.length > 0) {
                beschreib = beschreibListe[0].firstChild.textContent;
            }
            var luk = quer[i].getAttribute("luk")
            Klartext.get(klartext, id, luk, beschreib);
        }

        return Klartext.liste[klartext];
    }

    private static getAll(klartext: string): Klartext[] {
        if (!(klartext in Klartext.liste)) {
            Klartext.load(klartext);
            return null;
        }

        let arr = [];
        for (let kt in Klartext.liste[klartext]) {
            arr.push(Klartext.liste[klartext][kt]);
        }

        return arr;
    }

    public static getAllSorted(klartext: string): Klartext[] {
        let sortable = Klartext.getAll(klartext)
        if (sortable == null) return [];
        //console.log(klartext)
        sortable.sort((a: Klartext, b: Klartext) => {
            if (!a.getKt()) return -1;
            if (!b.getKt()) return 1;

            let a_pre = a.getKt().match(/\d+/g);
            let b_pre = b.getKt().match(/\d+/g);

            if (a_pre != null && b_pre != null) {
                for (let i = 0; i < a_pre.length && i < b_pre.length; i++) {
                    if (a_pre[i] == b_pre[i]) continue;
                    return Number(a_pre[i]) - Number(b_pre[i]);
                }
            }
            if (a.getKt() < b.getKt()) return -1;
            if (a.getKt() > b.getKt()) return 1;
            return 0;
        });

        return sortable;
    }


    public static getByKlartext(objekt: string, kt: string): Klartext {
        if (!(objekt in Klartext.liste)) {
            Klartext.load(objekt);
            return null;
        }

        for (let xlink in Klartext.liste[objekt]) {
            if (Klartext.liste[objekt][xlink].getKt() == kt)
                return Klartext.liste[objekt][xlink]
        }
        return null;
    }

    // HTML-Form-Methods
    static createKlartextSelectForm(klartext: string, form: HTMLFormElement | HTMLDivElement, beschriftung: string, id: string, value?: Klartext, platzhalter?: string): { select: HTMLSelectElement, promise: Promise<void> } {
        let field = HTML.createSelectForm(form, beschriftung, id, platzhalter);
        let promise = Klartext.klartext2select(klartext, field, value, platzhalter);
        return { select: field, promise: promise };
    }

    static async klartext2select(klartext: string, selectInput: HTMLSelectElement, value?: Klartext, platzhalter?: string): Promise<void> {
        const chosen = $(selectInput).chosen({ width: "99%", search_contains: true, no_results_text: "Keine Übereinstimmung gefunden für ", placeholder_text_single: "Lädt..." });
        await Klartext.load(klartext, false);
        let arten = Klartext.getAllSorted(klartext);
        for (let a of arten) {
            let isSelected = (value && value.getXlink() == a.getXlink());
            HTML.createSelectNode(selectInput, a.getKt().match('[^~]+$')[0] + ' - ' + a.getBeschreib(), a.getXlink(), isSelected);
        }
        if (value == null && platzhalter != undefined)
            selectInput.value = null;
        chosen.chosen('destroy')
        chosen.chosen({ width: "99%", search_contains: true, no_results_text: "Keine Übereinstimmung gefunden für ", placeholder_text_single: platzhalter });
    }
}