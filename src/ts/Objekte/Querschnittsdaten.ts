// SPDX-License-Identifier: GPL-3.0-or-later

import { Feature, Map } from 'ol';
import { Condition, never, singleClick } from 'ol/events/condition';
import { FeatureLike } from 'ol/Feature';
import { MultiLineString, Polygon } from 'ol/geom';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Text } from 'ol/style';
import Daten from '../Daten';
import HTML from '../HTML';
import Abschnitt from '../Objekte/Abschnitt';
import Aufbau from '../Objekte/Aufbaudaten';
import { SelectInteraction } from '../openLayers/Interaction';
import { VectorLayer } from '../openLayers/Layer';
import PublicWFS from '../PublicWFS';
import InfoTool, { InfoToolEditable } from '../Tools/InfoTool';
import Vektor from '../Vektor';
import Klartext from './Klartext';
import PrimaerObjekt from './prototypes/PrimaerObjekt';
import QuerStation from './QuerStation';

/**
 * Querschnittsdaten
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.04.22
 * @license GPL-3.0-or-later
*/
export default class Querschnitt extends PrimaerObjekt implements InfoToolEditable {
    private _aufbaudaten: Aufbau[] = null;
    public trenn: Feature<MultiLineString>;

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
    private hasSekObj: number = null;
    private static loadErControlCounter: number = 0;
    private static layerTrenn: VectorLayer;
    private static layerQuer: VectorLayer;
    private static selectFlaechen: SelectInteraction;
    private static selectLinien: SelectInteraction;
    private static selectLinienCondition: Condition = singleClick;
    private static selectFlaechenToggleCondition: Condition = never;
    private static selectLinienToggleCondition: Condition = never;

