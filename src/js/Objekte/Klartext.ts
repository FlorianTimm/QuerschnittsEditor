/**
 * Klartexte (Singleton)
 * @author Florian Timm, LGV HH 
 * @version 2019.08.22
 * @copyright MIT
 */

import PublicWFS from '../PublicWFS';
import HTML from '../HTML';
import { type } from 'os';

export default class Klartext {
    private static instance: Klartext;
    private _klartexte: { [klartextBezeichnung: string]: { [oid: string]: { kt: string, beschreib: string, objektId: string } } };
    private openRequests: { [klartext: string]: boolean } = {};
    //{ callback: (klartext: {}, ...args: any[]) => void, args: any[] }
    private requestCallbacks: { [klartext: string]: Callback[] } = {};

    private constructor() {
        this._klartexte = {};
    }

    public static getInstanz() {
        if (!Klartext.instance)
            this.instance = new Klartext();
        return this.instance;
    }

    public load(klartext: string, whenReady?: (klartext: {}, ...args: any[]) => void, ...args: any[]) {
        if (!(klartext in this._klartexte)) {
            if (!(klartext in this.openRequests)) {
                this.openRequests[klartext] = true;
                if (whenReady != undefined) {
                    if (this.requestCallbacks[klartext] == undefined)
                        this.requestCallbacks[klartext] = [];
                    this.requestCallbacks[klartext].push({ callback: whenReady, args: args });
                }
                PublicWFS.doQuery(klartext, '', this.read.bind(this), undefined, klartext);
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

    public getAll(klartext: string): { [klartextBezeichnung: string]: { [objektId: string]: { kt: string, beschreib: string, objektId: string } } } {
        if (!(klartext in this._klartexte)) {
            this.load(klartext);
            return null;
        }
        return this._klartexte;
    }

    public getAllArray(klartext: string): { kt: string, beschreib: string, objektId: string }[] {
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

    public getAllSorted(klartext: string): { kt: string, beschreib: string, objektId: string }[] {
        let sortable = this.getAllArray(klartext)
        if (sortable == null) return null;
        //console.log(klartext)
        sortable.sort(function (a: { kt: string, beschreib: string, objektId: string }, b: { kt: string, beschreib: string, objektId: string }) {
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

    static createKlartextSelectForm(klartext: string, form: HTMLFormElement, beschriftung: string, id: string, value?: string) {
        let field = HTML.createSelectForm(form, beschriftung, id);
        Klartext.klartext2select(klartext, field, value);
        return field;
    }

    static klartext2select(klartext: string, selectInput: HTMLSelectElement, value?: string) {
        Klartext.getInstanz().load(klartext, Klartext.klartext2select_callback, klartext, selectInput, value);
    }

    private static klartext2select_callback(klartexteObjekt: {}, klartext: string, selectInput: HTMLSelectElement, value?: string) {
        let arten = Klartext.getInstanz().getAllSorted(klartext);
        for (let a of arten) {
            let option = document.createElement('option');
            let t = document.createTextNode(a.beschreib);
            option.appendChild(t);
            option.setAttribute('value', a.objektId);
            if (value != undefined && value.substr(-32) == a.objektId) {
                option.setAttribute("selected", "selected");
            }
            selectInput.appendChild(option);
        }
        $(selectInput).chosen({ width: "95%", search_contains: true });
    }
}

class Callback {
    public callback: (klartext: {}, ...args: any[]) => void;
    public args: any[];
}
