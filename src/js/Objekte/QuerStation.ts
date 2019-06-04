import Vektor from '../Vektor';
import Feature from 'ol/Feature';
import MultiLineString from 'ol/geom/MultiLineString';
import PublicWFS from '../PublicWFS';
import Daten from '../Daten';
import Abschnitt from './Abschnitt';
import Querschnitt from './Querschnittsdaten';


export class Station {
    daten: Daten;
    abschnitt: Abschnitt;
    vst: number;
    bst: number;
    geo: number[];
    seg: number[] = [];
    vector: number[][] = [];
    linie: MultiLineString = null;
    private _querschnitte: {} = {};

    constructor(daten: Daten, abschnitt: Abschnitt, vst: number, bst: number, geo: number[]) {
        this.daten = daten;
        this.abschnitt = abschnitt;
        this.vst = vst;
        this.bst = bst;
        this.geo = geo;
        this.abschnitt.addStation(this);
        this.calcVector();
    }
    addQuerschnitt(querschnitt: Querschnitt) {
        let streifen = querschnitt.streifen;
        let nr = querschnitt.streifennr;
        if (!(streifen in this._querschnitte)) {
            this._querschnitte[streifen] = {};
        }
        this._querschnitte[streifen][nr] = querschnitt;
    }
    getQuerschnitt(streifen: string, streifennr: number) {
        if (!(streifen in this._querschnitte))
            return null;
        if (!(streifennr in this._querschnitte[streifen]))
            return null;
        return this._querschnitte[streifen][streifennr];
    }
    getAllQuerschnitte() {
        let r = [];
        for (let streifen in this._querschnitte) {
            for (let querschnitt in this._querschnitte[streifen]) {
                r.push(querschnitt);
            }
        }
        return r;
    }
    getStreifen(streifen: string) {
        if (!(streifen in this._querschnitte))
            return null;
        return this._querschnitte[streifen];
    }

    getQuerschnittByBstAbstand(XBstL: number, XBstR: number) {
        for (let streifen in this._querschnitte) {
            for (let querschnitt in this._querschnitte[streifen]) {
                if (XBstL < 0 && this._querschnitte[streifen][querschnitt].XBstL == XBstL) return this._querschnitte[streifen][querschnitt];
                if (XBstR > 0 && this._querschnitte[streifen][querschnitt].XBstR == XBstR) return this._querschnitte[streifen][querschnitt];
            }
        }
        return null;
    }

    getQuerschnittByVstAbstand(XVstL: number, XVstR: number) {
        for (let streifen in this._querschnitte) {
            for (let querschnitt in this._querschnitte[streifen]) {
                if (XVstL < 0 && this._querschnitte[streifen][querschnitt].XVstL == XVstL) return this._querschnitte[streifen][querschnitt];
                if (XVstR > 0 && this._querschnitte[streifen][querschnitt].XVstR == XVstR) return this._querschnitte[streifen][querschnitt];
            }
        }
        return null;
    }

    calcVector() {
        let anzahl = this.geo.length;
        if (anzahl >= 2) {
            let first = Vektor.einheit(Vektor.lot(Vektor.diff(this.geo[0], this.geo[1])));
            this.vector.push(first);
            for (let i = 1; i < anzahl - 1; i++) {
                //this.vector.push(Vektor.azi2vec((Vektor.azi(this.geo[i-1], this.geo[i]) + Vektor.azi(this.geo[i], this.geo[i+1])  - Math.PI) / 2.) )
                this.vector.push(Vektor.einheit(Vektor.lot(Vektor.sum(Vektor.einheit(Vektor.diff(this.geo[i - 1], this.geo[i])), Vektor.einheit(Vektor.diff(this.geo[i], this.geo[i + 1]))))));
            }
            //this.vector.push(Vektor.azi2vec(Vektor.azi(this.geo[anzahl-2], this.geo[anzahl-1]) - 0.5 * Math.PI ) )
            let lot = Vektor.lot(Vektor.diff(this.geo[anzahl - 2], this.geo[anzahl - 1]))
            let last = Vektor.einheit(lot);
            this.vector.push(last);
            let statTrenn = [];
            statTrenn.push([Vektor.sum(this.geo[anzahl - 1], Vektor.multi(last, 30)), Vektor.sum(this.geo[anzahl - 1], Vektor.multi(last, -30))]);
            if (this.vst == 0) {
                statTrenn.push([Vektor.sum(this.geo[0], Vektor.multi(first, 30)), Vektor.sum(this.geo[0], Vektor.multi(first, -30))]);
            }
            this.linie = new MultiLineString(statTrenn);
            let feat = new Feature({
                geometry: this.linie,
                objekt: this,
            });
            this.daten.v_station.addFeature(feat);
        }
        var len = Vektor.line_len(this.geo);
        this.seg.push(0);
        var seg_len_add = 0;
        for (var i = 1; i < anzahl; i++) {
            seg_len_add += Vektor.len(Vektor.diff(this.geo[i - 1], this.geo[i]));
            this.seg.push(seg_len_add / len);
            //console.log(seg_len_add/len)
        }
    }
    teilen(station: number) {
        PublicWFS.showMessage("noch nicht möglich", true);
        this.abschnitt.getAufbauDaten(Station.teilen_callback, undefined, this, station);
    }

    static teilen_callback(_this, station) {

        _this.abschnitt.writeQuerAufbau();
    }
}

export default Station;