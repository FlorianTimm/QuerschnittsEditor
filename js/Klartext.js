import PublicWFS from './PublicWFS.js';
import { isNullOrUndefined } from 'util';

class Klartext {
    constructor(bezeichnung, feld, whenReady, ...args) {
        this.klartext = {};
        this.feld = feld;
        this.bezeichnung = bezeichnung;
        this.whenReady = whenReady;
        this.args = args;
        this._load();
    }

    _load() {
        PublicWFS.doQuery(this.bezeichnung, '', this._read, undefined, this)
    }

    _read(xml, _this) {

        let quer = xml.getElementsByTagName(_this.bezeichnung)

        for (let i = 0; i < quer.length; i++) {
            let id = quer[i].getElementsByTagName('objektId')[0].firstChild.data.substr(-32);
            _this.klartext[id] = {
                'kt': quer[i].getElementsByTagName(_this.feld)[0].firstChild.data,
                'beschreib': quer[i].getElementsByTagName('beschreib')[0].firstChild.data,
                'objektId': id,
            }
        }
        if (!isNullOrUndefined(_this.whenReady)) {
            _this.whenReady(_this, ..._this.args);
        }
    }

    get(bezeichnung) {
        let bez = bezeichnung.substr(-32);
        if (bez in this.klartext) {
            //console.log(this.klartext[bez])
            return this.klartext[bez];
        }
        console.log(bez)
        console.log(this.klartext)
        return null;
    }

    getAll() {
        return this.klartext;
    }

    getAllSorted() {
        let sortable = [];
        for (let kt in this.klartext) {
            sortable.push(this.klartext[kt]);
        }

        sortable.sort(function (a, b) {
            return Number(a.kt)  - Number(b.kt);
        });

        return sortable;
    }
}

module.exports = Klartext;