/**
 * Aufstellvorrichtung
 * @author Florian Timm, LGV HH 
 * @version 2019.08.22
 * @copyright MIT
 */
import "../import_jquery.js";
import 'chosen-js';
import 'chosen-js/chosen.css';
import { Point } from 'ol/geom';
import Daten from "../Daten";
import PublicWFS from '../PublicWFS';
import { InfoToolSelectable } from '../Tools/InfoTool';
import Abschnitt from './Abschnitt';
import Klartext from './Klartext';
import Objekt from './Objekt';
import PunktObjekt from './PunktObjekt';
import Zeichen from './Zeichen';

class Aufstellvorrichtung extends PunktObjekt implements InfoToolSelectable, Objekt {
    private _daten: Daten;
    private _zeichen: Zeichen[] = null;

    labstbaVst: number;
    rabstbaVst: number;
    hasSekObj: number;
    vabstVst: number;
    vabstBst: number;
    art: string;
    rlageVst: string;

    constructor() {
        super();
        this._daten = Daten.getInstanz();
        Aufstellvorrichtung.loadKlartexte();
    }

    static loadKlartexte() {
        Klartext.getInstanz().load('Itaufstvorart', Aufstellvorrichtung.klartext2select, 'Itaufstvorart', document.forms.namedItem("avadd").avadd_art);
        Klartext.getInstanz().load('Itallglage', Aufstellvorrichtung.klartext2select, 'Itallglage', document.forms.namedItem("avadd").avadd_lage);
        Klartext.getInstanz().load('Itquelle', Aufstellvorrichtung.klartext2select, 'Itquelle', document.forms.namedItem("avadd").avadd_quelle);
    }

    colorFunktion1(): import("ol/colorlike").ColorLike {
        if (this.hasSekObj > 0 || (this._zeichen != null && this._zeichen.length > 0)) {
            return 'rgba(250,120,0,0.8)';
        } else {
            return 'rgba(255,0,0,0.8)';
        }
    }

    colorFunktion2(): import("ol/colorlike").ColorLike {
        return 'black';
    }

    getHTMLInfo(ziel: HTMLElement) {
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
        console.log(this.labstbaVst);
        if (this.labstbaVst != null) {
            r += "<tr><td>Abst.&nbsp;li.</td><td>"
            if (this.labstbaVst >= 0.01) r += "R";
            else if (this.labstbaVst <= 0.01) r += "L";
            else r += "M";
            r += " " + Math.abs(this.labstbaVst) + '</td></tr>';
        }

        r += "<tr><td>Art</td><td>" + kt.get('Itaufstvorart', this.art).beschreib + "</td></tr>";
        if (this.objektnr != null && this.objektnr != "") {
            r += "<tr><td>ext. Nr.</td><td>" + this.objektnr + "</td></tr>";
        }
        r += "<tr><td>Lage</td><td>" + kt.get('Itallglage', this.rlageVst).beschreib + "</td></tr>";
        r += "<tr><td>Schilder</td><td>" + this.hasSekObj + "</td></tr>";
        r += "<tr><td>Quelle</td><td>" + ((this.quelle != null) ? (kt.get("Itquelle", this.quelle).beschreib) : '') + "</td></tr>";
        r += "</table>"

        if (ziel != undefined) {
            ziel.innerHTML = r;
            this.getZeichen(this._vz_addHTML.bind(this), ziel)
        }
        return r;
    }

    private _vz_addHTML(zeichen: any, ziel: HTMLElement) {
        let div = document.createElement('div');
        div.style.marginTop = '5px';
        for (let eintrag of zeichen) {
            let img = document.createElement("img");
            img.style.height = "30px";
            img.src = "http://gv-srv-w00118:8080/schilder/" + Klartext.getInstanz().get("Itvzstvoznr", eintrag.stvoznr)['kt'] + ".svg";
            img.title = Klartext.getInstanz().get("Itvzstvoznr", eintrag.stvoznr)['beschreib'] + ((eintrag.vztext != null) ? ("\n" + eintrag.vztext) : (''))
            div.appendChild(img);
        }
        ziel.appendChild(div);
    }

