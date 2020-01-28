// SPDX-License-Identifier: GPL-3.0-or-later

import Vektor from '../Vektor';
import Feature from 'ol/Feature';
import MultiLineString from 'ol/geom/MultiLineString';
import PublicWFS from '../PublicWFS';
import Daten from '../Daten';
import Abschnitt, { LinienPunkt } from './Abschnitt';
import Querschnitt from './Querschnittsdaten';
import Aufbau from './Aufbaudaten';
import { Point } from 'ol/geom';
import { VectorLayer } from '../openLayers/Layer';
import VectorSource from 'ol/source/Vector';
import { Map } from 'ol';
import { Stroke, Style } from 'ol/style';

/**
 * Querschnitts-Station
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.10.29
 * @license GPL-3.0-or-later
*/
export default class QuerStation {

    private daten: Daten;
    private abschnitt: Abschnitt;
    private vst: number;
    private bst: number;
    private linie: MultiLineString;
    private _querschnitte: { [streifen: string]: { [streifennr: number]: Querschnitt } } = {};
    private linienPunkte: LinienPunkt[];
    private static layerStation: VectorLayer;

    constructor(abschnitt: Abschnitt, vst: number, bst: number) {
        this.daten = Daten.getInstanz();
        this.abschnitt = abschnitt;
        this.vst = vst;
        this.bst = bst;
        this.abschnitt.addStation(this);
        this.getPunkte();
    }

    static getLayer(map?: Map) {
        if (!QuerStation.layerStation) {
            QuerStation.layerStation = new VectorLayer({
                source: new VectorSource(),
                opacity: 0.6,
                style: new Style({
                    stroke: new Stroke({
                        color: '#000000',
                        width: 1
                    })
                })
            });
        }
        if (map) map.addLayer(QuerStation.layerStation);
        return QuerStation.layerStation
    }

    public addQuerschnitt(querschnitt: Querschnitt) {
        let streifen = querschnitt.getStreifen();
        let nr = querschnitt.getStreifennr();
        if (!(streifen in this._querschnitte)) {
            this._querschnitte[streifen] = {};
        }
        this._querschnitte[streifen][nr] = querschnitt;
    }
    public getQuerschnitt(streifen: string, streifennr: number): Querschnitt {
        if (!(streifen in this._querschnitte))
            return null;
        if (!(streifennr in this._querschnitte[streifen]))
            return null;
        return this._querschnitte[streifen][streifennr];
    }

    public getAllQuerschnitte(): Querschnitt[] {
        let r: Querschnitt[] = [];
        for (let streifen in this._querschnitte) {
            for (let nr in this._querschnitte[streifen]) {
                r.push(this._querschnitte[streifen][nr]);
            }
        }
        return r;
    }

    public getStreifen(streifen: 'M' | 'L' | 'R'): { [streifennr: number]: Querschnitt } {
        if (!(streifen in this._querschnitte))
            return {};
        return this._querschnitte[streifen];
    }

    public getQuerschnittByBstAbstand(XBstL: number, XBstR: number): Querschnitt {
        for (let streifen in this._querschnitte) {
            for (let querschnitt in this._querschnitte[streifen]) {
                if (XBstL < 0 && this._querschnitte[streifen][querschnitt].getXBstL() == XBstL) return this._querschnitte[streifen][querschnitt];
                if (XBstR > 0 && this._querschnitte[streifen][querschnitt].getXBstR() == XBstR) return this._querschnitte[streifen][querschnitt];
            }
        }
        return null;
    }

    public getQuerschnittByVstAbstand(XVstL: number, XVstR: number): Querschnitt {
        for (let streifen in this._querschnitte) {
            for (let querschnitt in this._querschnitte[streifen]) {
                if (XVstL < 0 && this._querschnitte[streifen][querschnitt].getXVstL() == XVstL) return this._querschnitte[streifen][querschnitt];
                if (XVstR > 0 && this._querschnitte[streifen][querschnitt].getXVstR() == XVstR) return this._querschnitte[streifen][querschnitt];
            }
        }
        return null;
    }

    public getPunkte(reload: boolean = false): LinienPunkt[] {
        if (this.linienPunkte && !reload) return this.linienPunkte;

        this.linienPunkte = this.getAbschnitt().getAbschnitt(this.getVst(), this.getBst());

        // Trennlinien
        let erster = this.linienPunkte[0]
        let letzter = this.linienPunkte[this.linienPunkte.length - 1];
        let statTrenn = [];
        statTrenn.push([Vektor.sum(letzter.pkt, Vektor.multi(letzter.seitlicherVektorAmPunkt, 30)), Vektor.sum(letzter.pkt, Vektor.multi(letzter.seitlicherVektorAmPunkt, -30))]);
        QuerStation.layerStation.getSource().addFeature(new Feature({ geom: new Point(letzter.pkt) }));
        if (this.vst == 0) {
            statTrenn.push([Vektor.sum(erster.pkt, Vektor.multi(erster.seitlicherVektorAmPunkt, 30)), Vektor.sum(erster.pkt, Vektor.multi(erster.seitlicherVektorAmPunkt, -30))]);
            QuerStation.layerStation.getSource().addFeature(new Feature({ geom: new Point(erster.pkt) }));
        }

        if (this.linie) {
            this.linie.setCoordinates(statTrenn)
        } else {
            this.linie = new MultiLineString(statTrenn);
            let feat = new Feature({
                geometry: this.linie,
                objekt: this,
            });
            QuerStation.layerStation.getSource().addFeature(feat);
        }
        return this.linienPunkte;
    }

