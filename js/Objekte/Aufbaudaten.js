var CONFIG = require('./config.json');

class Aufbau {
    constructor() {
        this.abschnittOderAst = null;
        this.parent = null;
        this.vst = null;
		this.bst = null;
		this.teilnr = null;
		this.teilbreite = null;
		this.decksch = null;
		this.baujahr = null;
		this.dicke = null;
		this.baumonat = null;
		this.korngr = null;
		this.unscharf = null;
		this.kennz = null;
		this.artnull = null;
		this.art2 = null;
		this.art3 = null;
		this.artneu = null;
		this.materialnull = null;
		this.material2 = null;
		this.material3 = null;
		this.bindemitnull = null;
		this.bindemit2 = null;
		this.detaila = null;
		this.detailb = null;
		this.detailc = null;
		this.detaild = null;
		this.umweltr = null;
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

    static fromXML (xml) {
        let r = new Aufbau();
        for (var tag in CONFIG.AUFBAUDATEN) {
            if (xml.getElementsByTagName(tag).length <= 0) continue;
            if (CONFIG.AUFBAUDATEN[tag].art == 0) {
                // Kein Klartext
                r[tag] = xml.getElementsByTagName(tag)[0].firstChild.data;
            } else if (CONFIG.AUFBAUDATEN[tag].art == 1) {
                // Kein Klartext
                r[tag] = Number(xml.getElementsByTagName(tag)[0].firstChild.data);
            } else if (CONFIG.AUFBAUDATEN[tag].art == 2) {
                // Klartext, xlink wird gespeichert
                r[tag] = xml.getElementsByTagName(tag)[0].getAttribute('xlink:href');
            } 
		}
        return r;
	}
	
	createXML() {
        let r = '<Otschicht>\n';

        for (let tag in CONFIG.QUERSCHNITT) {
            //console.log(tag);
            if (this[tag] === null) continue;
            if (CONFIG.QUERSCHNITT[tag].art == 0 || CONFIG.QUERSCHNITT[tag] == 1) {
                // Kein Klartext
                r += '<' + tag + '>' + this[tag] + '</' + tag + '>\n';
                r[tag] = Number(xml.getElementsByTagName(tag)[0].firstChild.data);
            } else if (CONFIG.QUERSCHNITT[tag].art == 2) {
                // Klartext
                r += '<' + tag + ' xlink:href="' + this[tag] + '" typeName="' + CONFIG.QUERSCHNITT[tag].kt + '" />' + this[tag];
            }
        }

        r += '</Otschicht>\n';
    }
}

module.exports = Aufbau;