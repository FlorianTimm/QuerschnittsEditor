import Feature, { FeatureLike } from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import PublicWFS from '../PublicWFS';
import AbschnittWFS from '../AbschnittWFS';
import Vektor from '../Vektor';
import Aufbaudaten from './Aufbaudaten';
import Daten from '../Daten';
import QuerStation from './QuerStation';
import Aufbau from './Aufbaudaten';
import { VectorLayer } from '../openLayers/Layer';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, Fill, Icon, Text } from 'ol/style';
import { Point } from 'ol/geom';
import CircleStyle from 'ol/style/Circle';
import { Map } from 'ol';

var CONFIG: { [index: string]: string } = require('../config.json');

interface Callback {
    callback: (abschnitt: Abschnitt, ...args: any[]) => void;
    args: any[];
}

/**
 * Straßenabschnitt
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */
export default class Abschnitt extends Feature {
    private static abschnitte: { [absid: number]: Abschnitt } = {}
    private static waitForAbschnitt: { [absid: number]: Callback[] } = {}

    private fid: string = null;
    private abschnittid: string = null;
    private vnk: string = null;
    private nnk: string = null;
    private vtknr: any;
    private vnklfd: number;
    private vzusatz: any;
    private ntknr: any;
    private nnklfd: number;
    private nzusatz: any;
    private len: number = null;
    private inER: { [ok: string]: boolean } = {};

    private _faktor: any = null;
    private _station: { [vst: number]: QuerStation } = {};

    private _feature: any;
    public aufbaudatenLoaded: boolean = false;
    private punkte: LinienPunkt[];
    static layer: VectorLayer;

    public static getAbschnitt(absId: string, callback: (abs: Abschnitt, ...args: any[]) => void, ...args: any[]) {
        if (absId in this.abschnitte) {
            callback(this.abschnitte[absId], ...args);
            return;
        } else {
            let laedtSchon = true;
            if (!(absId in Abschnitt.waitForAbschnitt)) {
                Abschnitt.waitForAbschnitt[absId] = [];
                laedtSchon = false;
            }
            Abschnitt.waitForAbschnitt[absId].push({ callback, args })

            if (!laedtSchon)
                Abschnitt.load(absId);
        }

    }

    public static getLayer(map?: Map): VectorLayer {
        if (!Abschnitt.layer) {
            let achsen_style = function (feature: FeatureLike, resolution: number): Style[] {
                let abschnitt = feature as Abschnitt;
                let styles = [];
                // Linienfarbe - rot, wenn in ER
                let color = '#222';
                if (abschnitt.isOKinER(Daten.getInstanz().modus)) color = '#d00';

                // Linie + Beschriftung
                styles.push(new Style({
                    stroke: new Stroke({
                        color: color,
                        width: 3
                    }),
                    // Beschriftung
                    text: new Text({
                        font: '12px Calibri,sans-serif',
                        fill: new Fill({ color: color }),
                        stroke: new Stroke({
                            color: '#fff', width: 2
                        }),
                        text: abschnitt.getVnk() + ' - ' + abschnitt.getNnk(),
                        placement: 'line',
                        offsetY: -7
                    })
                }));

                // Pfeile/Start/Endknoten ab bestimmten Maßstab
                if (resolution < 0.15) {
                    // Pfeile
                    var geometry = abschnitt.getGeometry() as LineString;
                    let first = true;
                    geometry.forEachSegment(function (start, end) {
                        if (first) {
                            first = false;
                        } else {
                            let point = new Point(start);
                            var dx = end[0] - start[0];
                            var dy = end[1] - start[1];
                            var rotation = Math.atan2(dy, dx);
                            // arrows
                            styles.push(new Style({
                                geometry: point,
                                image: new Icon({
                                    src: './img/arrow_klein.png',
                                    anchor: [0.75, 0.5],
                                    rotateWithView: false,
                                    rotation: -rotation
                                })
                            }));
                        }
                    });

                    // Startpunkt
                    styles.push(new Style({
                        geometry: new Point(geometry.getFirstCoordinate()),
                        image: new CircleStyle({
                            radius: 6,
                            fill: new Fill({ color: 'green' }),
                            stroke: new Stroke({
                                color: [255, 255, 255],
                                width: 1
                            })
                        })
                    }));

                    // Endpunkt
                    styles.push(new Style({
                        geometry: new Point(geometry.getLastCoordinate()),
                        image: new CircleStyle({
                            radius: 6,
                            fill: new Fill({ color: 'red' }),
                            stroke: new Stroke({
                                color: [255, 255, 255],
                                width: 1
                            })
                        })
                    }));
                }
                return styles;
            };
            Abschnitt.layer = new VectorLayer({
                source: new VectorSource(),
                opacity: 0.6,
                style: achsen_style
            });
        }
        if (map) map.addLayer(Abschnitt.layer);
        return Abschnitt.layer;
    }


