var CONFIG_WFS = require('../config_wfs.json');

class Zeichen {
    constructor(daten) {
        this._daten = daten;

        this.projekt = null;
        this.hasSekObj = null;
        this.vst = null;
        this.bst = null;
        this.stvoznr = null;
        this.sort = null;
        this.vztext = null;
        this.lageFb = null;
        this.fsnummer = null;
        this.lesbarkeit = null;
        this.strbezug = null;
        this.bauart = null;
        this.groesse = null;
        this.art = null;
        this.hersteller = null;
        this.herstdat = null;
        this.aufstelldat = null;
        this.aufhebdat = null;
        this.beleucht = null;
        this.sichtbar = null;
        this.lesbarT = null;
        this.lesbarN = null;
        this.sichtbar = null;
        this.unterhaltstat = null;
        this.verdeckbar = null;
        this.aufnahme = null;
        this.zuordnung = null;
        this.ausfuehr = null;
        this.kherk = null;
		this.baujahrGew = null;
		this.abnahmeGew = null;
		this.dauerGew = null;
		this.ablaufGew = null;
		this.objektId = null;
		this.objektnr = null;
		this.erfart = null;
		this.quelle = null;
		this.ADatum = null;
		this.bemerkung = null;
		this.bearbeiter = null;
		this.behoerde = null
    }

    static fromXML (xml, daten) {
		//console.log(xml);
        let r = new Zeichen(daten);
        for (var tag in CONFIG_WFS.ZEICHEN) {
            if (xml.getElementsByTagName(tag).length <= 0) continue;
            if (CONFIG_WFS.ZEICHEN[tag].art == 0) {
                // Kein Klartext
                r[tag] = xml.getElementsByTagName(tag)[0].firstChild.data;
            } else if (CONFIG_WFS.ZEICHEN[tag].art == 1) {
                // Kein Klartext
                r[tag] = Number(xml.getElementsByTagName(tag)[0].firstChild.data);
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
                r[tag] = Number(xml.getElementsByTagName(tag)[0].firstChild.data);
            } else if (CONFIG_WFS.ZEICHEN[tag].art == 2) {
                // Klartext
                r += '<' + tag + ' xlink:href="' + this[tag] + '" typeName="' + CONFIG_WFS.ZEICHEN[tag].kt + '" />' + this[tag];
            }
        }

        r += '</Otvzeichlp>\n';
    }
}

module.exports = Zeichen;