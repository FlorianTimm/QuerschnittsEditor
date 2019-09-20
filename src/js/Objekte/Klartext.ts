/**
 * Klartexte (Singleton)
 * @author Florian Timm, LGV HH 
 * @version 2019.08.22
 * @copyright MIT
 */

import PublicWFS from '../PublicWFS';

export default class Klartext {
    private static instance: Klartext;
    private _klartexte: { [klartextBezeichnung: string]: { [oid: string]: { kt: string, beschreib: string, objektId: string } } };

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
            PublicWFS.doQuery(klartext, '', this.read.bind(this), undefined, klartext, whenReady, ...args);
        } else if (whenReady != undefined) {
            whenReady(this._klartexte[klartext], ...args);
        }
    }

    private read(xml: Document, klartext: string, whenReady?: (klartext: {}, ...args: any[]) => void, ...args: any[]) {
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
        if (whenReady != undefined) whenReady(this._klartexte[klartext], ...args);
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
}
