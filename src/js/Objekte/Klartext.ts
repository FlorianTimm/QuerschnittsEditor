/**
 * Klartexte (Singleton)
 * @author Florian Timm, LGV HH 
 * @version 2019.08.22
 * @copyright MIT
 */

import PublicWFS from '../PublicWFS';
import HTML from '../HTML';

export interface KlartextObjekt { kt: string, beschreib: string, objektId: string };
export interface KlartextMap { [oid: string]: KlartextObjekt };

export default class Klartext {
    private static instance: Klartext;
    private _klartexte: { [klartextBezeichnung: string]: KlartextMap };
    private openRequests: { [klartext: string]: boolean } = {};
    private requestCallbacks: { [klartext: string]: Callback[] } = {};

    private constructor() {
        this._klartexte = {};
    }

    public static getInstanz() {
        if (!Klartext.instance)
            this.instance = new Klartext();
        return this.instance;
    }

    public load(klartext: string, whenReady?: (klartext: KlartextMap, ...args: any[]) => void, ...args: any[]) {
        if (!(klartext in this._klartexte)) {
            if (!(klartext in this.openRequests)) {
                this.openRequests[klartext] = true;
                if (whenReady != undefined) {
                    if (this.requestCallbacks[klartext] == undefined)
                        this.requestCallbacks[klartext] = [];
                    this.requestCallbacks[klartext].push({ callback: whenReady, args: args });
                }
                PublicWFS.doQuery(klartext, '', this.read.bind(this), undefined, klartext);
            } else {
                if (whenReady != undefined)
                    this.requestCallbacks[klartext].push({ callback: whenReady, args: args });
            }

        } else if (whenReady != undefined) {
            whenReady(this._klartexte[klartext], ...args);
        }
    }

    private read(xml: Document, klartext: string) {
        if (!(klartext in this._klartexte)) {
            this._klartexte[klartext] = {}

            let quer = xml.getElementsByTagName(klartext)
            for (let i = 0; i < quer.length; i++) {
                let id = quer[i].getElementsByTagName('objektId')[0].firstChild.textContent.substr(-32);
                let beschreibListe = quer[i].getElementsByTagName('beschreib');
                let beschreib = "";
                if (beschreibListe.length > 0) {
                    beschreib = beschreibListe[0].firstChild.textContent;
                }
                var luk = quer[i].getAttribute("luk")
                this._klartexte[klartext][id] = {
                    'kt': luk,
                    'beschreib': luk + ' - ' + beschreib,
                    'objektId': id,
                }
            }
        }
        delete (this.openRequests[klartext]);
        if (this.requestCallbacks[klartext] == undefined || this.requestCallbacks[klartext].length == 0)
            return;
        let callback: Callback;
        while (callback = this.requestCallbacks[klartext].pop()) {
            callback.callback(this._klartexte[klartext], ...callback.args);
        }

    }

    public get(klartext: string, bezeichnung: string) {
        if (bezeichnung == null) return null;
        let bez = bezeichnung.substr(-32);
        if (!(klartext in this._klartexte)) {
            this.load(klartext);
            return null;
        }
        if (bez in this._klartexte[klartext]) {
            return this._klartexte[klartext][bez];
        }
        return null;
    }

    public getAll(klartext: string): { [klartextBezeichnung: string]: KlartextMap } {
        if (!(klartext in this._klartexte)) {
            this.load(klartext);
            return null;
        }
        return this._klartexte;
    }

    public getAllArray(klartext: string): KlartextObjekt[] {
        if (!(klartext in this._klartexte)) {
            this.load(klartext);
            return null;
        }

        let arr = [];
        for (let kt in this._klartexte[klartext]) {
            arr.push(this._klartexte[klartext][kt]);
        }

        return arr;
    }

    public getAllSorted(klartext: string): KlartextObjekt[] {
        let sortable = this.getAllArray(klartext)
        if (sortable == null) return null;
        //console.log(klartext)
        sortable.sort(function (a: KlartextObjekt, b: KlartextObjekt) {
            let a_pre = a.kt.match(/\d+/g);
            let b_pre = b.kt.match(/\d+/g);

            //return b_pre - a_pre;
            //console.log(a);
            //console.log(a_pre)

            if (a_pre != null && b_pre != null) {
                for (let i = 0; i < a_pre.length && i < b_pre.length; i++) {
                    if (a_pre[i] == b_pre[i]) continue;
                    return Number(a_pre[i]) - Number(b_pre[i]);
                }
            }
            if (a.kt < b.kt) return -1;
            if (a.kt > b.kt) return 1;
            return 0;
        });

        return sortable;
    }

    static createKlartextSelectForm(klartext: string, form: HTMLFormElement | HTMLDivElement, beschriftung: string, id: string, value?: string, platzhalter?: string) {
        let field = HTML.createSelectForm(form, beschriftung, id, platzhalter);
        Klartext.klartext2select(klartext, field, value, platzhalter);
        return field;
    }

    static klartext2select(klartext: string, selectInput: HTMLSelectElement, value?: string, platzhalter?: string) {
        Klartext.getInstanz().load(klartext, Klartext.klartext2select_callback, klartext, selectInput, value, platzhalter);
    }

    private static klartext2select_callback(klartexteObjekt: {}, klartext: string, selectInput: HTMLSelectElement, value: string = null, platzhalter?: string) {
        let arten = Klartext.getInstanz().getAllSorted(klartext);

        for (let a of arten) {
            let isSelected = (value != undefined && value.substr(-32) == a.objektId);
            HTML.createSelectNode(selectInput, a.beschreib, a.objektId, isSelected);
        }
        if (value == null && platzhalter != undefined) selectInput.value = null;

        $(selectInput).chosen({ width: "99%", search_contains: true, no_results_text: "Keine Übereinstimmung gefunden für ", placeholder_text_single: platzhalter });
    }
}

class Callback {
    public callback: (klartext: {}, ...args: any[]) => void;
    public args: any[];
}
