/**
 * Strassenausstrattung (punktuell)
 * @author Florian Timm, LGV HH 
 * @version 2019.06.06
 * @copyright MIT
 */

import PublicWFS from '../PublicWFS';
import { Point } from 'ol/geom';
import "../import_jquery.js";
import 'chosen-js';
import 'chosen-js/chosen.css';
import Daten from "../Daten";
import Klartext from './Klartext';
import Abschnitt from './Abschnitt';
import { InfoToolSelectable } from '../Tools/InfoTool';
import PunktObjekt from './PunktObjekt';

var CONFIG_WFS: { [index: string]: { [index: string]: { kt?: string, art: number } } } = require('../config_wfs.json');


export default class StrassenAusPunkt extends PunktObjekt implements InfoToolSelectable {
    hasSekObj: number;
    vabstVst: number;
    vabstBst: number;
    rlageVst: string;
    art: string;
    rabstbaVst: number;
    labstbaVst: number;

    constructor() {
        super();
        StrassenAusPunkt.loadKlartexte();
    }

    colorFunktion1(): import("ol/colorlike").ColorLike {
        return 'rgba(0,120,0,0.8)'
    }

    colorFunktion2(): import("ol/colorlike").ColorLike {
        return 'black';
    }

    private static loadKlartexte() {
        Klartext.getInstanz().load('Itstrauspktart', StrassenAusPunkt.klartext2select, 'Itstrauspktart', document.forms.namedItem("sapadd").sapadd_art);
        Klartext.getInstanz().load('Itallglage', StrassenAusPunkt.klartext2select, 'Itallglage', document.forms.namedItem("sapadd").sapadd_lage);
        Klartext.getInstanz().load('Itquelle', StrassenAusPunkt.klartext2select, 'Itquelle', document.forms.namedItem("sapadd").sapadd_quelle);
    }

    getHTMLInfo(ziel: HTMLElement) {
        console.log(ziel);
        let kt = Klartext.getInstanz();
        let r = "<table>";

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
        if (this.labstbaVst != null) {
            r += "<tr><td>Abst.&nbsp;li.</td><td>"
            if (this.labstbaVst >= 0.01) r += "R";
            else if (this.labstbaVst <= 0.01) r += "L";
            else r += "M";
            r += " " + Math.abs(this.labstbaVst) + '</td></tr>';
        }

        r += "<tr><td>Art</td><td>" + kt.get('Itstrauspktart', this.art).beschreib + "</td></tr>";
        r += "<tr><td>Lage</td><td>" + kt.get('Itallglage', this.rlageVst).beschreib + "</td></tr>";
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


    static loadER(callback?: (...args: any) => void, ...args: any) {
        let daten = Daten.getInstanz();
        StrassenAusPunkt.loadKlartexte();
        PublicWFS.doQuery('Otstrauspkt', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></Filter>', StrassenAusPunkt._loadER_Callback, undefined, callback, ...args);

    }

    static _loadER_Callback(xml: XMLDocument, callback?: (...args: any) => void, ...args: any) {
        let aufstell = xml.getElementsByTagName("Otstrauspkt");
        for (let i = 0; i < aufstell.length; i++) {
            let f = StrassenAusPunkt.fromXML(aufstell[i]);
            Daten.getInstanz().l_aufstell.getSource().addFeature(f);
        }
        if (callback != undefined)
            callback(...args);
    }

    /**
     * Lädt einen Abschnitt nach
     * @param {Abschnitt} abschnitt 
     */
    static loadAbschnittER(abschnitt: Abschnitt, callback?: (...args: any[]) => void, ...args: any[]) {
        //console.log(daten);
        document.body.style.cursor = 'wait';
        PublicWFS.doQuery('Otstrauspkt', '<Filter>' +
            '<And><PropertyIsEqualTo><PropertyName>abschnittId</PropertyName>' +
            '<Literal>' + abschnitt.abschnittid + '</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + Daten.getInstanz().ereignisraum + '</Literal></PropertyIsEqualTo></And></Filter>', StrassenAusPunkt._loadAbschnittER_Callback, undefined, callback, ...args);
    }

    static _loadAbschnittER_Callback(xml: XMLDocument, callback?: (...args: any[]) => void, ...args: any[]) {
        console.log(callback);
        let straus = xml.getElementsByTagName("Otstrauspkt");
        for (let i = 0; i < straus.length; i++) {
            let f = StrassenAusPunkt.fromXML(straus[i]);
            Daten.getInstanz().l_straus.getSource().addFeature(f);
        }
        document.body.style.cursor = '';
        if (callback != undefined) {
            callback(...args);
        }
    }

    static fromXML(xml: Element) {
        //console.log(daten);
        let r = new StrassenAusPunkt();
        r.fid = xml.getAttribute('fid');
        for (var tag in CONFIG_WFS["STAUSPKT"]) {
            if (xml.getElementsByTagName(tag).length <= 0) continue;
            if (CONFIG_WFS["STAUSPKT"][tag].art == 0) {
                // Kein Klartext
                r[tag] = xml.getElementsByTagName(tag)[0].firstChild.textContent;
            } else if (CONFIG_WFS.STAUSPKT[tag].art == 1) {
                // Kein Klartext
                r[tag] = Number(xml.getElementsByTagName(tag)[0].firstChild.textContent);
            } else if (CONFIG_WFS.STAUSPKT[tag].art == 2) {
                // Klartext, xlink wird gespeichert
                r[tag] = xml.getElementsByTagName(tag)[0].getAttribute('xlink:href');
            }
        }

        let koords = xml.getElementsByTagName('gml:coordinates')[0].firstChild.textContent.split(',');
        r.setGeometry(new Point([parseFloat(koords[0]), parseFloat(koords[1])]));
        r.abschnitt = Daten.getInstanz().getAbschnitt(r.abschnittId);
        r.abschnitt.inER['Otstrauspkt'] = true;
        Daten.getInstanz().l_achse.changed();
        //console.log(r);
        return r;
    }

    updateStation(station: number, abstand: number) {
        this.vabstVst = Math.round(abstand * 10) / 10;
        this.vabstBst = this.vabstVst;
        this.rabstbaVst = this.vabstVst;
        this.vst = Math.round(station);
        this.bst = this.vst;
        let xml = '<wfs:Update typeName="Otstrauspkt">\n' +
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