import { Feature, Map } from 'ol';
import { MultiLineString, Polygon } from 'ol/geom';
import Daten from '../Daten';
import Abschnitt from '../Objekte/Abschnitt';
import Aufbau from '../Objekte/Aufbaudaten';
import PublicWFS from '../PublicWFS';
import Vektor from '../Vektor';
import QuerStation from './QuerStation';
import Klartext from './Klartext';
import HTML from '../HTML';
import { InfoToolEditable } from '../Tools/InfoTool';
import PrimaerObjekt from './prototypes/PrimaerObjekt';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, Text, Fill } from 'ol/style';
import { FeatureLike } from 'ol/Feature';

/**
* @author Florian Timm, LGV HH 
* @version 2019.11.15
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
    private blpart: Klartext = null;
    private blpartnull: Klartext = null;
    private uipart: Klartext = null;
    private uipartnull: Klartext = null;
    private XVstL: number = null;
    private XVstR: number = null;
    private XBstL: number = null;
    private XBstR: number = null;
    private streifen: 'M' | 'L' | 'R' = null;
    private streifennr: number = null;
    static loadErControlCounter: number = 0;
    static layerTrenn: VectorLayer;
    static layerQuer: VectorLayer;

    constructor() {
        super();
        this._daten = Daten.getInstanz();
        //console.log(daten);

        this.setGeometry(new Polygon([[[0, 0], [0, 0], [0, 0]]]));
        Querschnitt.getLayerFlaechen().getSource().addFeature(this)

        this.trenn = new Feature({ geom: new MultiLineString([[[0, 0], [0, 0], [0, 0]]]), objekt: this });
        Querschnitt.getLayerTrenn().getSource().addFeature(this.trenn);
    }

    getObjektKlassenName(): string {
        return "Dotquer"
    }

    static async loadER(): Promise<Querschnitt[]> {
        let daten = Daten.getInstanz();
        const xml = await PublicWFS.doQuery('Dotquer', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></Filter>');
        return Querschnitt._loadER_Callback(xml);
    }

    static async loadAbschnittER(abschnitt: Abschnitt): Promise<Querschnitt[]> {
        let daten = Daten.getInstanz();
        const xml = await PublicWFS.doQuery('Dotquer', '<Filter>' +
            '<And><PropertyIsEqualTo><PropertyName>abschnittId</PropertyName>' +
            '<Literal>' + abschnitt.getAbschnittid() + '</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></And></Filter>');
        return Querschnitt._loadER_Callback(xml);
    }

    static _loadER_Callback(xml: Document): Promise<Querschnitt[]> {
        let dotquer = xml.getElementsByTagName("Dotquer");
        let tasks: Promise<Querschnitt>[] = [];
        for (let i = 0; i < dotquer.length; i++) {
            Querschnitt.loadErControlCounter += 1
            tasks.push(Querschnitt.fromXML(dotquer[i], undefined));
        }
        return Promise.all(tasks);
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
        let art = Klartext.createKlartextSelectForm("Itquerart", form, "Art", "art", querschnitt != undefined ? querschnitt.art : undefined);
        $(art).prop('disabled', !changeable).trigger("chosen:updated");

        // Lage
        let lage = Klartext.createKlartextSelectForm("Itquerober", form, "Lage", "ober", querschnitt != undefined ? querschnitt.artober : undefined);
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

    static async fromXML(xml: Element, doNotAdd: boolean = false): Promise<Querschnitt> {
        let r = new Querschnitt();
        r.setDataFromXML(xml)

        if (doNotAdd) return Promise.resolve(r);  // Abbruch, falls nur die Daten geparst werden sollen

        let abschnitt = await Abschnitt.getAbschnitt(r.abschnittId);
        abschnitt.addOKinER('Querschnitt');
        r.abschnitt = abschnitt;
        if (!(r.abschnitt.existsStation(r.vst))) {
            r.station = new QuerStation(r.abschnitt, r.vst, r.bst);
        }
        else {
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

    public async getAufbau(): Promise<{ [schicht: number]: Aufbau }> {
        if (!this._aufbaudaten) {
            await this.abschnitt.getAufbauDaten();
            return this._aufbaudaten;
        } else {
            return Promise.resolve(this._aufbaudaten);
        }
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
        Querschnitt.getLayerFlaechen().getSource().changed();

        PublicWFS.doTransaction(this.createUpdateXML({
            art: this.art,
        }));
    }

    public updateOberEinzeln(artober: string) {
        this.setArtober(artober);
        Querschnitt.getLayerFlaechen().getSource().changed();
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

    public editBreiteOld(edit: 'Vst' | 'Bst', diff: number, fit: boolean): Promise<Document> {
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

        return PublicWFS.doTransaction(soap);
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
        Querschnitt.getLayerFlaechen().getSource().removeFeature(this)
        Querschnitt.getLayerTrenn().getSource().removeFeature(this.trenn)
    }

    public static getLayerTrenn(map?: Map) {
        if (!Querschnitt.layerTrenn) {
            this.layerTrenn = new VectorLayer({
                source: new VectorSource(),
                opacity: 0.6,
                style: new Style({
                    stroke: new Stroke({
                        color: '#00dd00',
                        width: 2
                    })
                })
            });
        }
        if (map) map.addLayer(Querschnitt.layerTrenn);
        return Querschnitt.layerTrenn
    }

    public static getLayerFlaechen(map?: Map) {
        if (!Querschnitt.layerQuer) {
            let createStyle = function (feature: FeatureLike, resolution: number): Style {
                let kt_art = (feature as Querschnitt).getArt()
                let kt_ober = (feature as Querschnitt).getArtober()

                // leere Arten filtern
                let art = 0
                if (kt_art)
                    art = Number(kt_art.getKt());

                // leere Oberflächen filtern
                let ober = 0
                if (kt_ober)
                    ober = Number(kt_ober.getKt());

                // Farbe für Querschnittsfläche
                let color = [255, 255, 255];

                if ((art >= 100 && art <= 110) || (art >= 113 && art <= 119) || (art >= 122 && art <= 161) || (art >= 163 && art <= 179) || art == 312)
                    color = [33, 33, 33];	// Fahrstreifen
                else if (art == 111)
                    color = [66, 66, 66]; // 1. Überholfahrstreifen
                else if (art == 112)
                    color = [100, 100, 100]; // 2. Überholfahrstreifen
                else if (art >= 180 && art <= 183)
                    color = [50, 50, 100];	// Parkstreifen
                else if (art >= 940 && art <= 942)
                    color = [0xF9, 0x14, 0xB8]; // Busanlagen
                else if (art == 210) color = [0x22, 0x22, 0xff];	// Gehweg
                else if ((art >= 240 && art <= 243) || art == 162)
                    color = [0x33, 0x33, 0x66];	// Radweg
                else if (art == 250 || art == 251)
                    color = [0xcc, 0x22, 0xcc];	// Fuß-Rad-Weg
                else if (art == 220)
                    color = [0xff, 0xdd, 0x00];	// paralleler Wirtschaftsweg
                else if (art == 420 || art == 430 || art == 900)
                    color = [0xff, 0xff, 0xff];	// Markierungen
                else if (art == 310 || art == 311 || art == 313 || art == 320 || art == 330 || (art >= 910 && art <= 916))
                    color = [0xee, 0xee, 0xee];	// Trenn-, Schutzstreifen und Schwellen
                else if (art == 120 || art == 121)
                    color = [0x1F, 0x22, 0x97];	// Rinne
                else if (art == 301)
                    color = [0x75, 0x9F, 0x1E];	// Banket
                else if (art == 510 || art == 511 || art == 520)
                    color = [0x12, 0x0a, 0x8f];	// Gräben und Mulden
                else if (art == 700 || art == 710)
                    color = [0x00, 0x44, 0x00];	// Böschungen
                else if (art == 314 || art == 315)
                    color = [0x8A, 0x60, 0xD8];	// Inseln
                else if (art == 400 || art == 410 || art == 715)
                    color = [0x8A, 0x60, 0xD8];	// Randstreifen und Sichtflächen
                else if (art == 600 || art == 610 || art == 620 || art == 630 || art == 640)
                    color = [0xC1, 0xBA, 0xC8];	// Borde und Kantsteine
                else if (art == 340)
                    color = [0, 0, 0];	// Gleiskörper
                else if (art == 999)
                    color = [0x88, 0x88, 0x88];	// Bestandsachse
                else if (art == 990 || art == 720)
                    color = [0xFC, 0x8A, 0x57];	// sonstige Streifenart

                color.push(0.4);

                return new Style({
                    fill: new Fill({
                        color: color
                    }),
                    text: new Text({
                        font: '12px Calibri,sans-serif',
                        fill: new Fill({ color: '#000' }),
                        stroke: new Stroke({
                            color: '#fff', width: 2
                        }),
                        text: ((resolution < 0.05) ? (art + " - " + ober) : '')
                    })
                })
            }

            Querschnitt.layerQuer = new VectorLayer({
                source: new VectorSource(),
                style: createStyle
            });
        }
        if (map) map.addLayer(Querschnitt.layerQuer);
        return Querschnitt.layerQuer
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