import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import PublicWFS from '../PublicWFS';
import AbschnittWFS from '../AbschnittWFS';
import Vektor from '../Vektor';
import Aufbaudaten from './Aufbaudaten';
import Daten from '../Daten';
import QuerStation from './QuerStation';
import { MultiLineString } from 'ol/geom';
import Aufbau from './Aufbaudaten';

var CONFIG: { [index: string]: string } = require('../config.json');

/**
 * Straßenabschnitt
 * @author Florian Timm, LGV HH 
 * @version 2019.09.19
 * @copyright MIT
 */
export default class Abschnitt extends Feature {
    private daten: Daten;
    public fid: string = null;
    public abschnittid: string = null;
    public vnk: string = null;
    public nnk: string = null;
    public vtknr: any;
    public vnklfd: number;
    public vzusatz: any;
    public ntknr: any;
    public nnklfd: number;
    public nzusatz: any;
    public len: number = null;
    public inER: {} = {};

    private _faktor: any = null;
    private _station: { [vst: number]: QuerStation } = {};

    private _feature: any;
    public aufbaudatenLoaded: boolean = false;

    constructor() {
        super();
        this.daten = Daten.getInstanz();
    }

    public getFaktor() {
        if (this._faktor == null)
            this._faktor = this.len / Vektor.line_len((this.getGeometry() as MultiLineString).getCoordinates());
        return this._faktor;
    }

    static load(abschnittid: string) {
        if ("ABSCHNITT_WFS_URL" in CONFIG) {
            return Abschnitt.loadFromAbschnittWFS(abschnittid);
        } else {
            return Abschnitt.loadFromPublicWFS(abschnittid);
        }
    }

    static loadFromAbschnittWFS(abschnittid: string) {
        let r = new Abschnitt();
        r.abschnittid = abschnittid;
        AbschnittWFS.getById(abschnittid, r.loadCallback.bind(r));
        return r;
    }

    static loadFromPublicWFS(abschnittid: string) {
        let r = new Abschnitt();
        r.abschnittid = abschnittid;

        PublicWFS.doQuery('VI_STRASSENNETZ', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>ABSCHNITT_ID</PropertyName>' +
            '<Literal>' + r.abschnittid + '</Literal></PropertyIsEqualTo>' +
            '</Filter>', r.loadCallback.bind(r));

        return r;
    }

    private loadCallback(xml: Document) {
        let netz = xml.getElementsByTagName('VI_STRASSENNETZ');

        if (netz.length > 0) {
            this.fromXML(netz[0]);
        }
    }

    static fromXML(xml: Element) {
        //console.log(xml);
        let r = new Abschnitt();
        r.fromXML(xml);
        return r;
    }

    private fromXML(xml: Element) {
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

    private readData(xmlhttp: XMLHttpRequest) {
        if (xmlhttp.responseXML == undefined) {
            PublicWFS.showMessage('Abschnitt nicht gefunden', true);
            return;
        }
    }

    public getFeature() {
        return this._feature;
    }

    public addStation(station: QuerStation): void {
        this._station[station.vst] = station;
    }

    public getStation(station: number): QuerStation {
        return this._station[station];
    }

    public existsStation(station: number): boolean {
        return station in this._station;
    }

    public getStationByStation(station: number): QuerStation {
        let r = null;
        for (var a in this._station) {
            if (parseInt(a) > station) break;
            r = this._station[a];
        }
        return r;
    }

    public getStationByVST(vst: number): QuerStation {
        for (let a in this._station) {
            if (this._station[a].vst == vst)
                return this._station[a];
        }
        return null;
    }

    public getStationByBST(bst: number): QuerStation {
        for (let a in this._station) {
            if (this._station[a].bst == bst)
                return this._station[a];
        }
        return null;
    }

    public getAufbauDaten(callbackSuccess: (...args: any[]) => void, callbackError?: (...args: any[]) => void, ...args: any[]) {
        //console.log(callbackSuccess);
        if (!this.aufbaudatenLoaded) {
            let xml = PublicWFS.doQuery('Otschicht', '<Filter><And>' +
                '<PropertyIsEqualTo>' +
                '<PropertyName>projekt/@xlink:href</PropertyName>' +
                '<Literal>' + this.daten.ereignisraum + '</Literal>' +
                '</PropertyIsEqualTo>' +
                '<PropertyIsEqualTo>' +
                '<PropertyName>abschnittOderAst/@xlink:href</PropertyName>' +
                '<Literal>S' + this.abschnittid + '</Literal>' +
                '</PropertyIsEqualTo>' +
                '</And></Filter>', this.parseAufbaudaten.bind(this), callbackError, callbackSuccess, ...args);
        }
    }

    private parseAufbaudaten(xml: Document, callbackSuccess?: (...args: any[]) => void, ...args: any[]) {
        let aufbau = xml.getElementsByTagName('Otschicht');
        let aufbaudaten: { [fid: string]: { [schichtnr: number]: Aufbau } } = {};

        for (let i = 0; i < aufbau.length; i++) {
            let a = Aufbaudaten.fromXML(aufbau[i]);
            if (a.parent == null) continue;
            let fid = a.parent.replace('#', '');
            if (!(fid in aufbaudaten) ) aufbaudaten[fid] = {};
            aufbaudaten[fid][a.schichtnr] = a;
        }

        for (let stationNr in this._station) {
            for (let querschnitt in this._station[stationNr]) {
                for (let streifen of this._station[stationNr].getAllQuerschnitte()) {
                    if (streifen.fid in aufbaudaten) {
                        streifen.setAufbauGesamt(aufbaudaten[streifen.fid])
                    } else {
                        streifen.addAufbau()
                    }
                }
            }
        }


        if (callbackSuccess != undefined) {
            callbackSuccess(...args);
        }
    }
}