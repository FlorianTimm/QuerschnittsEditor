/**
 * Aufstellvorrichtung
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */
import "../import_jquery.js";
import 'chosen-js';
import 'chosen-js/chosen.css';
import Daten from "../Daten";
import PublicWFS from '../PublicWFS';
import Abschnitt from './Abschnitt';
import Klartext, { KlartextMap } from './Klartext';
import PunktObjekt from './prototypes/PunktObjekt';
import Zeichen from './Zeichen';
import HTML from "../HTML";
import Dokument from "./Dokument";
import { InfoToolOverlay } from "../Tools/InfoTool.js";
import { Overlay, Map } from "ol";
import { Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import { ColorLike } from "ol/colorlike";
import { resolve } from "dns";

class Callback {
    callback: (zeichen: Zeichen[], ...args: any[]) => void;
    param: any[]
}

export default class Aufstellvorrichtung extends PunktObjekt implements InfoToolOverlay {
    static loadErControlCounter: number = 0;
    static layer: VectorLayer;

    private overlay: Overlay;
    private overlayShowing: boolean;
    private loadingZeichen: Promise<Zeichen[]>;
    private zeichen: Zeichen[] = null;
    private hasSekObj: number;
    private art: Klartext;

    getObjektKlassenName(): string {
        return "Otaufstvor";
    }

    public colorFunktion1(): ColorLike {
        if (this.hasSekObj > 0 || (this.zeichen != null && this.zeichen.length > 0)) {
            return 'rgba(250,120,0,0.8)';
        } else {
            return 'rgba(255,0,0,0.8)';
        }
    }

    public colorFunktion2(): ColorLike {
        return 'black';
    }

    static getLayer(map?: Map): VectorLayer {
        if (!Aufstellvorrichtung.layer) {
            Aufstellvorrichtung.layer = Aufstellvorrichtung.createLayer(map);
        }
        return Aufstellvorrichtung.layer;
    }

    private vzAddHTML(zeichen: Zeichen[], ziel: HTMLElement) {
        let div = document.createElement('div');
        div.style.marginTop = '5px';
        for (let eintrag of zeichen) {
            let img = document.createElement("img");
            img.style.height = "30px";
            Klartext.load("Itvzstvoznr").then(() => {
                img.src = "http://gv-srv-w00118:8080/schilder/" + eintrag.getStvoznr().getKt() + ".svg";
                img.title = eintrag.getStvoznr().getBeschreib() + (eintrag.getVztext() ?? '');
            });
            div.appendChild(img);
        }
        ziel.appendChild(div);
    }

    static loadER(): Promise<Aufstellvorrichtung[]> {
        let daten = Daten.getInstanz();
        let query = PublicWFS.doQuery('Otaufstvor', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></Filter>')
            .then((xml) => {
                return Aufstellvorrichtung.loadErCallback(xml)
            });
        return query;
    }

    static loadAbschnittER(abschnitt: Abschnitt): Promise<Document> {
        let query = PublicWFS.doQuery('Otaufstvor', '<Filter>' +
            '<And><PropertyIsEqualTo><PropertyName>abschnittId</PropertyName>' +
            '<Literal>' + abschnitt.getAbschnittid() + '</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + Daten.getInstanz().ereignisraum + '</Literal></PropertyIsEqualTo></And></Filter>');
        query.then((xml) => {
            new Promise((resolve) => {
                Aufstellvorrichtung.loadErCallback(xml)
                resolve(xml);
            });
        });
        return query;
    }

    public static loadErCallback(xml: XMLDocument): Promise<Aufstellvorrichtung[]> {
        let straus = xml.getElementsByTagName("Otaufstvor");
        let tasks: Promise<Aufstellvorrichtung>[] = []
        for (let i = 0; i < straus.length; i++) {
            tasks.push(Aufstellvorrichtung.fromXML(straus[i]).then((aufstell: Aufstellvorrichtung) => {
                Aufstellvorrichtung.getLayer().getSource().addFeature(aufstell);
                return aufstell;
            }))
        }
        return Promise.all(tasks)
    }

    public static fromXML(xml: Element): Promise<Aufstellvorrichtung> {
        let r = new Aufstellvorrichtung();
        return r.setDataFromXML(xml) as Promise<Aufstellvorrichtung>;
    }

    public getZeichen(): Promise<Zeichen[]> {
        if (this.zeichen == null && this.hasSekObj > 0) {
            return this.reloadZeichen();
        } else {
            return Promise.resolve(this.zeichen ?? []);
        }
    }

    public reloadZeichen(): Promise<Zeichen[]> {
        if (this.loadingZeichen) return this.loadingZeichen;
        this.loadingZeichen = PublicWFS.doQuery('Otvzeichlp', '<Filter>\n' +
            '  <PropertyIsEqualTo>\n' +
            '    <PropertyName>parent/@xlink:href</PropertyName>\n' +
            '    <Literal>' + this.fid + '</Literal>\n' +
            '  </PropertyIsEqualTo>\n' +
            '</Filter>').then((xml) => {
                return this.parseZeichen(xml)
            });
        return this.loadingZeichen;
    }

    private parseZeichen(xml: XMLDocument): Zeichen[] {
        let zeichen: Zeichen[] = [];
        let zeichenXML = xml.getElementsByTagName('Otvzeichlp');

        for (let i = 0; i < zeichenXML.length; i++) {
            let eintrag = zeichenXML.item(i);
            if (!(eintrag.getElementsByTagName("enr").length > 0)) {
                zeichen.push(Zeichen.fromXML(eintrag));
            }
        }
        this.zeichen = zeichen;
        if (this.hasSekObj == 0 && zeichen.length > 0) this.hasSekObj = 1
        this.loadingZeichen = undefined;
        return this.zeichen;
    }

    public static createForm(sidebar: HTMLDivElement, formId: string, aufstell?: Aufstellvorrichtung, changeable: boolean = false, showForm: boolean = true): HTMLFormElement {
        let form = HTML.createToolForm(sidebar, showForm, formId);
        Aufstellvorrichtung.createFields(form, aufstell, changeable);
        return form;
    }

    private static createFields(form: HTMLFormElement, aufstell?: Aufstellvorrichtung, changeable: boolean = false) {
        // Art
        let art = Klartext.createKlartextSelectForm("Itaufstvorart", form, "Art", "art", aufstell != undefined ? aufstell.art : undefined);
        $(art).prop('disabled', !changeable).trigger("chosen:updated");

        // Lage
        let lage = Klartext.createKlartextSelectForm("Itallglage", form, "Lage", "lage", aufstell != undefined ? aufstell.rlageVst : undefined);
        $(lage).prop('disabled', !changeable).trigger("chosen:updated");

        // Quelle
        let quelle = Klartext.createKlartextSelectForm("Itquelle", form, "Quelle", "quelle", aufstell != undefined ? aufstell.quelle : undefined);
        $(quelle).prop('disabled', !changeable).trigger("chosen:updated");

        // ext: Objektid
        let objektnr = HTML.createTextInput(form, "ext. Objektnummer", "extid", aufstell != undefined ? aufstell.objektnr : undefined);
        objektnr.disabled = !changeable;

        // VNK
        let vnk = HTML.createTextInput(form, "VNK", "vnk", aufstell != undefined ? aufstell.getAbschnitt().getVnk() : undefined);
        vnk.disabled = true;

        // NNK
        let nnk = HTML.createTextInput(form, "NNK", "nnk", aufstell != undefined ? aufstell.getAbschnitt().getNnk() : undefined);
        nnk.disabled = true;

        // Station
        let station = HTML.createTextInput(form, "Station", "station", aufstell != undefined ? aufstell.vst.toString() : undefined);
        station.disabled = true;

        // Abstand
        let abstTxt = "";
        if (aufstell != undefined) {
            if (aufstell.rabstbaVst >= 0.01) abstTxt = "R";
            else if (aufstell.rabstbaVst <= 0.01) abstTxt = "L";
            else abstTxt = "M";
            abstTxt += " " + Math.abs(aufstell.rabstbaVst);
        }
        let abstand = HTML.createTextInput(form, "Abstand", "abstand", abstTxt);
        abstand.disabled = true;

        if (aufstell != undefined) {
            let schilder = document.createElement("div");
            schilder.style.marginTop = "10px";
            form.appendChild(schilder);
            aufstell.getZeichen().then((zeichen) => { aufstell.vzAddHTML(zeichen, schilder) });
            aufstell.getDokumente().then((doks: Dokument[]) => { aufstell.dokuAdd(doks, form) });
        }
    }

    private dokuAdd(doku: Dokument[], ziel: HTMLElement) {
        if (doku.length == 0) return;
        let button = document.createElement('input');
        button.type = "button";
        button.value = "Dokumente anzeigen";
        ziel.appendChild(button);

        button.addEventListener("click", this.showDokuPopup.bind(this))
    }

    private showDokuPopup(__: Event) {
        this.getDokumente()
            .then((doks: Dokument[]) => {
                Klartext.load("Itdokart")
                    .then(() => {
                        let dialog = document.createElement("table");
                        dialog.className = "tableWithBorder"
                        for (let dok of doks) {
                            dialog.innerHTML += "<tr><td>" + dok.getArt().getBeschreib() + "</td><td>" + dok.getBeschreib();
                            dialog.innerHTML += "</td><td>" + dok.getPfad() + "</td></tr>"
                        }
                        document.body.appendChild(dialog);
                        let jqueryDialog = $(dialog).dialog({
                            resizable: false,
                            height: "auto",
                            title: "Dokumente",
                            width: 600,
                            modal: true,
                            buttons: {
                                /* "Speichern": () => {
                                     jqueryDialog.dialog("close");
                                 },*/
                                "Schließen": function () {
                                    jqueryDialog.dialog("close");
                                }
                            }
                        });
                    })
            });
    }

    public getInfoForm(ziel: HTMLFormElement, changeable: boolean = false): void {
        Aufstellvorrichtung.createFields(ziel, this, changeable);
    }

    public changeAttributes(form: HTMLFormElement): void {
        this.setArt($(form).find("#art").children("option:selected").val() as string);
        this.setRlageVst($(form).find("#lage").children("option:selected").val() as string);
        this.setQuelle($(form).find("#quelle").children("option:selected").val() as string);
        this.setObjektnr($(form).find("#extid").val() as string);

        let xml = this.createUpdateXML({
            'art/@xlink:href': this.getArt(),
            'rlageVst/@xlink:href': this.getRlageVst(),
            'quelle/@xlink:href': this.getQuelle(),
            'objektnr': this.getObjektnr(),
        });
        PublicWFS.doTransaction(xml);
    }

    // Getter
    public getArt(): Klartext {
        return this.art;
    }

    public getVabstVst(): number {
        return this.vabstVst;
    }

    public getRlageVst(): Klartext {
        return this.rlageVst;
    }

    // Setter
    public setArt(art: Klartext | string) {
        if (art instanceof Klartext)
            this.art = art;
        else {
            this.art = Klartext.get("Itaufstvorart", art)
        }
    }

    public setRlageVst(rlageVst: Klartext | string) {
        if (rlageVst instanceof Klartext)
            this.rlageVst = rlageVst;
        else {
            this.rlageVst = Klartext.get("Itallglage", rlageVst)
        }
    }


    public showOverlay(map: Map) {
        this.overlayShowing = true;
        this.getZeichen().then((zeichen: Zeichen[]) => { this.generateOverlay(zeichen, map) })
    }

    private generateOverlay(alleZeichen: Zeichen[], map: Map) {
        if (!this.overlayShowing) return;
        let abschnitt = this.getAbschnitt()
        let winkel = abschnitt.getWinkel(this.getVst());

        let zeichenListe = alleZeichen.sort(function (a: Zeichen, b: Zeichen) {
            if (a.getSort() > b.getSort()) return 1;
            if (a.getSort() < b.getSort()) return -1
            return 0;
        })

        let max = 0;
        let zeichenL: { [richtung: number]: Zeichen[] } = {}
        for (let z of zeichenListe) {
            let r = z.getLesbarkeit() ? z.getLesbarkeit().getKt() : '03';
            if (r == '05') r = '03';
            if (r == '00') r = '03';
            if (!(r in zeichenL)) zeichenL[r] = []
            zeichenL[r].push(z);
            if (max < zeichenL[r].length) max = zeichenL[r].length
        }

        let groesse = max * 40 + 30

        let canvas = document.createElement("canvas")
        canvas.addEventListener("click", () => {
            this.hideOverlay(map)
        });
        let ctx = canvas.getContext('2d')
        canvas.height = groesse * 2;
        canvas.width = groesse * 2;
        ctx.fillStyle = "#ffffff";
        ctx.translate(groesse, groesse);
        ctx.rotate(winkel)

        ctx.save();


        let faktoren = { '01': 0, '02': 2, '03': 1, '04': 3 };
        if (this.getVabstVst() < 0) faktoren = { '01': 0, '02': 2, '03': 3, '04': 1 }


        for (let r in zeichenL) {
            ctx.restore();
            ctx.save()
            ctx.rotate(faktoren[r] * 0.5 * Math.PI)

            let liste = zeichenL[r];
            ctx.beginPath()
            ctx.strokeStyle = "#444444";
            ctx.lineWidth = 4;
            ctx.moveTo(0, 0)
            ctx.lineTo(0, - 40 * liste.length)
            ctx.stroke()

            for (let j = 0; j < liste.length; j++) {

                let zeichen = liste[j]
                let img = new Image();
                if (zeichen.getArt().getKt() == '02') {
                    ctx.fillRect(-25, -20 - 40 * (liste.length - j), 50, 40);
                }
                img.src = '../schilder/' + zeichen.getStvoznr().getKt() + '.svg';
                img.addEventListener("load", function () {
                    ctx.restore();
                    ctx.save()
                    ctx.rotate(faktoren[r] * 0.5 * Math.PI)
                    let hoehe = 40;
                    let breite = 40 * img.width / img.height
                    if (breite > 40) {
                        breite = 40;
                        hoehe = 40 * img.height / img.width
                    }
                    ctx.drawImage(img, - breite / 2, (40 - hoehe) / 2 - 20 - 40 * (liste.length - j), breite, hoehe);
                });
            }
        }

        document.getElementById("sidebar").appendChild(canvas);

        this.overlay = new Overlay({
            position: (this.getGeometry() as Point).getCoordinates(),
            element: canvas,
            offset: [-groesse, -groesse],
            autoPan: true,
            stopEvent: false
        });
        map.addOverlay(this.overlay)
    }

    hideOverlay(map: Map) {
        this.overlayShowing = false;
        if (!this.overlay) return;
        map.removeOverlay(this.overlay);
    }
};

