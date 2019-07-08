import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import PublicWFS from '../PublicWFS';
import AbschnittWFS from '../AbschnittWFS';
import Vektor from '../Vektor';
import Aufbaudaten from './Aufbaudaten';
import Daten from '../Daten';
import QuerStation from './QuerStation';
import { MultiLineString } from 'ol/geom';
import Objekt from './Objekt';

var CONFIG: { [index: string]: string } = require('../config.json');

/**
 * Straßenabschnitt
 * @author Florian Timm, LGV HH 
 * @version 2019.06.06
 * @copyright MIT
 */
export default class Abschnitt extends Feature {
    daten: Daten;
    fid: string = null;
    abschnittid: string = null;
    vnk: string = null;
    nnk: string = null;
    len: number = null;
    _faktor: any = null;
    _station: {} = {};
    _aufstell: {} = {};
    inER: {} = {};
    _querschnitte: {} = {};

    vtknr: any;
    vnklfd: number;
    vzusatz: any;
    ntknr: any;
    nnklfd: number;
    nzusatz: any;
    _feature: any;
    _aufbaudaten: any;

    constructor(daten: Daten) {
        super();
        this.daten = daten;
    }

    getFaktor() {
        if (this._faktor == null)
            this._faktor = this.len / Vektor.line_len((this.getGeometry() as MultiLineString).getCoordinates());
        return this._faktor;
    }

    static load(daten: Daten, abschnittid: string) {
        if ("ABSCHNITT_WFS_URL" in CONFIG) {
            return Abschnitt.loadFromAbschnittWFS(daten, abschnittid);
        } else {
            return Abschnitt.loadFromPublicWFS(daten, abschnittid);
        }
    }

    static loadFromAbschnittWFS(daten: Daten, abschnittid: string) {
        let r = new Abschnitt(daten);
        r.abschnittid = abschnittid;
        AbschnittWFS.getById(abschnittid, r._loadCallback, undefined, r);
        return r;
    }

    static loadFromPublicWFS(daten: Daten, abschnittid: string) {
        let r = new Abschnitt(daten);
        r.abschnittid = abschnittid;

        PublicWFS.doQuery('VI_STRASSENNETZ', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>ABSCHNITT_ID</PropertyName>' +
            '<Literal>' + r.abschnittid + '</Literal></PropertyIsEqualTo>' +
            '</Filter>', r._loadCallback, undefined, r);

        return r;
    }

    _loadCallback(xml: Document, _this: Abschnitt) {
        let netz = xml.getElementsByTagName('VI_STRASSENNETZ');

        if (netz.length > 0) {
            _this._fromXML(netz[0]);
        }
    }

    static fromXML(daten: Daten, xml: Element) {
        //console.log(xml);
        let r = new Abschnitt(daten);
        r._fromXML(xml);
        return r;
    }

    _fromXML(xml: Element) {
        //console.log(xml)

        this.len = Number(xml.getElementsByTagName('LEN')[0].firstChild.textContent);
        this.abschnittid = xml.getElementsByTagName('ABSCHNITT_ID')[0].firstChild.textContent;
        this.fid = "S" + this.abschnittid;
        this.vnk = xml.getElementsByTagName('VNP')[0].firstChild.textContent;
        this.nnk = xml.getElementsByTagName('NNP')[0].firstChild.textContent;
        this.vtknr = this.vnk.substring(0, 4);
        this.vnklfd = Number(this.vnk.substring(4, 9));
        this.vzusatz = this.vnk.substring(9, 10);
        this.ntknr = this.nnk.substring(0, 4);
        this.nnklfd = Number(this.nnk.substring(4, 9));
        this.nzusatz = this.nnk.substring(9, 10);
        let koords = xml.getElementsByTagName('gml:coordinates')[0].firstChild.textContent.trim().split(' ');
        let ak = [];

        for (let i = 0; i < koords.length; i++) {
            let k = koords[i].split(',')
            let x = Number(k[0]);
            let y = Number(k[1]);
            ak.push([x, y]);
        }
        //console.log(ak);
        this.setGeometry(new LineString(ak));
    }

    _readData(xmlhttp: XMLHttpRequest) {
        if (xmlhttp.responseXML == undefined) {
            PublicWFS.showMessage('Abschnitt nicht gefunden', true);
            return;
        }
    }

    getFeature() {
        return this._feature;
    }

    addStation(station: QuerStation): void {
        this._station[station.vst] = station;
    }

    getStation(station: number): QuerStation {
        return this._station[station];
    }

    existsStation(station: number): boolean {
        return station in this._station;
    }

    getStationByStation(station: number): QuerStation {
        let r = null;
        for (var a in this._station) {
            if (parseInt(a) > station) break;
            r = this._station[a];
        }
        return r;
    }

    getStationByVST(vst: number): QuerStation {
        for (let a in this._station) {
            if (this._station[a].vst == vst)
                return this._station[a];
        }
        return null;
    }

    getStationByBST(bst: number): QuerStation {
        for (let a in this._station) {
            if (this._station[a].bst == bst)
                return this._station[a];
        }
        return null;
    }

    getAufbauDaten(callbackSuccess: (...args: any[]) => void, callbackError: (...args: any[]) => void, ...args: any[]) {
        console.log(callbackSuccess);
        if (this._aufbaudaten == null) {
            let xml = PublicWFS.doQuery('Otschicht', '<Filter><And>' +
                '<PropertyIsEqualTo>' +
                '<PropertyName>projekt/@xlink:href</PropertyName>' +
                '<Literal>' + this.daten.ereignisraum + '</Literal>' +
                '</PropertyIsEqualTo>' +
                '<PropertyIsEqualTo>' +
                '<PropertyName>abschnittOderAst/@xlink:href</PropertyName>' +
                '<Literal>S' + this.abschnittid + '</Literal>' +
                '</PropertyIsEqualTo>' +
                '</And></Filter>', this._parseAufbaudaten, callbackError, this, callbackSuccess, ...args);
        }
    }
    _parseAufbaudaten(xml: Document, _this: Abschnitt, callbackSuccess: (...args: any[]) => void, ...args: any[]) {
        let aufbau = xml.getElementsByTagName('Otschicht');
        for (let i = 0; i < aufbau.length; i++) {
            let a = Aufbaudaten.fromXML(aufbau[i]);
            let quer = _this.daten.querschnitteFID[a.parent.replace('#', '')];
            if (quer._aufbaudaten == null) {
                quer._aufbaudaten = {};
            }

            quer._aufbaudaten[a.schichtnr] = a;
        }
        if (callbackSuccess != undefined) {
            callbackSuccess(...args);
        }
    }

    writeQuerAufbau() {
        let xml = '<wfs:Delete typeName="Dotquer">\n' +
            '	<ogc:Filter>\n' +
            '		<ogc:And>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>abschnittId</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.abschnittid + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.daten.ereignisraum + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '		</ogc:And>\n' +
            '	</ogc:Filter>\n' +
            '</wfs:Delete>';

        for (let station_key in this._station) {
            let station = this._station[station_key];
            for (let streifen_key in station._querschnitte) {
                let streifen = station._querschnitte[streifen_key];
                console.log(streifen);
                for (let querschnitt_key in streifen) {
                    xml += streifen[querschnitt_key].createInsertXML();
                }
            }
        }
        //PublicWFS.doTransaction(xml, callback())

        console.log(xml);
    }
}