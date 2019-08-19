/**
 * Strassenausstrattung (punktuell)
 * @author Florian Timm, LGV HH 
 * @version 2019.06.06
 * @copyright MIT
 */

import PublicWFS from '../PublicWFS';
import { Point } from 'ol/geom';
import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill, Circle, Text } from 'ol/style';
import "../import_jquery.js";
import 'chosen-js';
import 'chosen-js/chosen.css';
import Daten from "../Daten";
import Klartext from './Klartext';
import Abschnitt from './Abschnitt';
import { InfoToolSelectable } from '../Tools/Aufstellvorrichtung/AvInfoTool';
import { Map } from 'ol';
import Objekt from './Objekt';

var CONFIG_WFS: { [index: string]: { [index: string]: { kt?: string, art: number } } } = require('../config_wfs.json');


export default class StrassenAusPunkt extends Feature implements InfoToolSelectable, Objekt {
    abschnittOderAst: string;
    kherk: string;
    baujahrGew: string;
    abnahmeGew: string;
    dauerGew: string;
    ablaufGew: string;
    objektnr: string;
    ADatum: string;
    bemerkung: string;
    bearbeiter: string;
    behoerde: string;
    fid: string = null;
    inER: {} = {};
    abschnitt: Abschnitt;
    private _daten: Daten;

    projekt: string;
    hasSekObj: number;
    vabstVst: number;
    vabstBst: number;
    vst: number;
    bst: number;
    rlageVst: string;
    art: string;
    rabstbaVst: number;
    labstbaVst: number;
    abschnittId: string;
    objektId: string;
    erfart: string;
    quelle: string;


    constructor() {
        super({ geom: null });
        StrassenAusPunkt.loadKlartexte();
        this._daten = Daten.getInstanz();
    }

    private static loadKlartexte() {
        Klartext.getInstanz().load('Itstrauspktart');
        Klartext.getInstanz().load('Itallglage');
        Klartext.getInstanz().load('Itquelle');
    }

    getHTMLInfo(ziel: HTMLElement) {
        let kt = Daten.getInstanz().klartexte;
        let r = "<table>";
        /*for (var tag in CONFIG_WFS.AUFSTELL) {
            if (this[tag] == null || this[tag] == undefined) continue;

            r += "<tr><td>" + tag + "</td><td>";
            if (tag == 'art') {
                r += art.get(this[tag]).beschreib
            } else {
                r += this[tag];
            }
            r += "</td></tr>";
        }
        */
        r += "<tr><td>VNK</td><td>" + this.abschnitt.vnk + "</td></tr>";
        r += "<tr><td>NNK</td><td>" + this.abschnitt.nnk + "</td></tr>";
        r += "<tr><td>VST</td><td>" + this.vst + "</td></tr>";
        if (this.labstbaVst == null) {
            r += "<tr><td>Abstand:</td><td>"
        } else {
            r += "<tr><td>Abst.&nbsp;re.</td><td>"
        }

        if (this.rabstbaVst >= 0.01) r += "R";
        else if (this.rabstbaVst <= 0.01) r += "L";
        else r += "M";
        r += " " + Math.abs(this.rabstbaVst) + '</td></tr>';
        console.log(this.labstbaVst);
        if (this.labstbaVst != null) {
            r += "<tr><td>Abst.&nbsp;li.</td><td>"
            if (this.labstbaVst >= 0.01) r += "R";
            else if (this.labstbaVst <= 0.01) r += "L";
            else r += "M";
            r += " " + Math.abs(this.labstbaVst) + '</td></tr>';
        }

        r += "<tr><td>Art</td><td>" + kt.get('Itaufstvorart', this.art).beschreib + "</td></tr>";
        r += "<tr><td>Lage</td><td>" + kt.get('Itallglage', this.rlageVst).beschreib + "</td></tr>";
        r += "<tr><td>Schilder</td><td>" + this.hasSekObj + "</td></tr>";
        r += "<tr><td>Quelle</td><td>" + ((this.quelle != null) ? (kt.get("Itquelle", this.quelle).beschreib) : '') + "</td></tr>";
        r += "</table>"

        if (ziel != undefined) {
            ziel.innerHTML = r;
        }

        return r;
    }

    /**
 * 
 * @param {*} ereignisraum 
 * @param {*} daten 
 */