    public getFaktor(): number {
        if (this._faktor == null) {
            this.calcPunkte();
        }
        return this._faktor;
    }

    private static load(abschnittid: string) {
        if ("ABSCHNITT_WFS_URL" in CONFIG) {
            Abschnitt.loadFromAbschnittWFS(abschnittid);
        } else {
            Abschnitt.loadFromPublicWFS(abschnittid);
        }
    }

    private static loadFromAbschnittWFS(abschnittid: string) {
        let r = new Abschnitt();
        r.abschnittid = abschnittid;
        AbschnittWFS.getById(abschnittid, r.loadCallback.bind(r));
        return r;
    }

    private static loadFromPublicWFS(abschnittid: string) {
        let r = new Abschnitt();
        r.abschnittid = abschnittid;

        PublicWFS.doQuery('VI_STRASSENNETZ', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>ABSCHNITT_ID</PropertyName>' +
            '<Literal>' + r.abschnittid + '</Literal></PropertyIsEqualTo>' +
            '</Filter>', r.loadCallback.bind(r));
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
        Abschnitt.getLayer().getSource().addFeature(this);
        Abschnitt.abschnitte[this.abschnittid] = this;

        if (this.abschnittid in Abschnitt.waitForAbschnitt) {
            let callback: Callback;
            while (callback = Abschnitt.waitForAbschnitt[this.abschnittid].pop()) {
                callback.callback(this, ...callback.args);
            }
        }

    }

    public getFeature() {
        return this._feature;
    }

