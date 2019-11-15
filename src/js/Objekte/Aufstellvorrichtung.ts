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
import OverlayPositioning from "ol/OverlayPositioning";

class Callback {
    callback: (zeichen: Zeichen[], ...args: any[]) => void;
    param: any[]
}

export default class Aufstellvorrichtung extends PunktObjekt implements InfoToolOverlay {
    static loadErControlCounter: number = 0;
    private overlay: Overlay;
    private overlayShowing: boolean;
    private loadingZeichen: boolean;
    private loadingZeichenCallback: Callback[] = [];

    getWFSKonfigName(): string {
        return "AUFSTELL";
    }
    private zeichen: Zeichen[] = null;
    private hasSekObj: number;
    private art: Klartext;

    public colorFunktion1(): import("ol/colorlike").ColorLike {
        if (this.hasSekObj > 0 || (this.zeichen != null && this.zeichen.length > 0)) {
            return 'rgba(250,120,0,0.8)';
        } else {
            return 'rgba(255,0,0,0.8)';
        }
    }

    public colorFunktion2(): import("ol/colorlike").ColorLike {
        return 'black';
    }

    getObjektKlassenName(): string {
        return "Otaufstvor";
    }

    private vzAddHTML(zeichen: Zeichen[], ziel: HTMLElement) {
        let div = document.createElement('div');
        div.style.marginTop = '5px';
        for (let eintrag of zeichen) {
            let img = document.createElement("img");
            img.style.height = "30px";
            Klartext.load("Itvzstvoznr", function (_: KlartextMap) {
                img.src = "http://gv-srv-w00118:8080/schilder/" + eintrag.getStvoznr().getKt() + ".svg";
                img.title = eintrag.getStvoznr().getBeschreib() + (eintrag.getVztext() ?? '');
            });
            div.appendChild(img);
        }
        ziel.appendChild(div);
    }

