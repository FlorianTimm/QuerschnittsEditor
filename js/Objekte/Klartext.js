import PublicWFS from '../PublicWFS.js';
import { isNullOrUndefined } from 'util';

class Klartext {
    _felder = {
        "Itquerart": "art",
        "Itquerober": "artober",
        "Itaufstvorart": "art",
        "Itallglage": "allglage",
        "Itquelle": "quelle",
        "Itaufstvorart":"art",
        "Itvzstvoznr":"stvoznr"
    }

    constructor() {
        this._klartexte = {};
    }

    load(klartext, whenReady, ...args) {
        if (!(klartext in this._klartexte)) {
            PublicWFS.doQuery(klartext, '', this._read, undefined, klartext, this, whenReady, ...args);
        } else {
            whenReady(this._klartexte[klartext], ...args);
        }
    }

    _read(xml, klartext, _this, whenReady, ...args) {
        if (!(klartext in _this._klartexte)) {
            _this._klartexte[klartext] = {}

            let quer = xml.getElementsByTagName(klartext)

            for (let i = 0; i < quer.length; i++) {
                let id = quer[i].getElementsByTagName('objektId')[0].firstChild.data.substr(-32);
                _this._klartexte[klartext][id] = {
                    'kt': quer[i].getElementsByTagName(_this._felder[klartext])[0].firstChild.data,
                    'beschreib': quer[i].getElementsByTagName(_this._felder[klartext])[0].firstChild.data + ' - ' + quer[i].getElementsByTagName('beschreib')[0].firstChild.data,
                    'objektId': id,
                }
            }
        }
        if (whenReady != undefined) whenReady(_this._klartexte[klartext], ...args);
    }

    get(klartext, bezeichnung) {
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

    getAll(klartext) {
        if (!(klartext in this._klartexte)) {
            this.load(klartext);
            return null;
        }
        return this.klartext;
    }

    getAllSorted(klartext) {
        if (!(klartext in this._klartexte)) {
            this.load(klartext);
            return null;
        }

        let sortable = [];
        for (let kt in this._klartexte[klartext]) {
            sortable.push(this._klartexte[klartext][kt]);
        }

        sortable.sort(function (a, b) {
            return Number(a.kt)  - Number(b.kt);
        });

        return sortable;
    }
}

module.exports = Klartext;