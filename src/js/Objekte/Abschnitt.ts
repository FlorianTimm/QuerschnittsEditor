import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import PublicWFS from '../PublicWFS';
import AbschnittWFS from '../AbschnittWFS';
import Vektor from '../Vektor';
import Aufbaudaten from './Aufbaudaten';
import Daten from '../Daten';
import QuerStation from './QuerStation';
import Aufbau from './Aufbaudaten';

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

    private daten: Daten;
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
    private segmente: Segment[];

    constructor() {
        super();
        this.daten = Daten.getInstanz();
    }

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

    public getFaktor(): number {
        if (this._faktor == null) {
            this.calcSegmente();
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
        Daten.getInstanz().vectorAchse.addFeature(this);
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
            if (a.getParent == null) continue;
            let fid = a.getParent().replace('#', '');
            if (!(fid in aufbaudaten)) aufbaudaten[fid] = {};
            aufbaudaten[fid][a.getSchichtnr()] = a;
        }

        for (let stationNr in this._station) {
            for (let querschnitt in this._station[stationNr]) {
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
    public calcStationierung(point: number[]): StationObj {
        let posi: StationObj[] = [];

        let segmente = this.calcSegmente()

        for (let seg of segmente) {
            let obj: StationObj = new StationObj();
            obj.isEnthalten = true;

            // Position des Fusspunktes auf dem Segment relativ zwischen 0 und 1
            let faktor = (Vektor.skalar(Vektor.diff(point, seg.anfangsPkt), seg.vektor)) / (Vektor.skalar(seg.vektor, seg.vektor))

            // Abstand und Lot berechnen
            let fusspkt_genau = Vektor.sum(seg.anfangsPkt, Vektor.multi(seg.vektor, faktor))
            let lot = Vektor.diff(point, fusspkt_genau)
            obj.abstand = Math.round(Vektor.len(lot) * 10) / 10

            // Mindest-Stationen
            obj.station = Math.round((seg.vorherLaenge + faktor * seg.laenge) * this.getFaktor());
            let minStation_genau = (seg.vorherLaenge) * this.getFaktor();
            let maxStation_genau = (seg.vorherLaenge + seg.laenge) * this.getFaktor();

            if (obj.station < minStation_genau || obj.station > maxStation_genau)
                obj.isEnthalten = false;

            let minStation = Math.ceil(minStation_genau);
            let maxStation = Math.floor(maxStation_genau);

            if (obj.station < minStation) obj.station = minStation;
            if (obj.station > maxStation) obj.station = maxStation;

            faktor = (obj.station - minStation_genau) / (maxStation_genau - minStation_genau)

            obj.fusspkt = Vektor.sum(seg.anfangsPkt, Vektor.multi(seg.vektor, faktor))

            obj.seite = 'M'
            if (obj.abstand > 0.01) {
                let c3 = Vektor.kreuz(Vektor.add3(seg.vektor), Vektor.add3(lot))[2]
                if (c3 < 0) {
                    obj.seite = 'R'
                } else if (c3 > 0) {
                    obj.seite = 'L'
                }
            }

            obj.distanz = obj.abstand

            obj.neuerPkt = Vektor.sum(obj.fusspkt, Vektor.multi(Vektor.einheit([lot[0], lot[1]]), obj.abstand))

            posi.push(obj)
        }
        return posi.sort(Abschnitt.sortStationierungen)[0]
    }

    public getAbschnitt(vst: number, bst: number) {
        let segmente = this.calcSegmente();
        let r: Segment[] = []

        vst = vst * this.getFaktor();
        bst = bst * this.getFaktor();

        for (let seg of segmente) {
            if (seg.vorherLaenge >= vst && seg.vorherLaenge + seg.laenge <= bst) {
                console.log("mitte" + seg.vorherLaenge)
                r.push(seg);
            } else if (seg.vorherLaenge < vst && seg.vorherLaenge + seg.laenge > vst) {
                let faktor = (vst - seg.vorherLaenge) / seg.laenge
                let anfPkt = Vektor.sum(seg.anfangsPkt, Vektor.multi(seg.lot, faktor));
                let segmentNeu = new Segment(anfPkt, seg.endPkt, faktor * seg.laenge + seg.vorherLaenge);
                segmentNeu.anfangsVektor = seg.lot;
                segmentNeu.endVektor = seg.endVektor;
                console.log("anfang" + seg.vorherLaenge)
                r.push(segmentNeu)
            } else if (seg.vorherLaenge < bst && seg.vorherLaenge + seg.laenge > bst) {
                let faktor = (bst - seg.vorherLaenge) / seg.laenge
                let endPkt = Vektor.sum(seg.anfangsPkt, Vektor.multi(seg.lot, faktor));
                let segmentNeu = new Segment(seg.anfangsPkt, endPkt, seg.vorherLaenge);
                segmentNeu.anfangsVektor = seg.anfangsVektor;
                segmentNeu.endVektor = seg.lot;
                console.log("ende" + seg.vorherLaenge)
                r.push(segmentNeu)
            }
        }
        return r;
    }

    private static sortStationierungen(a: StationObj, b: StationObj): -1 | 0 | 1 {
        if (a.isEnthalten != b.isEnthalten) {
            if (a.isEnthalten) return -1;
            if (b.isEnthalten) return 1;
        }
        if (a.distanz != b.distanz) {
            return (a.distanz < b.distanz) ? -1 : 1;
        }
        if (a.station != b.station) {
            return (a.station < b.station) ? -1 : 1;
        }
        return 0;
    }

    private calcSegmente(): Segment[] {
        if (this.segmente) return this.segmente;

        this.segmente = [];
        let line = (this.getGeometry() as LineString).getCoordinates();
        let vorherLaenge = 0;

        for (var i = 0; i < line.length - 1; i++) {
            let seg = new Segment(line[i], line[i + 1], vorherLaenge);

            vorherLaenge += seg.laenge;

            if (i > 0) {
                let vorher = this.segmente[i - 1];
                seg.anfangsVektor = Vektor.einheit(Vektor.lot(Vektor.sum(Vektor.einheit(vorher.vektor), Vektor.einheit(seg.vektor))));
                this.segmente[i - 1].endVektor = seg.anfangsVektor;
            } else {
                seg.anfangsVektor = seg.lot;
            }
            this.segmente.push(seg)
        }
        this.segmente[this.segmente.length - 1].endVektor = this.segmente[this.segmente.length - 1].lot;

        this._faktor = this.len / vorherLaenge;

        return this.segmente;
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

    //Setter
    addOKinER(ok: string, value: boolean = true) {
        this.inER[ok] = value;
    }
}

export class StationObj {
    isEnthalten: boolean = false;
    distanz: number = 0;
    station: number = 0;
    seite: 'M' | 'R' | 'L' = 'M';
    abstand: number = 0;
    fusspkt: number[] = [];
    neuerPkt: number[] = [];
}

export class Segment {
    anfangsPkt: number[];
    endPkt: number[];
    vektor: number[];
    lot: number[]
    anfangsVektor?: number[] = [0, 0];
    endVektor?: number[] = [0, 0]
    laenge: number;
    vorherLaenge: number

    constructor(anfangsPkt: number[], endPkt: number[], vorherLaenge: number) {
        this.anfangsPkt = anfangsPkt;
        this.endPkt = endPkt;
        this.vektor = Vektor.diff(endPkt, anfangsPkt);
        this.lot = Vektor.einheit(Vektor.lot(this.vektor))
        this.laenge = Vektor.len(this.vektor);
        this.vorherLaenge = vorherLaenge;
    }
}