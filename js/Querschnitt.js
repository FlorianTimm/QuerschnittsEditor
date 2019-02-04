var CONFIG = require('./config.json');
import PublicWFS from './PublicWFS.js';

class Querschnitt extends Feature {
    constructor() {
        super();
        this.geom = null;
        this.trenn = null;
        this._aufbaudaten = null;

        this.fid = null;
        this.abschnittId = null;
        this.art = null;
		this.artober = null;
		this.breite = null;
		this.bisBreite = null;
		this.blpart = null;
		this.blpartnull = null;
		this.uipart = null;
		this.uipartnull = null;
		this.XVstL = null;
		this.XVstR = null;
		this.XBstL = null;
		this.XBstR = null;
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
        let r = new Querschnitt();

        r.fid = xml.getAttribute('fid');

        for (var tag in CONFIG.QUERSCHNITT) {
            if (xml.getElementsByTagName(tag).length <= 0) continue;
            if (CONFIG.QUERSCHNITT[tag] == 0) {
                // Kein Klartext
                r[tag] = xml.getElementsByTagName(tag)[0].firstChild.data;
            } else if (CONFIG.QUERSCHNITT[tag] == 1) {
                // Kein Klartext
                r[tag] = Number(xml.getElementsByTagName(tag)[0].firstChild.data);
            } else if (CONFIG.QUERSCHNITT[tag] == 2) {
                // Klartext, xlink wird gespeichert
                r[tag] = xml.getElementsByTagName(tag)[0].getAttribute('xlink:href');
            } else if (CONFIG.QUERSCHNITT[tag] == 3) {
                // Klartext, luk gespeichert
                r[tag] = xml.getElementsByTagName(tag)[0].getAttribute('luk');
            }
        }
        return r;
    }

    getAufbauDaten() {
        if (this._aufbaudaten == null) {
            let xml = PublicWFS.doQueryWait('Otschicht','<ogc:Filter><ogc:And>'+
            '<ogc:PropertyIsEqualTo>'+
            '    <ogc:Property>projekt/@xlink:href</ogc:Property>'+
            '    <ogc:Literal>' + ereignisraum + '</ogc:Literal>'+
            '  </ogc:PropertyIsEqualTo>'+
            '  <ogc:PropertyIsEqualTo>'+
            '    <ogc:Property>parent/@xlink:href</ogc:Property>'+
            '    <ogc:Literal>' + this.fid + '</ogc:Literal>'+
            '  </ogc:PropertyIsEqualTo>'+
            '</ogc:And></ogc:Filter>');
            
            if(xml == null) PublicWFS.showMessage('Aufbaudaten konnten nicht geladen werden');
            else this._parseAufbaudaten(xml);
        }
        return this._aufbaudaten;
    }

    _parseAufbaudaten (xml) {
        let aufbaudaten = {};
        let aufbau = xml.getElementsByTagName('Otschicht');

        for (let schicht in aufbau) {
            let a = Aufbau.fromXML(schicht);

            this._aufbaudaten[a.schicht] = a;
        }
        this._aufbaudaten = aufbaudaten;
    }
}


module.exports = Querschnitt;