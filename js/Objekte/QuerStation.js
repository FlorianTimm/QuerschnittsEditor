import Vektor from '../Vektor.js';
import Feature from 'ol/Feature.js';
import MultiLineString from 'ol/geom/MultiLineString.js';
import PublicWFS from '../PublicWFS.js';

export class Station {
    constructor(daten, abschnitt, vst, bst, geo) {
        this.daten = daten;
        this.abschnitt = abschnitt;
        this.vst = vst;
        this.bst = bst;
        this.geo = geo;
        this.abschnitt.addStation(this);
        this.seg = [];
        this.vector = [];
        this.linie = null;
        this.calcVector();
        this._querschnitte = {};
    }
    addQuerschnitt(querschnitt) {
        let streifen = querschnitt.streifen;
        let nr = querschnitt.streifennr;
        if (!(streifen in this._querschnitte)) {
            this._querschnitte[streifen] = {};
        }
        this._querschnitte[streifen][nr] = querschnitt;
    }
    getQuerschnitt(streifen, streifennr) {
        if (!(streifen in this._querschnitte))
            return null;
        if ((!streifen in this._querschnitte[streifen]))
            return null;
        return this._querschnitte[streifen][streifennr];
    }
    getAllQuerschnitte() {
        let r = [];
        for (let streifen of this._querschnitte) {
            for (let querschnitt of streifen) {
                r.push(querschnitt);
            }
        }
        return r;
    }
    getStreifen(streifen) {
        if (!(streifen in this._querschnitte))
            return null;
        return this._querschnitte[streifen];
    }
    calcVector(absId) {
        let anzahl = this.geo.length;
        if (anzahl >= 2) {
            let first = Vektor.einheit(Vektor.lot(Vektor.diff(this.geo[0], this.geo[1])));
            this.vector.push(first);
            for (let i = 1; i < anzahl - 1; i++) {
                //this.vector.push(Vektor.azi2vec((Vektor.azi(this.geo[i-1], this.geo[i]) + Vektor.azi(this.geo[i], this.geo[i+1])  - Math.PI) / 2.) )
                this.vector.push(Vektor.einheit(Vektor.lot(Vektor.sum(Vektor.einheit(Vektor.diff(this.geo[i - 1], this.geo[i])), Vektor.einheit(Vektor.diff(this.geo[i], this.geo[i + 1]))))));
            }
            //this.vector.push(Vektor.azi2vec(Vektor.azi(this.geo[anzahl-2], this.geo[anzahl-1]) - 0.5 * Math.PI ) )
            let last = Vektor.einheit(Vektor.lot(Vektor.diff(this.geo[anzahl - 2], this.geo[anzahl - 1])));
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
    teilen(station) {
        PublicWFS.showMessage("noch nicht möglich", true);
        this.abschnitt.getAufbauDaten(Station.teilen_callback, undefined, this, station);
    }

    static teilen_callback(_this, station) {
        
        _this.abschnitt.writeQuerAufbau();
    }
}

module.exports = Station;