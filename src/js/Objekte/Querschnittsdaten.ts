import { Feature } from 'ol';
import { MultiLineString, Polygon } from 'ol/geom';
import Daten from '../Daten';
import Abschnitt from '../Objekte/Abschnitt';
import Aufbau from '../Objekte/Aufbaudaten';
import PublicWFS from '../PublicWFS';
import Vektor from '../Vektor';
import QuerStation from './QuerStation';
import Klartext, { KlartextMap } from './Klartext';
import HTML from '../HTML';
import { InfoToolEditable } from '../Tools/InfoTool';
import PrimaerObjekt from './prototypes/PrimaerObjekt';
import WaitBlocker from '../WaitBlocker';

/**
* @author Florian Timm, LGV HH 
* @version 2019.10.29
* @copyright MIT
*/


export default class Querschnitt extends PrimaerObjekt implements InfoToolEditable {
    private _daten: Daten;
    private _aufbaudaten: { [schicht: number]: Aufbau } = null;

    trenn: Feature;

    // SIB-Attribute
    private station: QuerStation = null;
    private art: Klartext = null;
    private artober: Klartext = null;
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
    static loadErControlCounter: number = 0;

    constructor() {
        super();
        this._daten = Daten.getInstanz();
        //console.log(daten);

        this.setGeometry(new Polygon([[[0, 0], [0, 0], [0, 0]]]));
        this._daten.vectorQuer.addFeature(this)

        this.trenn = new Feature({ geom: new MultiLineString([[[0, 0], [0, 0], [0, 0]]]), objekt: this });
        this._daten.vectorTrenn.addFeature(this.trenn);
    }

    getWFSKonfigName(): string {
        return "QUERSCHNITT"
    }

    getObjektKlassenName(): string {
        return "Dotquer"
    }

