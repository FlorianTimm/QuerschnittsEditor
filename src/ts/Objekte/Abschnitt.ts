// SPDX-License-Identifier: GPL-3.0-or-later

import { Map } from 'ol';
import Feature, { FeatureLike } from 'ol/Feature';
import { Point } from 'ol/geom';
import LineString from 'ol/geom/LineString';
import VectorSource from 'ol/source/Vector';
import { Fill, Icon, Stroke, Style, Text } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import { AbschnittWFS } from '../AbschnittWFS';
import { ConfigLoader } from '../ConfigLoader';
import { Daten } from '../Daten';
import { VectorLayer } from '../openLayers/Layer';
import { PublicWFS } from '../PublicWFS';
import { Vektor } from '../Vektor';
import { QuerStation } from './QuerStation';

/**
 * Straßenabschnitt
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.04.03
 * @license GPL-3.0-or-later
*/
export class Abschnitt extends Feature<LineString> {
    private static abschnitte: { [absid: string]: Abschnitt } = {}
    private static waitForAbschnitt: { [absid: string]: Promise<Abschnitt> } = {}

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
    private punkte: LinienPunkt[];
    static layer: VectorLayer<VectorSource<Feature<LineString>>, Feature<LineString>>;

    private constructor() {
        super();
        Abschnitt.getLayer().getSource().addFeature(this);
    }

    public static getAll(): { [absid: number]: Abschnitt } {
        return this.abschnitte;
    }

    public static getAbschnitt(absId: string): Promise<Abschnitt> {
        if (absId in this.abschnitte) {
            return Promise.resolve(this.abschnitte[absId]);
        } else if (absId in Abschnitt.waitForAbschnitt) {
            return Abschnitt.waitForAbschnitt[absId];
        } else {
            Abschnitt.waitForAbschnitt[absId] = Abschnitt.load(absId)
            return Abschnitt.waitForAbschnitt[absId];
        }
    }

