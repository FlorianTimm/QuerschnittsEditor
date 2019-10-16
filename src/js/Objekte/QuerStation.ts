import Vektor from '../Vektor';
import Feature from 'ol/Feature';
import MultiLineString from 'ol/geom/MultiLineString';
import PublicWFS from '../PublicWFS';
import Daten from '../Daten';
import Abschnitt from './Abschnitt';
import Querschnitt from './Querschnittsdaten';

/**
* Querschnitts-Station
* @author Florian Timm, LGV HH 
* @version 2019.06.06
* @copyright MIT
*/

export default class QuerStation {

    daten: Daten;
    abschnitt: Abschnitt;
    vst: number;
    bst: number;
    geo: number[];
    seg: number[] = [];
    vector: number[][] = [];
    linie: MultiLineString = null;
    private _querschnitte: { [streifen: string]: { [streifennr: number]: Querschnitt } } = {};

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
    getQuerschnitt(streifen: string, streifennr: number): Querschnitt {
        if (!(streifen in this._querschnitte))
            return null;
        if (!(streifennr in this._querschnitte[streifen]))
            return null;
        return this._querschnitte[streifen][streifennr];
    }

    getAllQuerschnitte(): Querschnitt[] {
        let r: Querschnitt[] = [];
        for (let streifen in this._querschnitte) {
            for (let nr in this._querschnitte[streifen]) {
                r.push(this._querschnitte[streifen][nr]);
            }
        }
        return r;
    }
    getStreifen(streifen: string): { [streifennr: number]: Querschnitt } {
        if (!(streifen in this._querschnitte))
            return null;
        return this._querschnitte[streifen];
    }

    getQuerschnittByBstAbstand(XBstL: number, XBstR: number): Querschnitt {
        for (let streifen in this._querschnitte) {
            for (let querschnitt in this._querschnitte[streifen]) {
                if (XBstL < 0 && this._querschnitte[streifen][querschnitt].XBstL == XBstL) return this._querschnitte[streifen][querschnitt];
                if (XBstR > 0 && this._querschnitte[streifen][querschnitt].XBstR == XBstR) return this._querschnitte[streifen][querschnitt];
            }
        }
        return null;
    }

    getQuerschnittByVstAbstand(XVstL: number, XVstR: number): Querschnitt {
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
        this.abschnitt.getAufbauDaten(this.teilen_callback_aufbaudaten.bind(this), undefined, station);
    }

    private teilen_callback_aufbaudaten(station: number) {

        let xml = '<wfs:Delete typeName="Dotquer">\n' +
            '	<ogc:Filter>\n' +
            '		<ogc:And>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>abschnittId</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.abschnitt.abschnittid + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>vst</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.vst + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.daten.ereignisraum + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '		</ogc:And>\n' +
            '	</ogc:Filter>\n' +
            '</wfs:Delete>';

        let faktor = (station - this.vst) / (this.bst - this.vst);
        for (let streifen_key in this._querschnitte) {
            let streifen = this._querschnitte[streifen_key];
            console.log(streifen);
            for (let querschnitt_key in streifen) {
                let st: Querschnitt = streifen[querschnitt_key];
                let breite = st.breite + (st.bisBreite - st.breite) * faktor;
                let XL = st.XVstL + (st.XBstL - st.XVstL) * faktor;
                let XR = st.XVstR + (st.XBstR - st.XVstR) * faktor;
                xml += st.createInsertXML({
                    vst: this.vst,
                    bst: station,
                    breite: st.breite,
                    bisBreite: breite,
                    XVstL: st.XVstL,
                    XVstR: st.XVstR,
                    XBstL: XL,
                    XBstR: XR
                }, true);
                xml += st.createInsertXML({
                    vst: station,
                    bst: this.bst,
                    breite: breite,
                    bisBreite: st.bisBreite,
                    XVstL: XL,
                    XVstR: XR,
                    XBstL: st.XBstL,
                    XBstR: st.XBstR
                }, true);
            }
        }

        PublicWFS.doTransaction(xml)

        console.log(xml);
    }


    deleteAll() {
        for (let streifen in this._querschnitte) {
            for (let nr in this._querschnitte[streifen]) {
                this._querschnitte[streifen][nr].delete();
            }
        }
        this._querschnitte = {};
    }

