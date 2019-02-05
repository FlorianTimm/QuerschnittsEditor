var CONFIG = require('./config.json');
import PublicWFS from './PublicWFS.js';
import {Polygon, MultiLineString} from 'ol/geom';
import Feature from 'ol/Feature.js';
import Station from './Station.js';
import Vektor from './Vektor.js';

class Querschnitt {
    constructor(daten) {
        this.daten = daten;
        //console.log(daten);

        this.flaeche = new Feature({ geom: null, objekt: this });
        this.daten.v_quer.addFeature(this.flaeche)

        this.trenn = new Feature({ geom: null, objekt: this });
        this.daten.v_trenn.addFeature(this.trenn);

        this._aufbaudaten = null;
        this.station = null;

        this.vst = null;
        this.bst = null;
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

    static fromXML(daten, xml) {
        let r = new Querschnitt(daten);

        r.fid = xml.getAttribute('fid');

        for (let tag in CONFIG.QUERSCHNITT) {
            //console.log(tag);
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
            } 
        }
        //console.log(r)

        let abschnitt = r.daten.getAbschnitt(r.abschnittId);

        if (!(abschnitt.existsStation(r.vst))) {
            let koords = xml.getElementsByTagName('gml:coordinates')[0].firstChild.data.split(' ');
            let geo = [];

            for (let i = 0; i < koords.length; i++) {
                let k = koords[i].split(',')
                let x = Number(k[0]);
                let y = Number(k[1]);
                geo.push([x, y]);
            }
            r.station = new Station(r.daten, abschnitt, r.vst, r.bst, geo);
        } else {
            r.station = abschnitt.getStation(r.vst);
        }

        r.station.addQuerschnitt(r);

        r.createGeom();
        return r;
    }



    getAufbauDaten() {
        if (this._aufbaudaten == null) {
            let xml = PublicWFS.doQuery('Otschicht', '<ogc:Filter><ogc:And>' +
                '<ogc:PropertyIsEqualTo>' +
                '    <ogc:Property>projekt/@xlink:href</ogc:Property>' +
                '    <ogc:Literal>' + ereignisraum + '</ogc:Literal>' +
                '  </ogc:PropertyIsEqualTo>' +
                '  <ogc:PropertyIsEqualTo>' +
                '    <ogc:Property>parent/@xlink:href</ogc:Property>' +
                '    <ogc:Literal>' + this.fid + '</ogc:Literal>' +
                '  </ogc:PropertyIsEqualTo>' +
                '</ogc:And></ogc:Filter>', this._parseAufbaudaten(xml, this));
        }
    }

    _parseAufbaudaten(xml, _this) {
        let aufbaudaten = {};
        let aufbau = xml.getElementsByTagName('Otschicht');

        for (let schicht in aufbau) {
            let a = Aufbau.fromXML(schicht);

            _this._aufbaudaten[a.schicht] = a;
        }
        _this._aufbaudaten = aufbaudaten;
    }

    createGeom() {
        let g = [];
        let l = [];
        let r = [];

        let abst1 = this.XVstR
        let diff1 = this.XBstR - abst1
        let abst2 = this.XVstL
        let diff2 = this.XBstL - abst2

        let anzahl = this.station.geo.length;

        for (let j = 0; j < anzahl; j++) {
            let coord = Vektor.sum(this.station.geo[j], Vektor.multi(this.station.vector[j], this.station.seg[j] * diff2 + abst2));
            g.push(coord);
            l.push(coord);
        }

        for (let j = anzahl - 1; j >= 0; j--) {
            let coord = Vektor.sum(this.station.geo[j], Vektor.multi(this.station.vector[j], this.station.seg[j] * diff1 + abst1));
            g.push(coord);
            r.unshift(coord);
        }

        if (this.streifen == "L") this.trenn.setGeometry(new MultiLineString([l]));
        else if (this.streifen == "R") this.trenn.setGeometry(new MultiLineString([r]));
        else this.trenn.setGeometry(new MultiLineString([l, r]));

        g.push(g[0])
        this.flaeche.setGeometry(new Polygon([g])) //setCoordinates([g])


    }

    createXML() {


    }

    editBreite(edit, diff, fit) {
        let streifen = this.station.getStreifen(this.streifen);
        let nr = this.streifennr;
        let editiert = [];

        if (fit) {
            // Anpassen
            if (streifen != 'M' && (this.streifennr + 1) in streifen) {
                if (streifen == 'L')
                    streifen[nr + 1]['X' + edit + 'R'] += diff;
                else if (streifen == 'R')
                    streifen[nr + 1]['X' + edit + 'L'] += diff;
                streifen[nr + 1]['breite'] =
                    Math.round(100 * (streifen[nr + 1]['XVstR'] - streifen[nr + 1]['XVstL']));
                streifen[nr + 1]['bisBreite'] =
                    Math.round(100 * (streifen[nr + 1]['XBstR'] - streifen[nr + 1]['XBstL']));
                streifen[nr+1].createGeom();
                editiert.push(streifen[nr+1]);
            }
        } else {
            // Verschieben
            for (var nnr in streifen) {
                if (nnr <= nr)
                    continue;
                streifen[nnr]['X' + edit + 'L'] += diff;
                streifen[nnr]['X' + edit + 'R'] += diff;
                streifen[nnr].createGeom();
                editiert.push(streifen[nnr]);
            }
        }
        this.createGeom();

        
    }
}


module.exports = Querschnitt;