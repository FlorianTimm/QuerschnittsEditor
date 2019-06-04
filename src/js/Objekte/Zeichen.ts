import Daten from "../Daten";

var CONFIG_WFS = require('../config_wfs.json');

class Zeichen {
    _daten: Daten;
    projekt: string = null;
    hasSekObj: string = null;
    vst: number = null;
    bst: number = null;
    stvoznr: string = null;
    sort: number = null;
    vztext: string = null;
    lageFb: string = null;
    fsnummer: number = null;
    lesbarkeit: string = null;
    strbezug: string = null;
    bauart: string = null;
    groesse: string = null;
    art: string = null;
    hersteller: string = null;
    herstdat: string = null;
    aufstelldat: string = null;
    aufhebdat: string = null;
    beleucht: string = null;
    sichtbar: string = null;
    lesbarT: string = null;
    lesbarN: string = null;
    unterhaltstat: string = null;
    verdeckbar: string = null;
    aufnahme: string = null;
    zuordnung: string = null;
    ausfuehr: string = null;
    kherk: string = null;
    baujahrGew: string = null;
    abnahmeGew: string = null;
    dauerGew: string = null;
    ablaufGew: string = null;
    objektId: string = null;
    objektnr: string = null;
    erfart: string = null;
    quelle: string = null;
    ADatum: string = null;
    bemerkung: string = null;
    bearbeiter: string = null;
    behoerde: string = null;

    constructor(daten: Daten) {
        this._daten = daten;
    }

    static fromXML (xml: Document, daten) {
		//console.log(xml);
        let r = new Zeichen(daten);
        for (var tag in CONFIG_WFS.ZEICHEN) {
            if (xml.getElementsByTagName(tag).length <= 0) continue;
            if (CONFIG_WFS.ZEICHEN[tag].art == 0) {
                // Kein Klartext
                r[tag] = xml.getElementsByTagName(tag)[0].firstChild.textContent;
            } else if (CONFIG_WFS.ZEICHEN[tag].art == 1) {
                // Kein Klartext
                r[tag] = Number(xml.getElementsByTagName(tag)[0].firstChild.textContent);
            } else if (CONFIG_WFS.ZEICHEN[tag].art == 2) {
                // Klartext, xlink wird gespeichert
                r[tag] = xml.getElementsByTagName(tag)[0].getAttribute('xlink:href');
            } 
		}
        return r;
	}
	
	createXML() {
        let r = '<Otvzeichlp>\n';

        for (let tag in CONFIG_WFS.ZEICHEN) {
            //console.log(tag);
            if (this[tag] === null) continue;
            if (CONFIG_WFS.ZEICHEN[tag].art == 0 || CONFIG_WFS.ZEICHEN[tag] == 1) {
                // Kein Klartext
                r += '<' + tag + '>' + this[tag] + '</' + tag + '>\n';
            } else if (CONFIG_WFS.ZEICHEN[tag].art == 2) {
                // Klartext
                r += '<' + tag + ' xlink:href="' + this[tag] + '" typeName="' + CONFIG_WFS.ZEICHEN[tag].kt + '" />' + this[tag];
            }
        }

        r += '</Otvzeichlp>\n';
    }
}

export default Zeichen;