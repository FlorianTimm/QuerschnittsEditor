import Vektor from '../Vektor';
import Feature from 'ol/Feature';
import MultiLineString from 'ol/geom/MultiLineString';
import PublicWFS from '../PublicWFS';
import Daten from '../Daten';
import Abschnitt from './Abschnitt';
import Querschnitt from './Querschnittsdaten';
import Aufbau from './Aufbaudaten';

/**
* Querschnitts-Station
* @author Florian Timm, LGV HH 
* @version 2019.10.29
* @copyright MIT
*/

export default class QuerStation {

    private daten: Daten;
    private abschnitt: Abschnitt;
    private vst: number;
    private bst: number;
    private geo: number[][];
    private seg: number[] = [];
    private vector: number[][] = [];
    private linie: MultiLineString = null;
    private _querschnitte: { [streifen: string]: { [streifennr: number]: Querschnitt } } = {};

    constructor(abschnitt: Abschnitt, vst: number, bst: number, geo: number[][]) {
        this.daten = Daten.getInstanz();
        this.abschnitt = abschnitt;
        this.vst = vst;
        this.bst = bst;
        this.geo = geo;
        this.abschnitt.addStation(this);
        this.calcVector();
    }
    addQuerschnitt(querschnitt: Querschnitt) {
        let streifen = querschnitt.getStreifen();
        let nr = querschnitt.getStreifennr();
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
    getStreifen(streifen: 'M' | 'L' | 'R'): { [streifennr: number]: Querschnitt } {
        if (!(streifen in this._querschnitte))
            return null;
        return this._querschnitte[streifen];
    }

    getQuerschnittByBstAbstand(XBstL: number, XBstR: number): Querschnitt {
        for (let streifen in this._querschnitte) {
            for (let querschnitt in this._querschnitte[streifen]) {
                if (XBstL < 0 && this._querschnitte[streifen][querschnitt].getXBstL() == XBstL) return this._querschnitte[streifen][querschnitt];
                if (XBstR > 0 && this._querschnitte[streifen][querschnitt].getXBstR() == XBstR) return this._querschnitte[streifen][querschnitt];
            }
        }
        return null;
    }

    getQuerschnittByVstAbstand(XVstL: number, XVstR: number): Querschnitt {
        for (let streifen in this._querschnitte) {
            for (let querschnitt in this._querschnitte[streifen]) {
                if (XVstL < 0 && this._querschnitte[streifen][querschnitt].getXVstL() == XVstL) return this._querschnitte[streifen][querschnitt];
                if (XVstR > 0 && this._querschnitte[streifen][querschnitt].getXVstR() == XVstR) return this._querschnitte[streifen][querschnitt];
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
            this.daten.vectorStation.addFeature(feat);
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
        if (this.vst < station && this.bst > station) {
            this.abschnitt.getAufbauDaten(this.teilen_callback_aufbaudaten.bind(this), undefined, false, station);
        } else {
            PublicWFS.showMessage("nicht möglich, da neue Station zu dicht an bestehenden", true);
        }
    }

    private teilen_callback_aufbaudaten(station: number) {

        let xml = '<wfs:Delete typeName="Dotquer">\n' +
            '	<ogc:Filter>\n' +
            '		<ogc:And>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>abschnittId</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.abschnitt.getAbschnittid() + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>vst</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.getVst() + '</ogc:Literal>\n' +
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
                let breite = Math.round(st.getBreite() + (st.getBisBreite() - st.getBreite()) * faktor);
                let XL = Math.round((st.getXVstL() + (st.getXBstL() - st.getXVstL()) * faktor) * 100) / 100;
                let XR = Math.round((st.getXVstR() + (st.getXBstR() - st.getXVstR()) * faktor) * 100) / 100;
                xml += st.createInsertXML({
                    vst: this.vst,
                    bst: station,
                    breite: st.getBreite(),
                    bisBreite: breite,
                    XVstL: st.getXVstL(),
                    XVstR: st.getXVstR(),
                    XBstL: XL,
                    XBstR: XR
                }, true);
                xml += st.createInsertXML({
                    vst: station,
                    bst: this.bst,
                    breite: breite,
                    bisBreite: st.getBisBreite(),
                    XVstL: XL,
                    XVstR: XR,
                    XBstL: st.getXBstL(),
                    XBstR: st.getXBstR()
                }, true);
            }
        }

        PublicWFS.doTransaction(xml, this.neueQuerschnitteCallbackInsertResult.bind(this), undefined, station);
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
        this.abschnitt.getAufbauDaten(this.rewriteCallbackAufbaudaten.bind(this))
    }

    private rewriteCallbackAufbaudaten() {
        let soap = '<wfs:Delete typeName="Dotquer">\n' +
            '<ogc:Filter>\n' +
            '  <ogc:And>\n' +
            '    <ogc:PropertyIsEqualTo>\n' +
            '       <ogc:PropertyName>abschnittId</ogc:PropertyName>\n' +
            '      <ogc:Literal>' + this.abschnitt.getAbschnittid() + '</ogc:Literal>\n' +
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
            '      <ogc:Literal>' + this.abschnitt.getAbschnittid() + '</ogc:Literal>\n' +
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
        PublicWFS.doTransaction(soap, this.neueQuerschnitteCallbackInsertResult.bind(this))
    }

    private neueQuerschnitteCallbackInsertResult(xml: Document, station?: number) {
        console.log(xml);
        let filter = '<Filter>';
        let childs = xml.getElementsByTagName('InsertResult')[0].childNodes;
        for (let i = 0; i < childs.length; i++) {
            filter += '<FeatureId fid="' + (childs[i] as Element).getAttribute('fid') + '"/>';
        }
        filter += '</Filter>';
        PublicWFS.doQuery('Dotquer', filter, this.neueQuerschnitteCallbackDotquer.bind(this), undefined, station);

    }

    private neueQuerschnitteCallbackDotquer(xml: Document, station?: number) {
        let insert = "<wfs:Insert>\n";
        let dotquer = Array.from(xml.getElementsByTagName("Dotquer"));
        let insertRows = 0;
        for (let i = 0; i < dotquer.length; i++) {
            let neu = Querschnitt.fromXML(dotquer[i], true);
            let alt = this.getQuerschnitt(neu.getStreifen(), neu.getStreifennr())

            let aufbau = alt.getAufbau() as { [schicht: number]: Aufbau };
            console.log(aufbau);
            for (let schichtnr in aufbau) {
                let schicht = aufbau[schichtnr];
                if (schicht.getBst() <= neu.getVst() || schicht.getVst() >= neu.getBst()) continue;
                insert += schicht.createXML({
                    vst: schicht.getVst() < neu.getVst() ? neu.getVst() : schicht.getVst(),
                    bst: schicht.getBst() > neu.getBst() ? neu.getBst() : schicht.getBst(),
                    parent: neu.getFid()
                }, true)
                insertRows++;
            }

        }
        insert += "</wfs:Insert>";
        console.log(insert)
        if (insertRows > 0) {
            PublicWFS.doTransaction(insert);
        }


        if (station != undefined) {
            let neueStation = new QuerStation(this.abschnitt, station, this.bst, this.geo);
            this.bst = station;
            this.abschnitt.addStation(neueStation);
            neueStation.reload();
        }

        this.reload()
    }

    reload() {
        let filter = '<Filter>' +
            '<And>' +
            '<PropertyIsEqualTo>' +
            '<PropertyName>abschnittId</PropertyName>' +
            '<Literal>' + this.abschnitt.getAbschnittid() + '</Literal>' +
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
        let first = true;
        this.deleteAll();
        let dotquer = xml.getElementsByTagName("Dotquer");
        let liste: Querschnitt[] = [];
        for (let i = 0; i < dotquer.length; i++) {
            //console.log(quer);
            let q = Querschnitt.fromXML(dotquer[i])
            liste.push(q);

            if (first) {
                let koords = xml.getElementsByTagName('gml:coordinates')[0].firstChild.textContent.split(' ');
                this.geo = [];
                for (let i = 0; i < koords.length; i++) {
                    let k = koords[i].split(',')
                    let x = Number(k[0]);
                    let y = Number(k[1]);
                    this.geo.push([x, y]);
                }
                first = false;
                this.calcVector()
            }
        }
        for (let i = 0; i < liste.length; i++) {
            liste[i].check();
        }
    }

    public deleteStreifen(streifen: string, nummer: number) {
        this.daten.vectorTrenn.removeFeature(this._querschnitte[streifen][nummer].trenn)
        this.daten.vectorQuer.removeFeature(this._querschnitte[streifen][nummer].flaeche)
        let max = -1;
        for (let i in this._querschnitte[streifen]) {
            if (Number(i) > max) {
                max = Number(i);
            }
        }
        delete this._querschnitte[streifen][nummer];
    }

    // Getter

    getAbschnitt(): Abschnitt {
        return this.abschnitt;
    }

    getVst(): number {
        return this.vst;
    }

    getBst(): number {
        return this.bst;
    }

    getGeometry(): number[][] {
        return this.geo;
    }

    getVector(): number[][] {
        return this.vector;
    }

    getSegment(): number[] {
        return this.seg;
    }
}