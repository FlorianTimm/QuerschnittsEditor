var CONFIG_WFS: { [index: string]: { [index: string]: { kt?: string, art: number } } } = require('../config_wfs.json');
import PublicWFS from '../PublicWFS';
import { Polygon, MultiLineString } from 'ol/geom';
import { Feature } from 'ol';
import QuerStation from './QuerStation';
import Vektor from '../Vektor';
import Daten from '../Daten';
import Aufbau from '../Objekte/Aufbaudaten';
import Abschnitt from '../Objekte/Abschnitt';
import Objekt from './Objekt';

class Querschnitt implements Objekt {
    private _daten: Daten;
    private _aufbaudaten: { [schicht: number]: Aufbau } = null;

    flaeche: Feature;
    trenn: Feature;

    // SIB-Attribute
    abschnittOderAst: string = null;
    station: QuerStation = null;
    vst: number = null;
    bst: number = null;
    fid: string = null;
    abschnittId: string = null;
    art: string = null;
    artober: string = null;
    breite: number = null;
    bisBreite: number = null;
    blpart: any = null;
    blpartnull: any = null;
    uipart: any = null;
    uipartnull: any = null;
    XVstL: number = null;
    XVstR: number = null;
    XBstL: number = null;
    XBstR: number = null;
    kherk: string = null;
    baujahrGew: any = null;
    abnahmeGew: any = null;
    dauerGew: any = null;
    ablaufGew: any = null;
    objektId: any = null;
    objektnr: any = null;
    erfart: string = null;
    quelle: string = null;
    ADatum: string = null;
    bemerkung: string = null;
    bearbeiter: string = null;
    behoerde: any = null;
    streifen: string = null;
    projekt: string = null;
    streifennr: number = null;

    constructor() {
        this._daten = Daten.getInstanz();
        //console.log(daten);

        this.flaeche = new Feature({ geom: new Polygon([[[0, 0], [0, 0], [0, 0]]]), objekt: this });
        this._daten.v_quer.addFeature(this.flaeche)

        this.trenn = new Feature({ geom: new MultiLineString([[0, 0], [0, 0], [0, 0]]), objekt: this });
        this._daten.v_trenn.addFeature(this.trenn);
    }

    static loadER(daten: Daten, callback?: (xml: Document, ...args: any[]) => void, ...args: any[]) {
        document.body.style.cursor = 'wait'
        PublicWFS.doQuery('Dotquer', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></Filter>', Querschnitt._loadER_Callback, undefined, daten, callback, ...args);
    }

    static loadAbschnittER(daten: Daten, abschnitt: Abschnitt, callback: (...args: any[]) => void, ...args: any[]) {
        document.body.style.cursor = 'wait'
        PublicWFS.doQuery('Dotquer', '<Filter>' +
            '<And><PropertyIsEqualTo><PropertyName>abschnittId</PropertyName>' +
            '<Literal>' + abschnitt.abschnittid + '</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></And></Filter>', Querschnitt._loadER_Callback, undefined, daten, callback, ...args);
    }

    static _loadER_Callback(xml: Document, daten: Daten, callback: (...args: any[]) => void, ...args: any[]) {
        let dotquer = xml.getElementsByTagName("Dotquer");
        let liste: Querschnitt[] = [];
        for (let i = 0; i < dotquer.length; i++) {
            //console.log(quer);
            liste.push(Querschnitt.fromXML(dotquer[i]));
        }

        Querschnitt.checkQuerschnitte(liste);

        if (callback != undefined) {
            callback(...args);
        }
        document.body.style.cursor = ''
    }

    static checkQuerschnitte(liste: Querschnitt[]) {
        liste.forEach(function (querschnitt: Querschnitt) {
            querschnitt.check()
        })

    }

    check() {
        //if (this.XVstL != null && this.XVstR != null && this.XBstL != null && this.XBstR != null) return;
        //console.log(this);
        let m = this.station.getStreifen("M")
        let seite = this.station.getStreifen(this.streifen);

        if (this.streifen == "M") {
            this.XVstL = 0.005 * this.breite;
            this.XVstR = 0.005 * this.breite;
            this.XBstL = 0.005 * this.bisBreite;
            this.XBstR = 0.005 * this.bisBreite;
            this.createGeom();
            return;
        }

        let abstandVST = 0;
        let abstandBST = 0;
        for (let nr in m) {
            abstandVST += 0.005 * m[nr].breite;
            abstandBST += 0.005 * m[nr].bisBreite;
        }
        for (let nr in seite) {
            if (Number(nr) < this.streifennr) {
                abstandVST += 0.01 * seite[nr].breite;
                abstandBST += 0.01 * seite[nr].bisBreite;
            }
        }

        if (this.streifen == "L") {
            this.XVstL = -abstandVST - this.breite * 0.01;
            this.XVstR = -abstandVST;
            this.XBstL = -abstandBST - this.bisBreite * 0.01;
            this.XBstR = -abstandBST;
        } else {
            this.XVstL = abstandVST;
            this.XVstR = abstandVST + this.breite * 0.01;
            this.XBstL = abstandBST;
            this.XBstR = abstandBST + this.bisBreite * 0.01;
        }
        this.createGeom();
        return;

    }

    static fromXML(xml: Element) {
        let daten = Daten.getInstanz();
        let r = new Querschnitt();

        r.fid = xml.getAttribute('fid');
        daten.querschnitteFID[r.fid] = r;

        for (let tag in CONFIG_WFS.QUERSCHNITT) {
            //console.log(tag);
            if (xml.getElementsByTagName(tag).length <= 0) continue;
            if (CONFIG_WFS.QUERSCHNITT[tag].art == 0) {
                // Kein Klartext
                r[tag] = xml.getElementsByTagName(tag)[0].firstChild.textContent;
            } else if (CONFIG_WFS.QUERSCHNITT[tag].art == 1) {
                // Kein Klartext
                r[tag] = Number(xml.getElementsByTagName(tag)[0].firstChild.textContent);
            } else if (CONFIG_WFS.QUERSCHNITT[tag].art == 2) {
                // Klartext, xlink wird gespeichert
                r[tag] = xml.getElementsByTagName(tag)[0].getAttribute('xlink:href');
            }
        }
        //console.log(r)

        let abschnitt: Abschnitt = r._daten.getAbschnitt(r.abschnittId);
        abschnitt.inER['Querschnitt'] = true;

        //console.log(abschnitt);
        if (!(abschnitt.existsStation(r.vst))) {
            let koords = xml.getElementsByTagName('gml:coordinates')[0].firstChild.textContent.split(' ');
            let geo = [];
            for (let i = 0; i < koords.length; i++) {
                let k = koords[i].split(',')
                let x = Number(k[0]);
                let y = Number(k[1]);
                geo.push([x, y]);
            }
            r.station = new QuerStation(r._daten, abschnitt, r.vst, r.bst, geo);
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
                '    <ogc:Literal>' + this._daten.ereignisraum + '</ogc:Literal>\n' +
                '  </ogc:PropertyIsEqualTo>\n' +
                '  <ogc:PropertyIsEqualTo>\n' +
                '    <ogc:Property>parent/@xlink:href</ogc:Property>\n' +
                '    <ogc:Literal>' + this.fid + '</ogc:Literal>\n' +
                '  </ogc:PropertyIsEqualTo>\n' +
                '</ogc:And></ogc:Filter>', this._parseAufbaudaten, undefined, this);
        }
    }