    static loadER(callback?: (...args: any[]) => void, ...args: any[]) {
        let daten = Daten.getInstanz();
        PublicWFS.doQuery('Otaufstvor', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></Filter>', Aufstellvorrichtung.loadErCallback, undefined, callback, ...args);
    }

    static loadAbschnittER(abschnitt: Abschnitt, callback?: (...args: any[]) => void, ...args: any[]) {
        PublicWFS.doQuery('Otaufstvor', '<Filter>' +
            '<And><PropertyIsEqualTo><PropertyName>abschnittId</PropertyName>' +
            '<Literal>' + abschnitt.getAbschnittid() + '</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + Daten.getInstanz().ereignisraum + '</Literal></PropertyIsEqualTo></And></Filter>', Aufstellvorrichtung.loadErCallback, undefined, callback, ...args);
    }

    public static loadErCallback(xml: XMLDocument, callback?: (...args: any[]) => void, ...args: any[]) {
        let straus = xml.getElementsByTagName("Otaufstvor");
        for (let i = 0; i < straus.length; i++) {
            Aufstellvorrichtung.loadErControlCounter += 1
            let f = Aufstellvorrichtung.fromXML(straus[i], Aufstellvorrichtung.loadErControlCallback, callback, ...args);
            Daten.getInstanz().layerAufstell.getSource().addFeature(f);
        }
        if (straus.length == 0) Aufstellvorrichtung.loadErControlCheck(callback, ...args)
    }

    private static loadErControlCallback(callback?: (...args: any[]) => void, ...args: any[]) {
        Aufstellvorrichtung.loadErControlCounter -= 1
        Aufstellvorrichtung.loadErControlCheck(callback, ...args)
    }

    private static loadErControlCheck(callback?: (...args: any[]) => void, ...args: any[]) {
        if (Aufstellvorrichtung.loadErControlCounter > 0) return;
        if (callback) callback(...args)
    }

    public static fromXML(xml: Element, callback?: (...args: any[]) => void, ...args: any[]) {
        let r = new Aufstellvorrichtung();
        r.setDataFromXML(xml, callback, ...args);
        return r;
    }

    public getZeichen(callback: (zeichen: Zeichen[], ...args: any[]) => void, ...args: any[]): void;
    public getZeichen(): Zeichen[];
    public getZeichen(callback?: (zeichen: Zeichen[], ...args: any[]) => void, ...args: any[]): void | Zeichen[] {
        if (callback != undefined && this.zeichen == null && this.hasSekObj > 0) {
            this.reloadZeichen(callback, ...args);
            return;
        } else if (this.hasSekObj > 0) {
            if (callback) callback(this.zeichen, ...args);
            else return this.zeichen ?? [];
        } else {
            return [];
        }
    }

    public reloadZeichen(callback?: (zeichen: Zeichen[], ...args: any[]) => void, ...args: any[]) {
        if (callback) {
            if (!this.loadingZeichenCallback) this.loadingZeichenCallback = [];
            this.loadingZeichenCallback.push({ callback: callback, param: args })

        }
        if (this.loadingZeichen) return;
        this.loadingZeichen = true;
        PublicWFS.doQuery('Otvzeichlp', '<Filter>\n' +
            '  <PropertyIsEqualTo>\n' +
            '    <PropertyName>parent/@xlink:href</PropertyName>\n' +
            '    <Literal>' + this.fid + '</Literal>\n' +
            '  </PropertyIsEqualTo>\n' +
            '</Filter>', this.parseZeichen.bind(this));
    }

    private parseZeichen(xml: XMLDocument) {
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
        if (this.loadingZeichenCallback == undefined || this.loadingZeichenCallback.length == 0)
            return;
        let callback: Callback;
        while (callback = this.loadingZeichenCallback.pop()) {
            callback.callback(this.zeichen, ...callback.param);
        }
    }

    public static createForm(formId: string, aufstell?: Aufstellvorrichtung, changeable: boolean = false, showForm: boolean = true): HTMLFormElement {
        let sidebar = document.getElementById("sidebar");
        let form = HTML.createToolForm(sidebar, showForm, formId);

        // Art
        Aufstellvorrichtung.createFields(form, aufstell, changeable);

        return form;
    }



    private static createFields(form: HTMLFormElement, aufstell?: Aufstellvorrichtung, changeable: boolean = false) {
        console.log(aufstell)
        // Art
        let art = Klartext.createKlartextSelectForm("Itaufstvorart", form, "Art", "art", aufstell != undefined ? aufstell.art.getXlink() : undefined);
        $(art).prop('disabled', !changeable).trigger("chosen:updated");

        // Lage
        let lage = Klartext.createKlartextSelectForm("Itallglage", form, "Lage", "lage", aufstell != undefined ? aufstell.rlageVst.getXlink() : undefined);
        $(lage).prop('disabled', !changeable).trigger("chosen:updated");

        // Quelle
        let quelle = Klartext.createKlartextSelectForm("Itquelle", form, "Quelle", "quelle", aufstell != undefined ? aufstell.quelle.getXlink() : undefined);
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
            aufstell.getZeichen(aufstell.vzAddHTML.bind(aufstell), schilder);

            aufstell.getDokumente(aufstell.dokuAdd.bind(aufstell), form);
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
        this.getDokumente(function (this: Aufstellvorrichtung, doks: Dokument[]) {
            let dialog = document.createElement("table");
            dialog.className = "tableWithBorder"
            for (let dok of doks) {
                dialog.innerHTML += "<tr><td>" + dok.getBeschreib() + "</td><td>" + dok.getPfad() + "</td></tr>"
            }
            document.body.appendChild(dialog);
            let jqueryDialog = $(dialog).dialog({
                resizable: false,
                height: "auto",
                title: "Dokumente",
                width: 400,
                modal: true,
                buttons: {
                    /* "Speichern": function (this: Aufstellvorrichtung) {
                         jqueryDialog.dialog("close");
                     }.bind(this),*/
                    Cancel: function () {
                        jqueryDialog.dialog("close");
                    }
                }
            });
        }.bind(this));
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
        this.getZeichen(this.generateOverlay.bind(this), map)
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
        canvas.addEventListener("click",
            function (this: Aufstellvorrichtung) {
                this.hideOverlay(map)
            }.bind(this));
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