    rewrite() {
        let soap = '<wfs:Delete typeName="Dotquer">\n' +
            '<ogc:Filter>\n' +
            '  <ogc:And>\n' +
            '    <ogc:PropertyIsEqualTo>\n' +
            '       <ogc:PropertyName>abschnittId</ogc:PropertyName>\n' +
            '      <ogc:Literal>' + this.abschnitt.abschnittid + '</ogc:Literal>\n' +
            '    </ogc:PropertyIsEqualTo>\n' +
            '    <ogc:PropertyIsEqualTo>\n' +
            '       <ogc:PropertyName>vst</ogc:PropertyName>\n' +
            '      <ogc:Literal>' + this.vst + '</ogc:Literal>\n' +
            '    </ogc:PropertyIsEqualTo>\n' +
            '    <ogc:PropertyIsEqualTo>\n' +
            '       <ogc:PropertyName>bst</ogc:PropertyName>\n' +
            '      <ogc:Literal>' + this.bst + '</ogc:Literal>\n' +
            '    </ogc:PropertyIsEqualTo>\n' +
            '    <ogc:PropertyIsEqualTo>\n' +
            '      <ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
            '      <ogc:Literal>' + this.daten.ereignisraum + '</ogc:Literal>\n' +
            '    </ogc:PropertyIsEqualTo>\n' +
            '  </ogc:And>\n' +
            '</ogc:Filter>\n' +
            '</wfs:Delete>\n' +
            '<wfs:Delete typeName="Otschicht">\n' +
            '<ogc:Filter>\n' +
            '  <ogc:And>\n' +
            '    <ogc:PropertyIsEqualTo>\n' +
            '       <ogc:PropertyName>abschnittId</ogc:PropertyName>\n' +
            '      <ogc:Literal>' + this.abschnitt.abschnittid + '</ogc:Literal>\n' +
            '    </ogc:PropertyIsEqualTo>\n' +
            '    <ogc:PropertyIsEqualTo>\n' +
            '       <ogc:PropertyName>vst</ogc:PropertyName>\n' +
            '      <ogc:Literal>' + this.vst + '</ogc:Literal>\n' +
            '    </ogc:PropertyIsEqualTo>\n' +
            '    <ogc:PropertyIsEqualTo>\n' +
            '       <ogc:PropertyName>bst</ogc:PropertyName>\n' +
            '      <ogc:Literal>' + this.bst + '</ogc:Literal>\n' +
            '    </ogc:PropertyIsEqualTo>\n' +
            '    <ogc:PropertyIsEqualTo>\n' +
            '      <ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
            '      <ogc:Literal>' + this.daten.ereignisraum + '</ogc:Literal>\n' +
            '    </ogc:PropertyIsEqualTo>\n' +
            '  </ogc:And>\n' +
            '</ogc:Filter>\n' +
            '</wfs:Delete>\n';
        for (let qs of this.getAllQuerschnitte()) {
            //console.log(qs);
            soap += qs.createInsertXML();
        }

        console.log(soap);
        PublicWFS.doTransaction(soap, this.reload.bind(this))
    }

    reload() {
        let filter = '<Filter>' +
            '<And>' +
            '<PropertyIsEqualTo>' +
            '<PropertyName>abschnittId</PropertyName>' +
            '<Literal>' + this.abschnitt.abschnittid + '</Literal>' +
            '</PropertyIsEqualTo>' +
            '<PropertyIsEqualTo>' +
            '<PropertyName>vst</PropertyName>' +
            '<Literal>' + this.vst + '</Literal>' +
            '</PropertyIsEqualTo>' +
            '<PropertyIsEqualTo>' +
            '<PropertyName>bst</PropertyName>' +
            '<Literal>' + this.bst + '</Literal>' +
            '</PropertyIsEqualTo>' +
            '<PropertyIsEqualTo>' +
            '<PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + this.daten.ereignisraum + '</Literal>' +
            '</PropertyIsEqualTo>' +
            '</And>' +
            '</Filter>';
        PublicWFS.doQuery('Dotquer', filter, this.loadStationCallback.bind(this));
    }

    loadStationCallback(xml: Document) {
        this.deleteAll();
        let dotquer = xml.getElementsByTagName("Dotquer");
        let liste: Querschnitt[] = [];
        for (let i = 0; i < dotquer.length; i++) {
            //console.log(quer);
            liste.push(Querschnitt.fromXML(dotquer[i]));
        }
        for (let i = 0; i < liste.length; i++) {
            liste[i].check();
        }
    }

    deleteStreifen(streifen: string, nummer: number) {
        this.daten.v_trenn.removeFeature(this._querschnitte[streifen][nummer].trenn)
        this.daten.v_quer.removeFeature(this._querschnitte[streifen][nummer].flaeche)
        let max = -1;
        for (let i in this._querschnitte[streifen]) {
            if (Number(i) > max) {
                max = Number(i);
            }
        }
        delete this._querschnitte[streifen][nummer];
    }
}