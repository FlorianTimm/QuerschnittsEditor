var CONFIG_WFS: { [index: string]: { [index: string]: { kt?: string, art: number } } } = require('../config_wfs.json');
import { Feature } from 'ol';
import { MultiLineString, Polygon } from 'ol/geom';
import Daten from '../Daten';
import Abschnitt from '../Objekte/Abschnitt';
import Aufbau from '../Objekte/Aufbaudaten';
import PublicWFS from '../PublicWFS';
import Vektor from '../Vektor';
import Objekt from './Objekt';
import QuerStation from './QuerStation';
import Klartext from './Klartext';
import HTML from '../HTML';

/**
* @author Florian Timm, LGV HH 
* @version 2019.10.29
* @copyright MIT
*/


export default class Querschnitt extends Objekt {
    getObjektKlassenName(): string {
        return "Dotquer"
    }
    private _daten: Daten;
    private _aufbaudaten: { [schicht: number]: Aufbau } = null;


    trenn: Feature;

    // SIB-Attribute
    private station: QuerStation = null;
    private art: string = null;
    private artober: string = null;
    private breite: number = null;
    private bisBreite: number = null;
    private blpart: any = null;
    private blpartnull: any = null;
    private uipart: any = null;
    private uipartnull: any = null;
    private XVstL: number = null;
    private XVstR: number = null;
    private XBstL: number = null;
    private XBstR: number = null;
    private streifen: 'M' | 'L' | 'R' = null;
    private streifennr: number = null;

    constructor() {
        super();
        this._daten = Daten.getInstanz();
        //console.log(daten);

        this.setGeometry(new Polygon([[[0, 0], [0, 0], [0, 0]]]));
        this._daten.vectorQuer.addFeature(this)

        this.trenn = new Feature({ geom: new MultiLineString([[[0, 0], [0, 0], [0, 0]]]), objekt: this });
        this._daten.vectorTrenn.addFeature(this.trenn);
    }