    public addStation(station: QuerStation): void {
        this._station[station.getVst()] = station;
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
            if (this._station[a].getVst() == vst)
                return this._station[a];
        }
        return null;
    }

    public getStationByBST(bst: number): QuerStation {
        for (let a in this._station) {
            if (this._station[a].getBst() == bst)
                return this._station[a];
        }
        return null;
    }

    public getAufbauDaten(callbackSuccess?: (...args: any[]) => void, callbackError?: (...args: any[]) => void, reload: boolean = false, ...args: any[]) {
        //console.log(callbackSuccess);

        if (!this.aufbaudatenLoaded || reload) {
            PublicWFS.doQuery('Otschicht', '<Filter><And>' +
                '<PropertyIsEqualTo>' +
                '<PropertyName>projekt/@xlink:href</PropertyName>' +
                '<Literal>' + Daten.getInstanz().ereignisraum + '</Literal>' +
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
            if (a.getParent == null) continue;
            let fid = a.getParent().getXlink();
            if (!(fid in aufbaudaten)) aufbaudaten[fid] = {};
            aufbaudaten[fid][a.getSchichtnr()] = a;
        }

        for (let stationNr in this._station) {
            for (let __ in this._station[stationNr]) {
                for (let streifen of this._station[stationNr].getAllQuerschnitte()) {
                    if (streifen.getFid() in aufbaudaten) {
                        streifen.setAufbauGesamt(aufbaudaten[streifen.getFid()])
                    } else {
                        streifen.setAufbauGesamt({});
                    }
                }
            }
        }


        if (callbackSuccess != undefined) {
            callbackSuccess(...args);
        }
    }

    /**
     * Berechnet eine Station
     */
    public getStationierung(point: number[], anzNachKomma: number = 1): StationObj {
        let posi: StationObj[] = [];

        let punkte = this.calcPunkte()

        for (let i = 0; i < punkte.length - 1; i++) {
            let pkt = punkte[i]
            let obj: StationObj = new StationObj();

            // Position des Fusspunktes auf dem Segment relativ zwischen 0 und 1
            let faktor = (Vektor.skalar(Vektor.diff(point, pkt.pkt), pkt.vektorZumNaechsten)) / (Vektor.skalar(pkt.vektorZumNaechsten, pkt.vektorZumNaechsten))

            // Abstand und Lot berechnen
            let fusspkt_genau = Vektor.sum(pkt.pkt, Vektor.multi(pkt.vektorZumNaechsten, faktor))
            let lot = Vektor.diff(point, fusspkt_genau)
            obj.abstand = Math.round(Vektor.len(lot) * Math.pow(10, anzNachKomma)) / Math.pow(10, anzNachKomma)

            // Mindest-Stationen
            let minStation_genau = (pkt.vorherLaenge) * this.getFaktor();
            let maxStation_genau = (pkt.vorherLaenge + pkt.laengeZumNaechsten) * this.getFaktor();
            let minStation = Math.ceil(minStation_genau);
            let maxStation = Math.floor(maxStation_genau);

            // Station berechnen und gegen Min/Max-Station prüfen
            obj.station = Math.round((pkt.vorherLaenge + faktor * pkt.laengeZumNaechsten) * this.getFaktor());
            if (obj.station < minStation) obj.station = minStation;
            if (obj.station > maxStation) obj.station = maxStation;

            // Position des Fußpunktes der gerundeten Station bestimmen
            faktor = (obj.station - minStation_genau) / (maxStation_genau - minStation_genau)
            obj.fusspkt = Vektor.sum(pkt.pkt, Vektor.multi(pkt.vektorZumNaechsten, faktor))

            obj.seite = 'M'
            if (obj.abstand > 0.01) {
                let c3 = Vektor.kreuz(Vektor.add3(pkt.vektorZumNaechsten), Vektor.add3(lot))[2]
                if (c3 < 0) {
                    obj.seite = 'R'
                } else if (c3 > 0) {
                    obj.seite = 'L'
                }
            }

            obj.neuerPkt = Vektor.sum(obj.fusspkt, Vektor.multi(Vektor.einheit([lot[0], lot[1]]), obj.abstand))
            obj.distanz = Vektor.len(Vektor.diff(obj.neuerPkt, point))

            posi.push(obj)
        }
        return posi.sort(Abschnitt.sortStationierungen)[0]
    }

    getWinkel(station: number): number {
        let punkte = this.calcPunkte()

        for (let i = 0; i < punkte.length - 1; i++) {
            let pkt = punkte[i]
            if (station > pkt.vorherLaenge && station < pkt.vorherLaenge + pkt.laengeZumNaechsten)
                return Vektor.winkel(pkt.vektorZumNaechsten)
        }
        return 0;
    }

    public getAbschnitt(vst: number, bst: number) {
        let punkte = this.calcPunkte();
        let r: LinienPunkt[] = []

        vst = vst / this.getFaktor();
        bst = bst / this.getFaktor();

        for (let i = 0; i < punkte.length; i++) {
            let pkt = punkte[i]
            if (pkt.vorherLaenge >= vst && pkt.vorherLaenge <= bst) {
                r.push(pkt);
            } else if (pkt.laengeZumNaechsten && pkt.vorherLaenge < vst && pkt.vorherLaenge + pkt.laengeZumNaechsten > vst) {
                let faktor = (vst - pkt.vorherLaenge) / pkt.laengeZumNaechsten
                let koord = Vektor.sum(pkt.pkt, Vektor.multi(pkt.vektorZumNaechsten, faktor));
                let pktNeu = new LinienPunkt(koord, Vektor.einheit(Vektor.lot(pkt.vektorZumNaechsten)), vst);
                r.push(pktNeu)
            }

            if (pkt.laengeZumNaechsten && pkt.vorherLaenge < bst && pkt.vorherLaenge + pkt.laengeZumNaechsten > bst) {
                let faktor = (bst - pkt.vorherLaenge) / pkt.laengeZumNaechsten
                let koord = Vektor.sum(pkt.pkt, Vektor.multi(pkt.vektorZumNaechsten, faktor));
                let pktNeu = new LinienPunkt(koord, Vektor.einheit(Vektor.lot(pkt.vektorZumNaechsten)), bst);
                r.push(pktNeu)
            }
        }
        return r;
    }

    private static sortStationierungen(a: StationObj, b: StationObj): -1 | 0 | 1 {
        if (Math.abs(a.distanz - b.distanz) > 1) {
            return (a.distanz < b.distanz) ? -1 : 1;
        }
        if (a.abstand != b.abstand) {
            return (a.abstand < b.abstand) ? -1 : 1;
        }
        return 0;
    }

    private calcPunkte(): LinienPunkt[] {
        if (this.punkte) return this.punkte;

        this.punkte = [];
        let line = (this.getGeometry() as LineString).getCoordinates();
        let vorherLaenge = 0;

        for (var i = 0; i < line.length - 1; i++) {
            let pkt = new LinienPunkt(line[i], null, vorherLaenge, Vektor.diff(line[i + 1], line[i]));

            vorherLaenge += pkt.laengeZumNaechsten;

            if (i == 0)
                pkt.seitlicherVektorAmPunkt = Vektor.einheit(Vektor.lot(pkt.vektorZumNaechsten));
            else {

                let vorher = this.punkte[i - 1];
                pkt.seitlicherVektorAmPunkt = Vektor.einheit(Vektor.lot(Vektor.sum(Vektor.einheit(vorher.vektorZumNaechsten), Vektor.einheit(pkt.vektorZumNaechsten))));
            }
            this.punkte.push(pkt)
        }

        // letzten Punkt hinzufügen
        this.punkte.push(new LinienPunkt(line[line.length - 1], Vektor.einheit(Vektor.lot(this.punkte[this.punkte.length - 1].vektorZumNaechsten)), vorherLaenge))

        // Längenfaktor berechnen
        this._faktor = this.len / vorherLaenge;

        return this.punkte;
    }


    // Getter
    public getAbschnittid(): string {
        return this.abschnittid;
    }

    isOKinER(ok: string): boolean {
        return ok in this.inER && this.inER[ok];
    }

    getVnk() {
        return this.vnk;
    }

    getNnk() {
        return this.nnk;
    }

    getVtknr() {
        return this.vtknr;
    }

    getNtknr() {
        return this.ntknr;
    }

    getVzusatz() {
        return this.vzusatz;
    }

    getNzusatz() {
        return this.nzusatz;
    }
    getVnklfd() {
        return this.vnklfd;
    }
    getNnklfd() {
        return this.nnklfd;
    }
    getFid() {
        return this.fid;
    }

    //Setter
    addOKinER(ok: string, value: boolean = true) {
        this.inER[ok] = value;
    }
}

export class StationObj {
    distanz: number = 0;
    station: number = 0;
    seite: 'M' | 'R' | 'L' = 'M';
    abstand: number = 0;
    fusspkt: number[] = [];
    neuerPkt: number[] = [];
}

export class LinienPunkt {
    pkt: number[];
    seitlicherVektorAmPunkt: number[];
    vorherLaenge: number;
    vektorZumNaechsten: number[] | null = null;
    laengeZumNaechsten: number | null = null;

    constructor(pkt: number[], seitlicherVektorAmPunkt: number[], vorherLaenge: number, vektorZumNaechsten: number[] | null = null) {
        this.pkt = pkt;
        this.seitlicherVektorAmPunkt = seitlicherVektorAmPunkt;
        this.vorherLaenge = vorherLaenge;
        this.vektorZumNaechsten = vektorZumNaechsten;
        if (vektorZumNaechsten) this.laengeZumNaechsten = Vektor.len(vektorZumNaechsten);
    }
}