    static loadER(callback?: (...args: any[]) => void, ...args: any[]) {
        let daten = Daten.getInstanz();
        PublicWFS.doQuery('Dotquer', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></Filter>', Querschnitt._loadER_Callback, undefined, callback, ...args);
    }

    static loadAbschnittER(abschnitt: Abschnitt, callback: (...args: any[]) => void, ...args: any[]) {
        let daten = Daten.getInstanz();
        PublicWFS.doQuery('Dotquer', '<Filter>' +
            '<And><PropertyIsEqualTo><PropertyName>abschnittId</PropertyName>' +
            '<Literal>' + abschnitt.getAbschnittid() + '</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></And></Filter>', Querschnitt._loadER_Callback, undefined, callback, ...args);
    }

    static _loadER_Callback(xml: Document, callback: (...args: any[]) => void, ...args: any[]) {
        let dotquer = xml.getElementsByTagName("Dotquer");
        let liste: Querschnitt[] = [];
        for (let i = 0; i < dotquer.length; i++) {
            Querschnitt.loadErControlCounter += 1
            liste.push(Querschnitt.fromXML(dotquer[i], undefined, Querschnitt.loadErControlCallback, callback, ...args));
        }
        if (dotquer.length == 0) Querschnitt.loadErControlCheck(callback, ...args)
    }

    private static loadErControlCallback(callback?: (...args: any[]) => void, ...args: any[]) {
        Querschnitt.loadErControlCounter -= 1
        Querschnitt.loadErControlCheck(callback, ...args)
    }

    private static loadErControlCheck(callback?: (...args: any[]) => void, ...args: any[]) {
        if (Querschnitt.loadErControlCounter > 0) return;
        if (callback) callback(...args)
    }

    static checkQuerschnitte(liste: Querschnitt[]) {
        liste.forEach(function (querschnitt: Querschnitt) {
            querschnitt.check()
        })
    }

    public check() {
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

    private static createFields(form: HTMLFormElement, __: string, querschnitt?: Querschnitt, changeable: boolean = false) {
        // Art
        let art = Klartext.createKlartextSelectForm("Itquerart", form, "Art", "art", querschnitt != undefined ? querschnitt.art.getXlink() : undefined);
        $(art).prop('disabled', !changeable).trigger("chosen:updated");

        // Lage
        let lage = Klartext.createKlartextSelectForm("Itquerober", form, "Lage", "ober", querschnitt != undefined ? querschnitt.artober.getXlink() : undefined);
        $(lage).prop('disabled', !changeable).trigger("chosen:updated");

        // Breite
        let breite = HTML.createNumberInput(form, "Von Breite", "breite", querschnitt != undefined ? querschnitt.breite.toString() : undefined);
        breite.step = '1';
        breite.max = '5000';
        breite.min = '0'
        breite.disabled = !changeable;

        // BisBreite
        let bisbreite = HTML.createNumberInput(form, "Bis Breite", "bisbreite", querschnitt != undefined ? querschnitt.bisBreite.toString() : undefined);
        bisbreite.step = '1';
        bisbreite.max = '5000';
        bisbreite.min = '0'
        bisbreite.disabled = !changeable;

        // VNK
        let vnk = HTML.createTextInput(form, "VNK", "vnk", querschnitt != undefined ? querschnitt.getAbschnitt().getVnk() : undefined);
        vnk.disabled = true;

        // NNK
        let nnk = HTML.createTextInput(form, "NNK", "nnk", querschnitt != undefined ? querschnitt.getAbschnitt().getNnk() : undefined);
        nnk.disabled = true;

        // Station
        let station = HTML.createTextInput(form, "Station", "station", querschnitt != undefined ? querschnitt.vst + ' - ' + querschnitt.bst : undefined);
        station.disabled = true;

        // Streifen
        let streifen = HTML.createTextInput(form, "Streifen", "streifen", querschnitt != undefined ? querschnitt.streifen + ' ' + querschnitt.streifennr : undefined);
        streifen.disabled = true;
    }

    public getInfoForm(ziel: HTMLFormElement, changeable: boolean = false): void {
        Querschnitt.createFields(ziel, "info", this, changeable);
    }

    static fromXML(xml: Element, doNotAdd: boolean = false, callback?: (...args: any[]) => void, ...args: any[]) {
        let r = new Querschnitt();
        r.setDataFromXML(xml)

        if (doNotAdd) return r;  // Abbruch, falls nur die Daten geparst werden sollen

        Abschnitt.getAbschnitt(r.abschnittId, function (abschnitt: Abschnitt, r: Querschnitt) {
            abschnitt.addOKinER('Querschnitt');
            r.abschnitt = abschnitt;

            if (!(r.abschnitt.existsStation(r.vst))) {
                r.station = new QuerStation(r.abschnitt, r.vst, r.bst);
            } else {
                r.station = r.abschnitt.getStation(r.vst);
            }
            r.station.addQuerschnitt(r);
            r.createGeom();

            if (callback) callback(...args)
        }, r);


        //console.log(abschnitt);


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

        let punkte = this.station.getPunkte();

        let erster = punkte[0];
        let letzter = punkte[punkte.length - 1]

        for (let i = 0; i < punkte.length; i++) {
            let pkt = punkte[i]
            let faktor = (pkt.vorherLaenge - erster.vorherLaenge) / (letzter.vorherLaenge - erster.vorherLaenge);
            let coord = Vektor.sum(pkt.pkt, Vektor.multi(pkt.seitlicherVektorAmPunkt, -(faktor * diff2 + abst2)));
            if (isNaN(coord[0]) || isNaN(coord[1])) {
                console.log("Fehler: keine Koordinaten");
                continue;
            }
            g.push(coord);
            l.push(coord);
        }


        for (let i = punkte.length - 1; i >= 0; i--) {
            let pkt = punkte[i]
            let faktor = (pkt.vorherLaenge - erster.vorherLaenge) / (letzter.vorherLaenge - erster.vorherLaenge);
            let coord = Vektor.sum(pkt.pkt, Vektor.multi(pkt.seitlicherVektorAmPunkt, -(faktor * diff1 + abst1)));
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
        this.setGeometry(new Polygon([g])) //setCoordinates([g])*/
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

    public updateArtEinzeln(art: string) {
        this.setArt(art);
        this._daten.vectorQuer.changed();

        PublicWFS.doTransaction(this.createUpdateXML({
            art: this.art,
        }));
    }

    public updateOberEinzeln(artober: string) {
        this.setArtober(artober);
        this._daten.vectorQuer.changed();
        PublicWFS.doTransaction(this.createUpdateXML({
            artober: this.artober
        }));
    }

    public changeAttributes(form: HTMLFormElement) {
        let changes: { [attribut: string]: any } = {}
        let artXlink = $(form).children().children("#art").val() as string
        if (artXlink != this.getArt().getXlink()) {
            this.setArt(artXlink as string)
            changes["art"] = artXlink
        }
        let oberXlink = $(form).children().children("#ober").val() as string
        if (oberXlink != this.getArtober().getXlink()) {
            this.setArtober(oberXlink as string)
            changes["artober"] = oberXlink;
        }
        PublicWFS.doTransaction(this.createUpdateXML(changes));
        this.updateInfoBreite(form);
    };

    private updateInfoBreite(form: HTMLFormElement) {
        let breite_neu = Number($(form).find('#breite').val());
        let bisbreite_neu = Number($(form).find('#bisbreite').val());
        if (breite_neu != this.getBreite() || bisbreite_neu != this.getBisBreite()) {
            this.editBreite(breite_neu, bisbreite_neu, (document.getElementById('modify_fit') as HTMLInputElement).checked);
        }
    }

    private editBreite(breiteVst: number, breiteBst: number, folgenden_anpassen: boolean = false) {
        let diffVst = 0
        let diffBst = 0
        if (breiteVst < 0) breiteVst = 0;
        if (breiteBst < 0) breiteBst = 0;
        this.breite = breiteVst;
        this.bisBreite = breiteBst;

        if (this.streifen == "L") {
            let xvstl_neu = this.XVstR - this.breite / 100
            let xbstl_neu = this.XBstR - this.bisBreite / 100;
            diffVst = xvstl_neu - this.XVstL;
            diffBst = xbstl_neu - this.XBstL;
            this.XVstL = xvstl_neu
            this.XBstL = xbstl_neu
        } else if (this.streifen == "R") {
            let xvstr_neu = this.XVstL + this.breite / 100;
            let xbstr_neu = this.XBstL + this.bisBreite / 100;
            diffVst = xvstr_neu - this.XVstR;
            diffBst = xbstr_neu - this.XBstR;
            this.XVstR = xvstr_neu
            this.XBstR = xbstr_neu
        }

        this.editNext(folgenden_anpassen, diffVst, diffBst);
    }

    private editNext(folgenden_anpassen: boolean = false, diffVst: number = 0, diffBst: number = 0) {
        if (folgenden_anpassen) {
            this.folgendeAnpassen()
        } else {
            this.folgendeVerschieben(diffVst, diffBst)
        }
    }

    private folgendeAnpassen() {
        let update = "";
        let naechster = this.getStation().getQuerschnitt(this.streifen, this.streifennr + 1);
        if (naechster != null) {
            if (this.streifen == "L") {
                // negative Breite verhindern
                if (this.XVstL < naechster.XVstL) this.XVstL = naechster.XVstL;
                if (this.XBstL < naechster.XBstL) this.XBstL = naechster.XBstL;

                // Linke Begrenzung als rechte des nächsten übernehmen
                naechster.XVstR = this.XVstL;
                naechster.XBstR = this.XBstL;
            } else if (this.streifen == "R") {
                // negative Breite verhindern
                if (this.XVstR > naechster.XVstR) this.XVstR = naechster.XVstR;
                if (this.XBstR > naechster.XBstR) this.XBstR = naechster.XBstR;

                // Rechte Begrenzung als linke des nächsten übernehmen
                naechster.XVstL = this.XVstR;
                naechster.XBstL = this.XBstR;
            }
            // Breite berechnen
            naechster.breite = Math.abs(Math.round((naechster.XVstL - naechster.XVstR) * 100));
            naechster.bisBreite = Math.abs(Math.round((naechster.XBstL - naechster.XBstR) * 100));

            naechster.createGeom();
            update += naechster.createUpdateBreiteXML();

        }
        update += this.createUpdateBreiteXML();
        this.createGeom();
        PublicWFS.doTransaction(update);
    }

    private folgendeVerschieben(diffVst: number, diffBst: number) {
        let update = this.createUpdateBreiteXML();
        this.createGeom();

        let i = this.streifennr;
        let naechster = null;
        while ((naechster = this.getStation().getQuerschnitt(this.streifen, ++i)) != null) {
            console.log(naechster);
            naechster.verschieben(diffVst, diffBst);
            naechster.createGeom();
            update += naechster.createUpdateBreiteXML();
        }
        update += this.createUpdateBreiteXML();
        this.createGeom();

        this.getStation().getStreifen(this.streifen)
        PublicWFS.doTransaction(update);
    }

    private verschieben(diffVst: number, diffBst: number) {
        this.XVstL += diffVst;
        this.XVstR += diffVst;
        this.XBstR += diffBst;
        this.XBstL += diffBst;
    }

    /*let max_diff_vst = null;
    let max_diff_bst = null;
    if ((document.getElementById('modify_fit') as HTMLInputElement).checked && this.station.getQuerschnitt(this.streifen, this.streifennr + 1) != null) {
        max_diff_vst = this.station.getQuerschnitt(this.streifen, this.streifennr + 1).getBreite() / 100;
        max_diff_bst = this.station.getQuerschnitt(this.streifen, this.streifennr + 1).getBisBreite() / 100;
    }

    if (this.breite != Number($(form).find('breite').val())) {
        let diff = (Math.round(Number($(form).find('breite').val())) - this.getBreite()) / 100;

        if (max_diff_vst !== null && diff > max_diff_vst) {
            diff = (max_diff_vst);
        }
        this.setBreite(this.getBreite() + diff * 100);
        if (this.getStreifen() == 'L') {
            this.setXVstL(this.getXVstL() - diff);
            this.editBreite('Vst', -diff, (document.getElementById('modify_fit') as HTMLInputElement).checked);
        }
        else if (this.getStreifen() == 'R') {
            this.setXVstR(this.getXVstL() + diff);
            this.editBreite('Vst', diff, (document.getElementById('modify_fit') as HTMLInputElement).checked);
        }

    }
    else if (this.getBisBreite() != Number(($(form).find('bisbreite').val()))) {
        let diff = (Math.round(Number($(form).find('bisbreite').val())) - this.getBisBreite()) / 100;
        if (max_diff_bst !== null && diff > max_diff_bst) {
            diff = (max_diff_bst);
        }
        this.setBisBreite(this.getBisBreite() + diff * 100);
        if (this.getStreifen() == 'L') {
            this.setXBstL(this.getXBstL() - diff);
            this.editBreite('Bst', -diff, (document.getElementById('modify_fit') as HTMLInputElement).checked);
        }
        else if (this.getStreifen() == 'R') {
            this.setXBstR(this.getXBstR() + diff);
            this.editBreite('Bst', diff, (document.getElementById('modify_fit') as HTMLInputElement).checked);
        }
    }
    console.log(this)
}

*/
    public editBreiteOld(edit: 'Vst' | 'Bst', diff: number, fit: boolean) {
        let gesStreifen = this.station.getStreifen(this.streifen);
        let nr = this.streifennr;

        let soap = this.createUpdateBreiteXML();

        if (fit) {
            // Anpassen
            if (this.streifen != 'M' && (this.streifennr + 1) in gesStreifen) {
                if (this.streifen == 'L')
                    gesStreifen[nr + 1].setX(edit, 'R', gesStreifen[nr + 1].getX(edit, 'R') + diff);
                else if (this.streifen == 'R')
                    gesStreifen[nr + 1].setX(edit, 'L', gesStreifen[nr + 1].getX(edit, 'L') + diff);
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
                gesStreifen[nnr].setX(edit, 'L', gesStreifen[nnr].getX(edit, 'L') + diff);
                gesStreifen[nnr].setX(edit, 'R', gesStreifen[nnr].getX(edit, 'R') + diff);
                gesStreifen[nnr].createGeom();
                soap += gesStreifen[nnr].createUpdateBreiteXML();
            }
        }
        this.createGeom();

        //console.log(soap);

        PublicWFS.doTransaction(soap, undefined, undefined);
    }
    /**
     * setz die Attribute XVstL, XBstL, XVstR, XBstL
     */
    public setX(vstOrBst: 'Vst' | 'Bst', lMOderR: 'L' | 'R', value: number): void {
        if (vstOrBst == 'Vst') {
            if (lMOderR == 'L') this.setXVstL(value);
            else if (lMOderR == 'R') this.setXVstR(value);
        } else {
            if (lMOderR == 'L') this.setXBstL(value);
            else if (lMOderR == 'R') this.setXBstR(value);
        }
    }

    /**
     * liest die Attribute XVstL, XBstL, XVstR, XBstL
     */
    public getX(vstOrBst: 'Vst' | 'Bst', lMOderR: 'L' | 'R'): number {
        if (vstOrBst == 'Vst') {
            if (lMOderR == 'L') return this.getXVstL();
            else if (lMOderR == 'R') return this.getXVstR();
        } else {
            if (lMOderR == 'L') return this.getXBstL();
            else if (lMOderR == 'R') return this.getXBstR();
        }
        return 0;
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
    public getArt(): Klartext {
        return this.art;
    }

    public getArtober(): Klartext {
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

    public setArt(art: Klartext | string) {
        this.art = Klartext.get("Itquerart", art);
    }

    public setArtober(artober: Klartext | string) {
        this.artober = Klartext.get("Itquerober", artober);
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