    static loadER(daten: Daten) {
        StrassenAusPunkt.loadKlartexte();
        PublicWFS.doQuery('Otaufstvor', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></Filter>', StrassenAusPunkt._loadER_Callback, undefined, daten);

    }

    static _loadER_Callback(xml: XMLDocument, daten: Daten) {
        let aufstell = xml.getElementsByTagName("Otaufstvor");
        for (let i = 0; i < aufstell.length; i++) {
            let f = StrassenAusPunkt.fromXML(aufstell[i]);
            daten.l_aufstell.getSource().addFeature(f);
        }
    }

    /**
     * Lädt einen Abschnitt nach
     * @param {Daten} daten 
     * @param {Abschnitt} abschnitt 
     */
    static loadAbschnittER(abschnitt: Abschnitt, callback: (...args: any[]) => void, ...args: any[]) {
        //console.log(daten);
        document.body.style.cursor = 'wait';
        PublicWFS.doQuery('Otaufstvor', '<Filter>' +
            '<And><PropertyIsEqualTo><PropertyName>abschnittId</PropertyName>' +
            '<Literal>' + abschnitt.abschnittid + '</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + Daten.getInstanz().ereignisraum + '</Literal></PropertyIsEqualTo></And></Filter>', StrassenAusPunkt._loadAbschnittER_Callback, undefined, callback, ...args);
    }

    static _loadAbschnittER_Callback(xml: XMLDocument, callback: (...args: any[]) => void, ...args: any[]) {
        //console.log(daten);
        let aufstell = xml.getElementsByTagName("Otaufstvor");
        for (let i = 0; i < aufstell.length; i++) {
            let f = StrassenAusPunkt.fromXML(aufstell[i]);
            Daten.getInstanz().l_aufstell.getSource().addFeature(f);
        }
        callback(...args);
        document.body.style.cursor = '';
    }

    static fromXML(xml: Element) {
        //console.log(daten);
        let r = new StrassenAusPunkt();
        r.fid = xml.getAttribute('fid');
        for (var tag in CONFIG_WFS["AUFSTELL"]) {
            if (xml.getElementsByTagName(tag).length <= 0) continue;
            if (CONFIG_WFS["AUFSTELL"][tag].art == 0) {
                // Kein Klartext
                r[tag] = xml.getElementsByTagName(tag)[0].firstChild.textContent;
            } else if (CONFIG_WFS.AUFSTELL[tag].art == 1) {
                // Kein Klartext
                r[tag] = Number(xml.getElementsByTagName(tag)[0].firstChild.textContent);
            } else if (CONFIG_WFS.AUFSTELL[tag].art == 2) {
                // Klartext, xlink wird gespeichert
                r[tag] = xml.getElementsByTagName(tag)[0].getAttribute('xlink:href');
            }
        }

        let koords = xml.getElementsByTagName('gml:coordinates')[0].firstChild.textContent.split(',');
        r.setGeometry(new Point([parseFloat(koords[0]), parseFloat(koords[1])]));
        r.abschnitt = Daten.getInstanz().getAbschnitt(r.abschnittId);
        r.abschnitt.inER['Otaufstvor'] = true;
        Daten.getInstanz().l_achse.changed();
        return r;
    }

    static createLayer(map: Map) {
        let source = new VectorSource({
            features: []
        });
        let layer = new VectorLayer({
            source: source,
            opacity: 0.7,
        });
        layer.setStyle(function (feature: StrassenAusPunkt, zoom) {
            return new Style({
                image: new Circle({
                    radius: 3,
                    fill: new Fill({ color: 'black' }),
                    stroke: new Stroke({
                        color: (feature.hasSekObj > 0) ? ('rgba(250,120,0,0.8)') : ('rgba(255,0,0,0.8)'),
                        width: 3
                    })
                }),
                text: new Text({
                    font: '13px Calibri,sans-serif',
                    fill: new Fill({ color: '#000' }),
                    stroke: new Stroke({
                        color: '#fff', width: 2
                    }),
                    offsetX: 9,
                    offsetY: -8,
                    textAlign: 'left',
                    // get the text from the feature - `this` is ol.Feature
                    // and show only under certain resolution
                    text: ((zoom < 0.2) ? ("" + feature.vst) : '')
                }),
            });
        });
        map.addLayer(layer);
        return layer;
    }

    _getText() {
        return "test";
    }

    updateStation(station: number, abstand: number) {
        this.vabstVst = Math.round(abstand * 10) / 10;
        this.vabstBst = this.vabstVst;
        this.rabstbaVst = this.vabstVst;
        this.vst = Math.round(station);
        this.bst = this.vst;
        let xml = '<wfs:Update typeName="Otaufstvor">\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>vabstVst</wfs:Name>\n' +
            '		<wfs:Value>' + this.vabstVst + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>vabstBst</wfs:Name>\n' +
            '		<wfs:Value>' + this.vabstBst + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>rabstbaVst</wfs:Name>\n' +
            '		<wfs:Value>' + this.rabstbaVst + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>vst</wfs:Name>\n' +
            '		<wfs:Value>' + this.vst + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>bst</wfs:Name>\n' +
            '		<wfs:Value>' + this.bst + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<ogc:Filter>\n' +
            '		<ogc:And>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>objektId</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.objektId + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.projekt + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '		</ogc:And>\n' +
            '	</ogc:Filter>\n' +
            '</wfs:Update>';
        PublicWFS.doTransaction(xml);
    }

}