    static loadER(callback?: (xml: Document, ...args: any[]) => void, ...args: any[]) {
        document.body.style.cursor = 'wait';
        let daten = Daten.getInstanz();
        PublicWFS.doQuery('Dotquer', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></Filter>', Querschnitt._loadER_Callback, undefined, callback, ...args);
    }

    static loadAbschnittER(abschnitt: Abschnitt, callback: (...args: any[]) => void, ...args: any[]) {
        document.body.style.cursor = 'wait';
        let daten = Daten.getInstanz();
        PublicWFS.doQuery('Dotquer', '<Filter>' +
            '<And><PropertyIsEqualTo><PropertyName>abschnittId</PropertyName>' +
            '<Literal>' + abschnitt.getAbschnittid() + '</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></And></Filter>', Querschnitt._loadER_Callback, undefined, callback, ...args);
    }

    static _loadER_Callback(xml: Document, callback: (...args: any[]) => void, ...args: any[]) {
        let daten = Daten.getInstanz();
        let dotquer = xml.getElementsByTagName("Dotquer");
        let liste: Querschnitt[] = [];
        for (let i = 0; i < dotquer.length; i++) {
            //console.log(quer);
            liste.push(Querschnitt.fromXML(dotquer[i]));
        }

        Querschnitt.checkQuerschnitte(liste);

        if (callback != undefined) {
            callback(...args);
        }
        document.body.style.cursor = ''
    }

    static checkQuerschnitte(liste: Querschnitt[]) {
        liste.forEach(function (querschnitt: Querschnitt) {
            querschnitt.check()
        })

    }

    public check() {
        //if (this.XVstL != null && this.XVstR != null && this.XBstL != null && this.XBstR != null) return;
        //console.log(this);
        let m = this.station.getStreifen("M")
        let seite = this.station.getStreifen(this.streifen);

        if (this.streifen == "M") {
            this.XVstL = 0.005 * this.breite;
            this.XVstR = 0.005 * this.breite;
            this.XBstL = 0.005 * this.bisBreite;
            this.XBstR = 0.005 * this.bisBreite;
            this.createGeom();
            return;
        }

        let abstandVST = 0;
        let abstandBST = 0;
        for (let nr in m) {
            abstandVST += 0.005 * m[nr].breite;
            abstandBST += 0.005 * m[nr].bisBreite;
        }
        for (let nr in seite) {
            if (Number(nr) < this.streifennr) {
                abstandVST += 0.01 * seite[nr].breite;
                abstandBST += 0.01 * seite[nr].bisBreite;
            }
        }

        if (this.streifen == "L") {
            this.XVstL = -abstandVST - this.breite * 0.01;
            this.XVstR = -abstandVST;
            this.XBstL = -abstandBST - this.bisBreite * 0.01;
            this.XBstR = -abstandBST;
        } else {
            this.XVstL = abstandVST;
            this.XVstR = abstandVST + this.breite * 0.01;
            this.XBstL = abstandBST;
            this.XBstR = abstandBST + this.bisBreite * 0.01;
        }
        this.createGeom();
        return;

    }

    private static createFields(form: HTMLFormElement, formId: string, querschnitt?: Querschnitt, changeable: boolean = false) {
        // Art
        let art = Klartext.createKlartextSelectForm("Itquerart", form, "Art", formId + "_art", querschnitt != undefined ? querschnitt.art : undefined);
        $(art).prop('disabled', !changeable).trigger("chosen:updated");
        form.appendChild(document.createElement("br"));

        // Lage
        let lage = Klartext.createKlartextSelectForm("Itquerober", form, "Lage", formId + "_ober", querschnitt != undefined ? querschnitt.artober : undefined);
        $(lage).prop('disabled', !changeable).trigger("chosen:updated");
        form.appendChild(document.createElement("br"));

        // VNK
        let vnk = HTML.createTextInput(form, "VNK", formId + "_vnk", querschnitt != undefined ? querschnitt.getAbschnitt().getVnk() : undefined);
        vnk.disabled = true;
        form.appendChild(document.createElement("br"));

        // NNK
        let nnk = HTML.createTextInput(form, "NNK", formId + "_nnk", querschnitt != undefined ? querschnitt.getAbschnitt().getNnk() : undefined);
        nnk.disabled = true;
        form.appendChild(document.createElement("br"));

        // Station
        let station = HTML.createTextInput(form, "Station", formId + "_station", querschnitt != undefined ? querschnitt.vst + ' - ' + querschnitt.bst : undefined);
        station.disabled = true;
        form.appendChild(document.createElement("br"));

        // Streifen
        let streifen = HTML.createTextInput(form, "Streifen", formId + "_streifen", querschnitt != undefined ? querschnitt.streifen + ' ' + querschnitt.streifennr : undefined);
        streifen.disabled = true;
        form.appendChild(document.createElement("br"));

        // Breite
        let breite = HTML.createTextInput(form, "Von Breite", formId + "_breite", querschnitt != undefined ? querschnitt.breite.toString() : undefined);
        breite.disabled = true;
        form.appendChild(document.createElement("br"));

        // BisBreite
        let bisbreite = HTML.createTextInput(form, "Bis Breite", formId + "_bisbreite", querschnitt != undefined ? querschnitt.bisBreite.toString() : undefined);
        bisbreite.disabled = true;
        form.appendChild(document.createElement("br"));

        // Button
        if (changeable) {
            let input = document.createElement("input");
            input.id = formId + "_button";
            input.type = "button"
            input.value = "Querschnitt speichern"
            input.disabled = true;
            form.appendChild(input);
        }
    }

    public getInfoForm(ziel: HTMLFormElement, changeable: boolean = false): void {
        Querschnitt.createFields(ziel, "info", this, changeable);
    }

    static fromXML(xml: Element, doNotAdd: boolean = false) {
        let r = new Querschnitt();
        r.setDataFromXML('QUERSCHNITT', xml)

        if (doNotAdd) return r;  // Abbruch, falls nur die Daten geparst werden sollen

        r.abschnitt = r._daten.getAbschnitt(r.abschnittId);
        r.abschnitt.addOKinER('Querschnitt');

        //console.log(abschnitt);
        if (!(r.abschnitt.existsStation(r.vst))) {
            let koords = xml.getElementsByTagName('gml:coordinates')[0].firstChild.textContent.split(' ');
            let geo = [];
            for (let i = 0; i < koords.length; i++) {
                let k = koords[i].split(',')
                let x = Number(k[0]);
                let y = Number(k[1]);
                geo.push([x, y]);
            }
            r.station = new QuerStation(r.abschnitt, r.vst, r.bst, geo);
        } else {
            r.station = r.abschnitt.getStation(r.vst);
        }
        r.station.addQuerschnitt(r);
        r.createGeom();
        return r;
    }


    public addAufbau(schicht?: number, aufbau?: Aufbau) {
        if (this._aufbaudaten == null) { this._aufbaudaten = {} };
        if (schicht == undefined || aufbau == undefined) return;
        this._aufbaudaten[schicht] = aufbau;
    }


    public setAufbauGesamt(aufbau: { [schicht: number]: Aufbau }) {
        this._aufbaudaten = aufbau;
    }


    public getAufbau(callback?: (schichten: { [schicht: number]: Aufbau }) => void): { [schicht: number]: Aufbau } | void {
        if (callback == undefined) return this._aufbaudaten

        if (this._aufbaudaten == null) {
            this.abschnitt.getAufbauDaten(this.getAufbauCallback.bind(this), undefined, false, callback)
        } else {
            this.getAufbauCallback(callback);
        }

    }

    private getAufbauCallback(callback: (schichten: { [schicht: number]: Aufbau }) => void) {
        callback(this._aufbaudaten);
    }

    private createGeom() {
        let g = [];
        let l = [];
        let r = [];

        let abst1 = this.XVstR
        let diff1 = this.XBstR - abst1
        let abst2 = this.XVstL
        let diff2 = this.XBstL - abst2

        let anzahl = this.station.getGeometry().length;

        for (let j = 0; j < anzahl; j++) {
            let coord = Vektor.sum(this.station.getGeometry()[j], Vektor.multi(this.station.getVector()[j], this.station.getSegment()[j] * diff2 + abst2));
            if (isNaN(coord[0]) || isNaN(coord[1])) {
                console.log("Fehler: keine Koordinaten");
                continue;
            }
            g.push(coord);
            l.push(coord);
        }

        for (let j = anzahl - 1; j >= 0; j--) {
            let coord = Vektor.sum(this.station.getGeometry()[j], Vektor.multi(this.station.getVector()[j], this.station.getSegment()[j] * diff1 + abst1));
            if (isNaN(coord[0]) || isNaN(coord[1])) {
                console.log("Fehler: keine Koordinaten");
                continue;
            }
            g.push(coord);
            r.unshift(coord);
        }

        if (this.streifen == "L") this.trenn.setGeometry(new MultiLineString([l]));
        else if (this.streifen == "R") this.trenn.setGeometry(new MultiLineString([r]));
        else this.trenn.setGeometry(new MultiLineString([l, r]));

        g.push(g[0])
        this.setGeometry(new Polygon([g])) //setCoordinates([g])
    }

    public createInsertXML(changes?: { [tag: string]: number | string }, removeIds?: boolean) {
        let r = '<wfs:Insert>\n<Dotquer>\n';

        for (let change in changes) {
            if (CONFIG_WFS.QUERSCHNITT[change].art == 0 || CONFIG_WFS.QUERSCHNITT[change].art == 1) {
                // Kein Klartext
                r += '<' + change + '>' + changes[change] + '</' + change + '>\n';
            } else if (CONFIG_WFS.QUERSCHNITT[change].art == 2) {
                // Klartext
                r += '<' + change + ' xlink:href="' + changes[change] + '" typeName="' + CONFIG_WFS.QUERSCHNITT[change].kt + '" />\n';
            }
        }

        for (let tag in CONFIG_WFS.QUERSCHNITT) {
            //console.log(tag);
            if (changes != undefined && tag in changes) continue;
            else if (removeIds == true && (tag == "objektId" || tag == "fid")) continue;
            else if (this[tag] === null || this[tag] === undefined) continue;
            else if (CONFIG_WFS.QUERSCHNITT[tag].art == 0 || CONFIG_WFS.QUERSCHNITT[tag].art == 1) {
                // Kein Klartext
                r += '<' + tag + '>' + this[tag] + '</' + tag + '>\n';
            } else if (CONFIG_WFS.QUERSCHNITT[tag].art == 2) {
                // Klartext
                r += '<' + tag + ' xlink:href="' + this[tag] + '" typeName="' + CONFIG_WFS.QUERSCHNITT[tag].kt + '" />\n';
            }
        }

        r += '</Dotquer>\n';
        r += '</wfs:Insert>\n';
        return r;
    }

    private createAufbauDatenXML() {
        let r = '';
        if (this._aufbaudaten != null) {
            r += '<wfs:Insert>\n'

            for (let s in this._aufbaudaten) {
                //console.log(this._aufbaudaten[s]);
                r += this._aufbaudaten[s].createXML();
            }
            r += '</wfs:Insert>\n';

        }
        return r;
    }

    private createUpdateBreiteXML() {
        return super.createUpdateXML({
            breite: Math.round(this.breite),
            bisBreite: Math.round(this.bisBreite),
            XVstL: Math.round(this.XVstL * 100) / 100,
            XVstR: Math.round(this.XVstR * 100) / 100,
            XBstL: Math.round(this.XBstL * 100) / 100,
            XBstR: Math.round(this.XBstR * 100) / 100
        });
    }


    private updateArt(art: string, artober: string) {
        this.art = art;
        this.artober = artober;
        this._daten.vectorQuer.changed();

        PublicWFS.doTransaction(this.createUpdateXML({
            art: this.art,
            artober: this.artober
        }));
    }

    private updateArtEinzeln(art: string) {
        this.art = art;
        this._daten.vectorQuer.changed();

        PublicWFS.doTransaction(this.createUpdateXML({
            art: this.art,
        }));
    }

    private updateOberEinzeln(artober: string) {
        this.artober = artober;
        this._daten.vectorQuer.changed();
        PublicWFS.doTransaction(this.createUpdateXML({
            artober: this.artober
        }));
    }


    private editBreite(edit: string, diff: number, fit: boolean) {
        let gesStreifen = this.station.getStreifen(this.streifen);
        let nr = this.streifennr;

        let soap = this.createUpdateBreiteXML();

        if (fit) {
            // Anpassen
            if (this.streifen != 'M' && (this.streifennr + 1) in gesStreifen) {
                if (this.streifen == 'L')
                    gesStreifen[nr + 1]['X' + edit + 'R'] += diff;
                else if (this.streifen == 'R')
                    gesStreifen[nr + 1]['X' + edit + 'L'] += diff;
                gesStreifen[nr + 1]['breite'] =
                    Math.round(100 * (gesStreifen[nr + 1]['XVstR'] - gesStreifen[nr + 1]['XVstL']));
                gesStreifen[nr + 1]['bisBreite'] =
                    Math.round(100 * (gesStreifen[nr + 1]['XBstR'] - gesStreifen[nr + 1]['XBstL']));
                gesStreifen[nr + 1].createGeom();
                soap += gesStreifen[nr + 1].createUpdateBreiteXML();
            }
        } else {
            // Verschieben
            for (var nnr in gesStreifen) {
                if (Number(nnr) <= nr)
                    continue;
                gesStreifen[nnr]['X' + edit + 'L'] += diff;
                gesStreifen[nnr]['X' + edit + 'R'] += diff;
                gesStreifen[nnr].createGeom();
                soap += gesStreifen[nnr].createUpdateBreiteXML();
            }
        }
        this.createGeom();

        //console.log(soap);

        PublicWFS.doTransaction(soap, undefined, undefined);
    }

    public delete() {
        this._daten.vectorQuer.removeFeature(this)
        this._daten.vectorTrenn.removeFeature(this.trenn)
    }


    // Getter
    public getStation(): QuerStation {
        return this.station;
    }

    public getStreifennr(): number {
        return this.streifennr
    }
    public getArt(): string {
        return this.art;
    }
    public getArtober(): string {
        return this.artober;
    }
    public getXBstL(): number {
        return this.XBstL;
    }
    public getXBstR(): number {
        return this.XBstR;
    }
    public getXVstL(): number {
        return this.XVstL;
    }
    public getXVstR(): number {
        return this.XVstR;
    }
    public getBreite(): number {
        return this.breite;
    }
    public getBisBreite(): number {
        return this.bisBreite;
    }
    public getStreifen(): 'M' | 'L' | 'R' {
        return this.streifen;
    }


    //Setter
    public setStation(station: QuerStation) {
        this.station = station;
    }
    public setStreifen(streifen: 'M' | 'L' | 'R') {
        this.streifen = streifen;
    }

    public setStreifennr(streifennr: number) {
        this.streifennr = streifennr;
    }

    public setBreite(breite: number) {
        this.breite = breite;
    }

    public setBisBreite(bisBreite: number) {
        this.bisBreite = bisBreite;
    }

    public setArt(art: string) {
        this.art = art;
    }

    public setArtober(artober: string) {
        this.artober = artober;
    }

    public setXVstR(XVstR: number) {
        this.XVstR = XVstR;
    }

    public setXVstL(XVstL: number) {
        this.XVstL = XVstL;
    }

    public setXBstR(XBstR: number) {
        this.XBstR = XBstR;
    }

    public setXBstL(XBstL: number) {
        this.XBstL = XBstL;
    }

}