    _parseAufbaudaten(xml: Document, _this: Querschnitt) {
        let aufbaudaten = {};
        let aufbau = xml.getElementsByTagName('Otschicht');

        for (let i = 0; i < aufbau.length; i++) {
            let a = Aufbau.fromXML(aufbau[i]);

            _this._aufbaudaten[a.schichtnr] = a;
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
            if (isNaN(coord[0]) || isNaN(coord[1])) {
                console.log("Fehler: keine Koordinaten");
                continue;
            }
            g.push(coord);
            l.push(coord);
        }

        for (let j = anzahl - 1; j >= 0; j--) {
            let coord = Vektor.sum(this.station.geo[j], Vektor.multi(this.station.vector[j], this.station.seg[j] * diff1 + abst1));
            if (isNaN(coord[0]) || isNaN(coord[1])) {
                console.log("Fehler: keine Koordinaten");
                continue;
            }
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

        r += '</Dotquer>\n';

        if (this._aufbaudaten != null) {

            for (let s in this._aufbaudaten) {
                //console.log(this._aufbaudaten[s]);
                r += this._aufbaudaten[s].createXML();
            }
        }
        r += '</wfs:Insert>\n';
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


    createUpdateArtEinzelnXML() {
        return '<wfs:Update typeName="Dotquer">\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>art/@xlink:href</wfs:Name>\n' +
            '		<wfs:Value>' + this.art + '</wfs:Value>\n' +
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

    createUpdateOberEinzelnXML() {
        return '<wfs:Update typeName="Dotquer">\n' +
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

    updateArt(art: string, artober: string) {
        this.art = art;
        this.artober = artober;
        this._daten.v_quer.changed();

        PublicWFS.doTransaction(this.createUpdateArtXML(), undefined, undefined);
    }

    updateArtEinzeln(art: string) {
        this.art = art;
        this._daten.v_quer.changed();

        PublicWFS.doTransaction(this.createUpdateArtEinzelnXML(), undefined, undefined);
    }

    updateOberEinzeln(artober: string) {
        this.artober = artober;
        this._daten.v_quer.changed();

        PublicWFS.doTransaction(this.createUpdateOberEinzelnXML(), undefined, undefined);
    }


    editBreite(edit: string, diff: number, fit: boolean) {
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
                if (Number(nnr) <= nr)
                    continue;
                gesStreifen[nnr]['X' + edit + 'L'] += diff;
                gesStreifen[nnr]['X' + edit + 'R'] += diff;
                gesStreifen[nnr].createGeom();
                soap += gesStreifen[nnr].createUpdateBreiteXML();
            }
        }
        this.createGeom();

        //console.log(soap);

        PublicWFS.doTransaction(soap, undefined, undefined);
    }

    delete() {
        this._daten.v_quer.removeFeature(this.flaeche)
        this._daten.v_trenn.removeFeature(this.trenn)
    }
}

export default Querschnitt;