    constructor() {
        super();
        //console.log(daten);

        this.setGeometry(new Polygon([[[0, 0], [0, 0], [0, 0]]]));
        Querschnitt.getLayerFlaechen().getSource().addFeature(this)

        this.trenn = new Feature<MultiLineString>({ geom: new MultiLineString([[[0, 0], [0, 0], [0, 0]]]), objekt: this });
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

    static async _loadER_Callback(xml: Document): Promise<Querschnitt[]> {
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
            // Faktor 0.005 => cm -> m und Halbieren bei Mittelstreifen
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

    private static createFields(form: HTMLFormElement, __: string, querschnitt?: Querschnitt, changeable: boolean = false): Promise<any> {
        let div = document.createElement("div");
        if (querschnitt && querschnitt.getStation().hasAufbau()) {
            div.innerHTML = "Aufbaudaten vorhanden";
            div.style.color = "red";
        } else if (querschnitt) {
            div.innerHTML = "(Vllt.) keine Aufbaudaten";
            div.style.color = "green";
        }
        form.appendChild(div)
        form.appendChild(document.createElement("br"))

        // Art
        let art = Klartext.createKlartextSelectForm("Itquerart", form, "Art", "art", querschnitt != undefined ? querschnitt.art : undefined);
        $(art.select).prop('disabled', !changeable).trigger("chosen:updated");

        // Lage
        let lage = Klartext.createKlartextSelectForm("Itquerober", form, "Art der Oberfläche", "ober", querschnitt != undefined ? querschnitt.artober : undefined);
        $(lage.select).prop('disabled', !changeable).trigger("chosen:updated");

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

        return Promise.all([art.promise, lage.promise])
    }

    public getInfoForm(ziel: HTMLFormElement, changeable: boolean = false): Promise<void> {
        return Querschnitt.createFields(ziel, "info", this, changeable);
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
        if (this._aufbaudaten == null) { this._aufbaudaten = [] };
        if (schicht == undefined || aufbau == undefined) return;
        this._aufbaudaten[schicht] = aufbau;
    }

    public setAufbauGesamt(aufbau?: Aufbau[]) {
        if (aufbau)
            this._aufbaudaten = aufbau;
        else
            this._aufbaudaten = [];
    }

    public async getAufbau(): Promise<Aufbau[]> {
        if (!this._aufbaudaten) {
            console.log(this)
            if (!this.abschnitt) return []
            await this.station.getAufbauDaten();
            return this._aufbaudaten;
        } else {
            return this._aufbaudaten;
        }
    }

    private createGeom() {
        let g = [];
        let l = [];
        let r = [];

        if (this.XVstR == null) {
            console.log("keine X-Abstände")
            this.check();
            console.log(this)
        }

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
            if (pkt.vektorZumNaechsten)
                pkt.seitenFaktor = 1. / Math.sin(Vektor.winkel(pkt.seitlicherVektorAmPunkt, pkt.vektorZumNaechsten))
            let coord = Vektor.sum(pkt.getCoordinates(), Vektor.multi(pkt.seitlicherVektorAmPunkt, -(faktor * diff2 + abst2) * pkt.seitenFaktor));
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
            if (pkt.vektorZumNaechsten)
                pkt.seitenFaktor = 1. / Math.sin(Vektor.winkel(pkt.seitlicherVektorAmPunkt, pkt.vektorZumNaechsten))
            let coord = Vektor.sum(pkt.getCoordinates(), Vektor.multi(pkt.seitlicherVektorAmPunkt, -(faktor * diff1 + abst1) * pkt.seitenFaktor));
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

    private static createUpdateBreiteXML(querschnitte: Querschnitt[]) {
        let updates = "";
        console.log(querschnitte)
        for (let querschnitt of querschnitte) {
            updates += querschnitt.createUpdateBreiteXML();
        }
        console.log(updates)
        return updates;
    }

    public updateArtEinzeln(art: string): Promise<Document> {
        this.setArt(art);
        Querschnitt.getLayerFlaechen().getSource().changed();

        return PublicWFS.doTransaction(this.createUpdateXML({
            art: this.art,
        }));
    }

    public updateOberEinzeln(artober: string): Promise<Document> {
        this.setArtober(artober);
        Querschnitt.getLayerFlaechen().getSource().changed();
        return PublicWFS.doTransaction(this.createUpdateXML({
            artober: this.artober
        }));
    }

    public async changeAttributes(form: HTMLFormElement): Promise<any[]> {
        let changes: { [attribut: string]: any } = {}
        let artXlink = $(form).children().children("#art").val() as string
        if (!this.getArt() || artXlink != this.getArt().getXlink()) {
            this.setArt(artXlink as string)
            changes["art"] = artXlink
        }
        let oberXlink = $(form).children().children("#ober").val() as string
        if (!this.getArtober() || oberXlink != this.getArtober().getXlink()) {
            this.setArtober(oberXlink as string)
            changes["artober"] = oberXlink;
        }
        return Promise.all([
            PublicWFS.doTransaction(this.createUpdateXML(changes)),
            this.updateInfoBreite(form)
        ]);
    };

    private updateInfoBreite(form: HTMLFormElement): Promise<Document | void> {
        let breite_neu = Number($(form).find('#breite').val());
        let bisbreite_neu = Number($(form).find('#bisbreite').val());
        if (breite_neu != this.getBreite() || bisbreite_neu != this.getBisBreite()) {
            return this.editBreite(breite_neu, bisbreite_neu, (document.getElementById('modify_fit') as HTMLInputElement).checked, (document.getElementById('modify_glue') as HTMLInputElement).checked);
        }
        return Promise.resolve();
    }

    public editBreite(breiteVst: number, breiteBst: number, folgende_anpassen: boolean = false, angrenzende_mitziehen: boolean = false): Promise<Document> {
        // alle Transaktionen durchführen
        return PublicWFS.doTransaction(
            Querschnitt.createUpdateBreiteXML(
                this.checkAndEditBreitenEdit(breiteVst, breiteBst, folgende_anpassen, angrenzende_mitziehen)
            )
        );
    }

    private checkAndEditBreitenEdit(breiteVst: number, breiteBst: number, folgende_anpassen: boolean = false, angrenzende_mitziehen: boolean = false): Querschnitt[] {
        if (breiteVst < 0) breiteVst = 0;
        if (breiteBst < 0) breiteBst = 0;
        this.breite = Math.round(breiteVst);
        this.bisBreite = Math.round(breiteBst);
        let update: Querschnitt[] = [];

        // Variablen mit bisherigen Werten initialisieren = ohne Änderung => alter Wert
        let xvstr_neu = this.XVstR;
        let xbstr_neu = this.XBstR;
        let xvstl_neu = this.XVstL;
        let xbstl_neu = this.XBstL;

        if (this.streifen == "L") {
            xvstl_neu = this.XVstR - this.breite / 100
            xbstl_neu = this.XBstR - this.bisBreite / 100;
        } else if (this.streifen == "R") {
            xvstr_neu = this.XVstL + this.breite / 100;
            xbstr_neu = this.XBstL + this.bisBreite / 100;
        } else {
            // nur M0 möglich, daher halbe Breite = XVst bzw. XBst
            xvstr_neu = Math.round(this.breite / 2) / 100;
            xbstr_neu = Math.round(this.bisBreite / 2) / 100;
            xvstl_neu = -Math.round(this.breite / 2) / 100;
            xbstl_neu = -Math.round(this.bisBreite / 2) / 100;
        }

        // Differnz zum alten berechnen für Anpassung der folgenden Querschnitte
        let diffVstR = xvstr_neu - this.XVstR;
        let diffBstR = xbstr_neu - this.XBstR;
        let diffVstL = xvstl_neu - this.XVstL;
        let diffBstL = xbstl_neu - this.XBstL;

        // neue Position setzen
        this.XVstR = xvstr_neu
        this.XBstR = xbstr_neu
        this.XVstL = xvstl_neu
        this.XBstL = xbstl_neu

        console.log(this)

        // nachfolgende Querschnitte bearbeiten
        if (this.streifen == "L" || this.streifen == "M")
            update.push(...this.editNext("L", folgende_anpassen, diffVstL, diffBstL));
        if (this.streifen == "R" || this.streifen == "M")
            update.push(...this.editNext("R", folgende_anpassen, diffVstR, diffBstR));

        // Geometrie des Querschnittes neu zeichnen und Update-XML für this erzeugen
        this.createGeom();
        update.push(this);

        // angrenzende Querschnitte bearbeiten
        if (angrenzende_mitziehen)
            update.push(...this.angrenzendeMitziehen(folgende_anpassen, diffVstR, diffBstR, diffVstL, diffBstL));
        console.log(update)
        return update;
    }

    public static updateMultiBreite(querschnitte: Querschnitt[], breite?: number, bisBreite?: number): Promise<Document> {
        if (breite && breite < 0) breite = 0;
        if (bisBreite && bisBreite < 0) bisBreite = 0;

        let querschnitteNeu: Querschnitt[] = [];

        for (let querschnitt of querschnitte) {
            querschnitteNeu.push(...querschnitt.checkAndEditBreitenEdit(breite ?? querschnitt.getBreite(), bisBreite ?? querschnitt.getBisBreite()));
        }
        console.log(querschnitteNeu)
        let dupRem = {}
        let querNeuUnique = []
        for (let querschnitt of querschnitteNeu) {
            if (!(querschnitt.getObjektId() in dupRem)) {
                querNeuUnique.push(querschnitt);
                dupRem[querschnitt.getObjektId()] = true;
            }
        }

        return PublicWFS.doTransaction(Querschnitt.createUpdateBreiteXML(querNeuUnique))
    }

    private angrenzendeMitziehen(folgende_anpassen: boolean, diffVstR: number, diffBstR: number, diffVstL: number, diffBstL: number): Querschnitt[] {
        if (diffVstR == 0 && diffVstL == 0 && diffBstR == 0 && diffBstL == 0) return [];

        let querschnitt_nachbar: Querschnitt;
        let querschnitte: Querschnitt[] = [];

        if (diffVstR != 0 || diffVstL != 0) {
            // VST editiert
            let station = this.getStation().getAbschnitt().getStationByBST(this.getVst());
            if (station == null) return [];
            querschnitt_nachbar = station.getQuerschnittByBstAbstand(this.XVstL - diffVstL, this.XVstR - diffVstR);
            querschnitte.push(...this.berechneNachbarQuerschnitt(querschnitt_nachbar, diffBstL, diffBstR, diffVstL, diffVstR, folgende_anpassen));
        }

        if (diffBstR != 0 || diffBstL != 0) {
            // BST editiert
            let station = this.getStation().getAbschnitt().getStationByVST(this.getBst());
            if (station == null) return [];
            querschnitt_nachbar = station.getQuerschnittByVstAbstand(this.XBstL - diffBstL, this.XBstR - diffBstR);
            querschnitte.push(...this.berechneNachbarQuerschnitt(querschnitt_nachbar, diffBstL, diffBstR, diffVstL, diffVstR, folgende_anpassen));
        }

        return querschnitte;
    }

    private berechneNachbarQuerschnitt(querschnitt_nachbar: Querschnitt, diffBstL: number, diffBstR: number, diffVstL: number, diffVstR: number, folgende_anpassen: boolean) {
        let xvstl = querschnitt_nachbar.getXVstL() + diffBstL;
        let xvstr = querschnitt_nachbar.getXVstR() + diffBstR;
        let xbstl = querschnitt_nachbar.getXBstL() + diffVstL;
        let xbstr = querschnitt_nachbar.getXBstR() + diffVstR;

        let breiteVst = Math.round((xvstr - xvstl) * 100);
        let breiteBst = Math.round((xbstr - xbstl) * 100);

        return querschnitt_nachbar.checkAndEditBreitenEdit(breiteVst, breiteBst, folgende_anpassen, false);
    }

    private editNext(seite: "L" | "R", folgenden_anpassen: boolean = false, diffVst: number = 0, diffBst: number = 0): Querschnitt[] {
        let updates = []
        if (folgenden_anpassen) {
            //TODO: Es könnte passieren, dass eine Seite an die Grenze des nächsten kommt bei M-Streifen
            updates = this.folgendeQuerschnitteAnpassen(seite)
        } else {
            updates = this.folgendeQuerschnitteVerschieben(seite, diffVst, diffBst)
        }
        console.log(updates)
        return updates;
    }

    private folgendeQuerschnitteAnpassen(seite: "L" | "R"): Querschnitt[] {
        let naechster = this.getStation().getQuerschnitt(seite, this.streifennr + 1);
        if (naechster != null) {
            if (seite == "L") {
                // negative Breite verhindern
                if (this.XVstL < naechster.XVstL) this.XVstL = naechster.XVstL;
                if (this.XBstL < naechster.XBstL) this.XBstL = naechster.XBstL;

                // Linke Begrenzung als rechte des nächsten übernehmen
                naechster.XVstR = this.XVstL;
                naechster.XBstR = this.XBstL;
            } else if (seite == "R") {
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
            return [naechster];
        }
        return [];
    }

    private folgendeQuerschnitteVerschieben(seite: "L" | "R", diffVst: number, diffBst: number): Querschnitt[] {
        let update: Querschnitt[] = [];

        let i = this.streifennr;
        let naechster = null;
        while ((naechster = this.getStation().getQuerschnitt(seite, ++i)) != null) {
            naechster.verschieben(diffVst, diffBst);
            naechster.createGeom();
            update.push(naechster)
        }

        this.getStation().getStreifen(seite)
        return update;
    }

    private verschieben(diffVst: number, diffBst: number) {
        this.XVstL += diffVst;
        this.XVstR += diffVst;
        this.XBstR += diffBst;
        this.XBstL += diffBst;
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
                name: "Querschnitte (Bearbeitung)",
                switchable: true,
                source: new VectorSource(),
                style: createStyle
            });
        }
        if (map) map.addLayer(Querschnitt.layerQuer);
        return Querschnitt.layerQuer
    }

    static getSelectFlaechen(): SelectInteraction {
        if (!Querschnitt.selectFlaechen) {
            Querschnitt.selectFlaechen = new SelectInteraction({
                layers: [Querschnitt.getLayerFlaechen()],
                hitTolerance: 10,
                toggleCondition: (e) => Querschnitt.selectFlaechenToggleCondition(e),
                style: InfoTool.selectStyle
            });
            Querschnitt.selectFlaechen.on("select", () => {
                Querschnitt.getSelectLinien().getFeatures().clear();
                for (let select of Querschnitt.selectFlaechen.getFeatures().getArray()) {
                    Querschnitt.getSelectLinien().getFeatures().push((<Querschnitt>select).trenn);
                }
            })
        }
        return Querschnitt.selectFlaechen;
    }

    static getSelectLinien(): SelectInteraction {
        if (!Querschnitt.selectLinien) {
            Querschnitt.selectLinien = new SelectInteraction({
                layers: [Querschnitt.getLayerTrenn()],
                hitTolerance: 10,
                toggleCondition: (e) => Querschnitt.selectLinienToggleCondition(e),
                condition: (e) => Querschnitt.selectLinienCondition(e),
                style: InfoTool.selectStyle
            });
            Querschnitt.selectLinien.on("select", () => {
                Querschnitt.getSelectFlaechen().getFeatures().clear();
                for (let select of Querschnitt.selectLinien.getFeatures().getArray()) {
                    Querschnitt.getSelectFlaechen().getFeatures().push(select.get('objekt'));
                }
            })
        }
        return Querschnitt.selectLinien;
    }

    static setSelectLinienCondition(condition: Condition = singleClick) {
        Querschnitt.selectLinienCondition = condition;
    }

    static setSelectLinienToggleCondition(condition: Condition = never) {
        Querschnitt.selectLinienToggleCondition = condition;
    }

    static setSelectFlaechenToggleCondition(condition: Condition = never) {
        Querschnitt.selectFlaechenToggleCondition = condition;
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

    public getHasSekObj(): number {
        return this.hasSekObj;
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