    public async teilen(station: number): Promise<void> {
        if (this.vst < station && this.bst > station) {
            return this.abschnitt.getAufbauDaten()
                .then(() => { this.teilen_callback_aufbaudaten(station) });
        } else {
            PublicWFS.showMessage("nicht möglich, da neue Station zu dicht an bestehenden", true);
        }
    }

    private async teilen_callback_aufbaudaten(station: number): Promise<Querschnitt[]> {
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
        return PublicWFS.doTransaction(xml)
            .then((xml: Document) => { return this.getInsertedQuerschnitte(xml, station) });
    }

    deleteAll() {
        this.linienPunkte = undefined;
        for (let streifen in this._querschnitte) {
            for (let nr in this._querschnitte[streifen]) {
                this._querschnitte[streifen][nr].delete();
            }
        }
        this._querschnitte = {};
    }

    public async rewrite(): Promise<Querschnitt[]> {
        await this.abschnitt.getAufbauDaten();
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
        const xml = await PublicWFS.doTransaction(soap);
        return this.getInsertedQuerschnitte(xml);
    }

    private async getInsertedQuerschnitte(xmlInsertResults: Document, station?: number): Promise<Querschnitt[]> {
        console.log(xmlInsertResults);
        let filter = '<Filter>';
        let childs = xmlInsertResults.getElementsByTagName('InsertResult')[0].childNodes;
        for (let i = 0; i < childs.length; i++) {
            filter += '<FeatureId fid="' + (childs[i] as Element).getAttribute('fid') + '"/>';
        }
        filter += '</Filter>';
        const xmlInsertedQuerschnitte = await PublicWFS.doQuery('Dotquer', filter);
        return this.neueQuerschnitteCallbackDotquer(xmlInsertedQuerschnitte, station);
    }

    private async neueQuerschnitteCallbackDotquer(xml: Document, station?: number): Promise<Querschnitt[]> {
        let dotquer = Array.from(xml.getElementsByTagName("Dotquer"));
        let tasks: Promise<string>[] = [];
        for (let i = 0; i < dotquer.length; i++) {
            tasks.push(this.createAufbauAddXML(dotquer[i]));
        };

        let insertXML = (await Promise.all(tasks)).join();

        if (insertXML.length > 0) {
            PublicWFS.doTransaction("<wfs:Insert>\n" + insertXML + "</wfs:Insert>");
        }

        if (station != undefined) {
            let neueStation = new QuerStation(this.abschnitt, station, this.bst);
            this.bst = station;
            this.abschnitt.addStation(neueStation);
            neueStation.reload();
        }

        return this.reload();
    }

    private async createAufbauAddXML(xml: Element): Promise<string> {
        let insert = ""
        let neuQuer = await Querschnitt.fromXML(xml, true);

        let alt = this.getQuerschnitt(neuQuer.getStreifen(), neuQuer.getStreifennr())
        if (alt == undefined) return "";
        let aufbau = await alt.getAufbau();

        for (let schichtnr in aufbau) {
            let schicht = aufbau[schichtnr];
            if (schicht.getBst() <= neuQuer.getVst() || schicht.getVst() >= neuQuer.getBst()) continue;
            insert += schicht.createXML({
                vst: schicht.getVst() < neuQuer.getVst() ? neuQuer.getVst() : schicht.getVst(),
                bst: schicht.getBst() > neuQuer.getBst() ? neuQuer.getBst() : schicht.getBst(),
                parent: neuQuer.getFid()
            }, true);
        }
        return insert;
    }

    private async reload(): Promise<Querschnitt[]> {
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
        const xml = await PublicWFS.doQuery('Dotquer', filter);
        return this.loadStationCallback(xml);
    }

    private async loadStationCallback(xml: Document): Promise<Querschnitt[]> {
        let first = true;
        this.deleteAll();
        let dotquer = xml.getElementsByTagName("Dotquer");
        let liste: Querschnitt[] = [];

        let tasks: Promise<Querschnitt>[] = [];
        for (let i = 0; i < dotquer.length; i++) {
            tasks.push(
                Querschnitt.fromXML(dotquer[i])
                    .then((querschnitt) => {
                        if (first) {
                            this.getPunkte(true);
                            first = false;
                        }
                        return querschnitt
                    }));
        }
        const querschnitte = await Promise.all(tasks);
        for (let i = 0; i < liste.length; i++) {
            liste[i].check();
        }
        return querschnitte;
    }

    public deleteStreifen(streifen: string, nummer: number) {
        Querschnitt.getLayerTrenn().getSource().removeFeature(this._querschnitte[streifen][nummer].trenn)
        Querschnitt.getLayerFlaechen().getSource().removeFeature(this._querschnitte[streifen][nummer])
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
}