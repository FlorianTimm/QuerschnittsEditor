import PublicWFS from './PublicWFS.js';

class Klartext {
    constructor(bezeichnung, feld, whenReady, ...args) {
        this.klartext = {};
        this.feld = feld;
        this.bezeichnung = bezeichnung;
        this.whenReady = whenReady;
        _load();
    }
    
    _load() {
        PublicWFS.doQuery(this.bezeichnung, '', _read, undefined, this)
    }

    _read(xml, _this) {

        var quer = xmlhttp.responseXML.getElementsByTagName(_this.bezeichnung)

        for (var i = 0; i < quer.length; i++) {
            var art = quer[i].getElementsByTagName(_this.feld)[0].firstChild.data
            _this.klartext[art] = {
                'kt': quer[i].getElementsByTagName('beschreib')[0].firstChild.data,
                'objektId': quer[i].getElementsByTagName('objektId')[0].firstChild.data
            }
        }

    }
}

class KtArt extends Klartext() {
    constructor(whenReady, ...args) {
        super('Itquerart', 'art', whenReady, ...args)
    }
}

class KtArtOber extends Klartext() {
    constructor(whenReady, ...args) {
        super('Itquerober', 'artober', whenReady, ...args)
    }
}

module.exports = Klartext;
module.exports = KtArt;
module.exports = KtArtOber;