    public static getLayer(map?: Map): VectorLayer<VectorSource<Feature<LineString>>, Feature<LineString>> {
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

    private static async load(abschnittid: string): Promise<Abschnitt> {
        const config = await ConfigLoader.get().getConfig();
        if ("ABSCHNITT_WFS_URL" in config) {
            return Abschnitt.loadFromAbschnittWFS(abschnittid);
        } else {
            return Abschnitt.loadFromPublicWFS(abschnittid);
        }
    }

    private static async loadFromAbschnittWFS(abschnittid: string): Promise<Abschnitt> {
        let r = new Abschnitt();
        r.abschnittid = abschnittid;
        const xml = await AbschnittWFS.getById(abschnittid);
        return r.loadCallback(xml);
    }

    private static async loadFromPublicWFS(abschnittid: string): Promise<Abschnitt> {
        let r = new Abschnitt();
        r.abschnittid = abschnittid;

        const xml = await PublicWFS.doQuery('VI_STRASSENNETZ', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>ABSCHNITT_ID</PropertyName>' +
            '<Literal>' + r.abschnittid + '</Literal></PropertyIsEqualTo>' +
            '</Filter>');
        return r.loadCallback(xml);
    }

    private loadCallback(xml: Document): Abschnitt {
        let netz = xml.getElementsByTagName('VI_STRASSENNETZ');

        if (netz.length > 0) {
            this.fromXML(netz[0]);
        }
        return this;
    }

    static fromXML(xml: Element): Abschnitt {
        //console.log(xml);
        let abschnittid = xml.getElementsByTagName('ABSCHNITT_ID')[0].firstChild.textContent;
        let r: Abschnitt;
        if (abschnittid in this.abschnitte) {
            r = this.abschnitte[abschnittid];
        } else {
            r = new Abschnitt();
        }
        r.fromXML(xml);
        return r;
    }

    private fromXML(xml: Element): Abschnitt {
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
        Abschnitt.abschnitte[this.abschnittid] = this;

        return this;
    }

    public getFeature() {
        return this._feature;
    }

    public addStation(station: QuerStation): void {
        this._station[station.getVst()] = station;
    }

    public getAlleStationen(): { [vst: number]: QuerStation } {
        return this._station;
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

    /**
     * Berechnet die Stationierung eines Punktes auf diesem Abschnitt
     */
    public getStationierung(point: number[], anzNachKomma: number = 1): StationObj {
        let posi: StationObj[] = [];

        let punkte = this.calcPunkte()

        for (let i = 0; i < punkte.length - 1; i++) {
            let pkt = punkte[i]
            let obj: StationObj = new StationObj();

            // Position des Fusspunktes auf dem Segment relativ zwischen 0 und 1
            let faktor = (Vektor.skalar(Vektor.diff(point, pkt.getCoordinates()), pkt.vektorZumNaechsten)) / (Vektor.skalar(pkt.vektorZumNaechsten, pkt.vektorZumNaechsten))

            // Abstand und Lot berechnen
            let fusspkt_genau = Vektor.sum(pkt.getCoordinates(), Vektor.multi(pkt.vektorZumNaechsten, faktor))
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
            obj.fusspkt = Vektor.sum(pkt.getCoordinates(), Vektor.multi(pkt.vektorZumNaechsten, faktor))

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


    /**
 * Berechnet eine Station
 */
    public stationierePunkt(station: number, abstand: number): number[] {
        let punkte = this.calcPunkte();
        let r: LinienPunkt[] = []

        station = station / this.getFaktor();

        for (let i = 0; i < punkte.length; i++) {
            let pkt = punkte[i]
            if (pkt.vorherLaenge <= station && pkt.vorherLaenge + pkt.laengeZumNaechsten >= station) {
                let fusspkt = Vektor.sum(pkt.getCoordinates(), Vektor.multi(pkt.vektorZumNaechsten, (station - pkt.vorherLaenge) / pkt.laengeZumNaechsten))
                return Vektor.sum(fusspkt, Vektor.multi(Vektor.lot(pkt.vektorZumNaechsten), -abstand / pkt.laengeZumNaechsten))
            }
        }

        return null;
    }

    getWinkel(station: number): number {
        let punkte = this.calcPunkte()

        for (let i = 0; i < punkte.length - 1; i++) {
            let pkt = punkte[i]
            if (station > pkt.vorherLaenge && station < pkt.vorherLaenge + pkt.laengeZumNaechsten)
                return Vektor.richtung(pkt.vektorZumNaechsten)
        }
        return 0;
    }

    public getAbschnitt(vst: number, bst: number) {
        if (vst > bst || bst > this.getLen()) throw Error("VST größer BST oder BST größer als Abschnitt");

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
                let koord = Vektor.sum(pkt.getCoordinates(), Vektor.multi(pkt.vektorZumNaechsten, faktor));
                let pktNeu = new LinienPunkt(koord, Vektor.einheit(Vektor.lot(pkt.vektorZumNaechsten)), vst);
                r.push(pktNeu)
            }

            if (pkt.laengeZumNaechsten && pkt.vorherLaenge < bst && pkt.vorherLaenge + pkt.laengeZumNaechsten > bst) {
                let faktor = (bst - pkt.vorherLaenge) / pkt.laengeZumNaechsten
                let koord = Vektor.sum(pkt.getCoordinates(), Vektor.multi(pkt.vektorZumNaechsten, faktor));
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

    getLen(): number {
        return this.len;
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

export class LinienPunkt extends Point {
    seitlicherVektorAmPunkt: number[];
    vorherLaenge: number;
    vektorZumNaechsten: number[] | null = null;
    laengeZumNaechsten: number | null = null;
    seitenFaktor: number = 1.;

    constructor(pkt: number[], seitlicherVektorAmPunkt: number[], vorherLaenge: number, vektorZumNaechsten: number[] | null = null) {
        super(pkt);
        this.seitlicherVektorAmPunkt = seitlicherVektorAmPunkt;
        this.vorherLaenge = vorherLaenge;
        this.vektorZumNaechsten = vektorZumNaechsten;
        if (vektorZumNaechsten) this.laengeZumNaechsten = Vektor.len(vektorZumNaechsten);
    }
}