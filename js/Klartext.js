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
            let id = quer[i].getElementsByTagName('objektId')[0].firstChild.data;
            _this.klartext[id] = {
                'kt': quer[i].getElementsByTagName(_this.feld)[0].firstChild.data,
                'beschreib': quer[i].getElementsByTagName('beschreib')[0].firstChild.data,
                'objektId': quer[i].getElementsByTagName('objektId')[0].firstChild.data
            }
        }
        if (!isNullOrUndefined(_this.whenReady)) {
            _this.whenReady(_this, ..._this.args);
        }
    }

    get(bezeichnung) {
        if (bezeichnung in this.klartext)
            return this.klartext[bezeichnung];
        return null;
    }

    getAll() {
        return this.klartext;
    }
}

module.exports = Klartext;