    /**
     * 
     * @param {*} ereignisraum 
     * @param {*} daten 
     */
    static loadER(callback?: (...args: any) => void, ...args: any) {
        let daten = Daten.getInstanz();
        Aufstellvorrichtung.loadKlartexte();
        PublicWFS.doQuery('Otaufstvor', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></Filter>', Aufstellvorrichtung._loadER_Callback, undefined, callback, ...args);

    }

    static _loadER_Callback(xml: XMLDocument, callback?: (...args: any) => void, ...args: any) {
        let aufstell = xml.getElementsByTagName("Otaufstvor");
        for (let i = 0; i < aufstell.length; i++) {
            let f = Aufstellvorrichtung.fromXML(aufstell[i]);
            Daten.getInstanz().l_aufstell.getSource().addFeature(f);
        }
        if (callback != undefined)
            callback(...args);
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
            '<Literal>' + Daten.getInstanz().ereignisraum + '</Literal></PropertyIsEqualTo></And></Filter>', Aufstellvorrichtung._loadAbschnittER_Callback, undefined, callback, ...args);
    }

    private static _loadAbschnittER_Callback(xml: XMLDocument, callback: (...args: any[]) => void, ...args: any[]) {
        //console.log(daten);
        let aufstell = xml.getElementsByTagName("Otaufstvor");
        for (let i = 0; i < aufstell.length; i++) {
            let f = Aufstellvorrichtung.fromXML(aufstell[i]);
            Daten.getInstanz().l_aufstell.getSource().addFeature(f);
        }
        callback(...args);
        document.body.style.cursor = '';
    }

    static fromXML(xml: Element) {
        let daten = Daten.getInstanz();
        let r = new Aufstellvorrichtung();
        r.setDataFromXML("AUFSTELL", xml);

        let koords = xml.getElementsByTagName('gml:coordinates')[0].firstChild.textContent.split(',');
        r.setGeometry(new Point([parseFloat(koords[0]), parseFloat(koords[1])]));
        r.abschnitt = daten.getAbschnitt(r.abschnittId);
        r.abschnitt.inER['Otaufstvor'] = true;
        daten.l_achse.changed();
        return r;
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

    getZeichen(callback: (...args: any[]) => void, ...args: any[]) {
        if (this._zeichen == null && this.hasSekObj > 0) {
            this.reloadZeichen(callback, ...args);
        } else if (this.hasSekObj > 0) {
            if (callback != undefined) {
                callback(this._zeichen, ...args);
            } else {
                return this._zeichen;
            }
        }
    }

    reloadZeichen(callback: (...args: any[]) => void, ...args: any[]) {
        PublicWFS.doQuery('Otvzeichlp', '<Filter>\n' +
            '  <PropertyIsEqualTo>\n' +
            '    <PropertyName>parent/@xlink:href</PropertyName>\n' +
            '    <Literal>' + this.fid + '</Literal>\n' +
            '  </PropertyIsEqualTo>\n' +
            '</Filter>', this._parseZeichen.bind(this), undefined, callback, ...args);
    }

    private _parseZeichen(xml: XMLDocument, callback: (...args: any[]) => void, ...args: any[]) {
        let zeichen: Zeichen[] = [];
        let zeichenXML = xml.getElementsByTagName('Otvzeichlp');

        for (let i = 0; i < zeichenXML.length; i++) {
            let eintrag = zeichenXML.item(i);
            if (!(eintrag.getElementsByTagName("enr").length > 0)) {
                zeichen.push(Zeichen.fromXML(eintrag, this._daten));
            }
        }
        this._zeichen = zeichen;
        if (callback != undefined) {
            callback(this._zeichen, ...args);
        }
    }

}

export default Aufstellvorrichtung