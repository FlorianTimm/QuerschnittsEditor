var CONFIG_WFS = require('../config_wfs.json');
import PublicWFS from '../PublicWFS.js';
import { Polygon, MultiLineString } from 'ol/geom';
import Feature from 'ol/Feature.js';
import Station from './QuerStation.js';
import Vektor from '../Vektor.js';

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

    static loadER(daten, callback, ...args) {
        document.body.style.cursor = 'wait'
        PublicWFS.doQuery('Dotquer', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></Filter>', Querschnitt._loadER_Callback, undefined, daten, callback, ...args);
    }

    static loadAbschnittER(daten, abschnitt, callback, ...args) {
        document.body.style.cursor = 'wait'
        PublicWFS.doQuery('Dotquer', '<Filter>' +
            '<And><PropertyIsEqualTo><PropertyName>abschnittId</PropertyName>' +
            '<Literal>' + abschnitt.abschnittid + '</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></And></Filter>', Querschnitt._loadER_Callback, undefined, daten, callback, ...args);
    }

    static _loadER_Callback(xml, daten, callback, ...args) {
        let dotquer = xml.getElementsByTagName("Dotquer");
        for (let quer of dotquer) {
            //console.log(quer);
            Querschnitt.fromXML(daten, quer);
        }
        if (callback != undefined) {
            callback(...args);
        }
        document.body.style.cursor = ''
    }


    static fromXML(daten, xml) {
        let r = new Querschnitt(daten);

        r.fid = xml.getAttribute('fid');
        daten.querschnitteFID[r.fid] = r;

        for (let tag in CONFIG_WFS.QUERSCHNITT) {
            //console.log(tag);
            if (xml.getElementsByTagName(tag).length <= 0) continue;
            if (CONFIG_WFS.QUERSCHNITT[tag].art == 0) {
                // Kein Klartext
                r[tag] = xml.getElementsByTagName(tag)[0].firstChild.data;
            } else if (CONFIG_WFS.QUERSCHNITT[tag].art == 1) {
                // Kein Klartext
                r[tag] = Number(xml.getElementsByTagName(tag)[0].firstChild.data);
            } else if (CONFIG_WFS.QUERSCHNITT[tag].art == 2) {
                // Klartext, xlink wird gespeichert
                r[tag] = xml.getElementsByTagName(tag)[0].getAttribute('xlink:href');
            }
        }
        //console.log(r)

        let abschnitt = r.daten.getAbschnitt(r.abschnittId);
        abschnitt.inER['Querschnitt'] = true;

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
            let xml = PublicWFS.doQuery('Otschicht', '<ogc:Filter><ogc:And>\n' +
                '<ogc:PropertyIsEqualTo>\n' +
                '    <ogc:Property>projekt/@xlink:href</ogc:Property>\n' +
                '    <ogc:Literal>' + ereignisraum + '</ogc:Literal>\n' +
                '  </ogc:PropertyIsEqualTo>\n' +
                '  <ogc:PropertyIsEqualTo>\n' +
                '    <ogc:Property>parent/@xlink:href</ogc:Property>\n' +
                '    <ogc:Literal>' + this.fid + '</ogc:Literal>\n' +
                '  </ogc:PropertyIsEqualTo>\n' +
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

    createInsertXML() {
        let r = '<wfs:Insert>\n<Dotquer>\n';

        for (let tag in CONFIG_WFS.QUERSCHNITT) {
            //console.log(tag);
            if (this[tag] === null || this[tag] === undefined) continue;
            if (CONFIG_WFS.QUERSCHNITT[tag].art == 0 || CONFIG_WFS.QUERSCHNITT[tag].art == 1) {
                // Kein Klartext
                r += '<' + tag + '>' + this[tag] + '</' + tag + '>\n';
            } else if (CONFIG_WFS.QUERSCHNITT[tag].art == 2) {
                // Klartext
                r += '<' + tag + ' xlink:href="' + this[tag] + '" typeName="' + CONFIG_WFS.QUERSCHNITT[tag].kt + '" />\n';
            }
        }

        r += '</Dotquer>\n</wfs:Insert>\n';
        return r;
    }

    createUpdateBreiteXML() {
        return '<wfs:Update typeName="Dotquer">\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>breite</wfs:Name>\n' +
            '		<wfs:Value>' + Math.round(this.breite) + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>bisBreite</wfs:Name>\n' +
            '		<wfs:Value>' + Math.round(this.bisBreite) + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>XVstL</wfs:Name>\n' +
            '		<wfs:Value>' + Math.round(this.XVstL * 100) / 100 + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>XVstR</wfs:Name>\n' +
            '		<wfs:Value>' + Math.round(this.XVstR * 100) / 100 + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>XBstL</wfs:Name>\n' +
            '		<wfs:Value>' + Math.round(this.XBstL * 100) / 100 + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>XBstR</wfs:Name>\n' +
            '		<wfs:Value>' + Math.round(this.XBstR * 100) / 100 + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<ogc:Filter>\n' +
            '		<ogc:And>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>objektId</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.objektId + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.projekt + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '		</ogc:And>\n' +
            '	</ogc:Filter>\n' +
            '</wfs:Update>';
    }


    createUpdateStreifenXML() {
        return '<wfs:Update typeName="Dotquer">\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>streifennr</wfs:Name>\n' +
            '		<wfs:Value>' + this.streifennr + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>XVstL</wfs:Name>\n' +
            '		<wfs:Value>' + Math.round(this.XVstL * 100) / 100 + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>XVstR</wfs:Name>\n' +
            '		<wfs:Value>' + Math.round(this.XVstR * 100) / 100 + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>XBstL</wfs:Name>\n' +
            '		<wfs:Value>' + Math.round(this.XBstL * 100) / 100 + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>XBstR</wfs:Name>\n' +
            '		<wfs:Value>' + Math.round(this.XBstR * 100) / 100 + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<ogc:Filter>\n' +
            '		<ogc:And>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>objektId</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.objektId + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.projekt + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '		</ogc:And>\n' +
            '	</ogc:Filter>\n' +
            '</wfs:Update>';
    }

    createUpdateArtXML() {
        return '<wfs:Update typeName="Dotquer">\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>art/@xlink:href</wfs:Name>\n' +
            '		<wfs:Value>' + this.art + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>artober/@xlink:href</wfs:Name>\n' +
            '		<wfs:Value>' + this.artober + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<ogc:Filter>\n' +
            '		<ogc:And>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>objektId</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.objektId + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.projekt + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '		</ogc:And>\n' +
            '	</ogc:Filter>\n' +
            '</wfs:Update>';
    }


    updateArt(art, artober) {
        this.art = art;
        this.artober = artober;

        PublicWFS.doTransaction(this.createUpdateArtXML());
    }


    editBreite(edit, diff, fit) {
        let gesStreifen = this.station.getStreifen(this.streifen);
        let nr = this.streifennr;

        let soap = this.createUpdateBreiteXML();

        if (fit) {
            // Anpassen
            if (this.streifen != 'M' && (this.streifennr + 1) in gesStreifen) {
                if (this.streifen == 'L')
                    gesStreifen[nr + 1]['X' + edit + 'R'] += diff;
                else if (this.streifen == 'R')
                    gesStreifen[nr + 1]['X' + edit + 'L'] += diff;
                gesStreifen[nr + 1]['breite'] =
                    Math.round(100 * (gesStreifen[nr + 1]['XVstR'] - gesStreifen[nr + 1]['XVstL']));
                gesStreifen[nr + 1]['bisBreite'] =
                    Math.round(100 * (gesStreifen[nr + 1]['XBstR'] - gesStreifen[nr + 1]['XBstL']));
                gesStreifen[nr + 1].createGeom();
                soap += gesStreifen[nr + 1].createUpdateBreiteXML();
            }
        } else {
            // Verschieben
            for (var nnr in gesStreifen) {
                if (nnr <= nr)
                    continue;
                gesStreifen[nnr]['X' + edit + 'L'] += diff;
                gesStreifen[nnr]['X' + edit + 'R'] += diff;
                gesStreifen[nnr].createGeom();
                soap += gesStreifen[nnr].createUpdateBreiteXML();
            }
        }
        this.createGeom();

        //console.log(soap);

        PublicWFS.doTransaction(soap);
    }
}


module.exports = Querschnitt;