// SPDX-License-Identifier: GPL-3.0-or-later

import "../../import_jquery.js";
import 'chosen-js';
import 'chosen-js/chosen.css';
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css';
import { Feature, MapBrowserEvent } from 'ol';
import { EventsKey } from 'ol/events';
import { click, never, platformModifierKeyOnly } from 'ol/events/condition';
import { FeatureLike } from 'ol/Feature';
import { LineString, MultiLineString, Point } from 'ol/geom';
import { Snap } from 'ol/interaction';
import { ModifyEvent } from 'ol/interaction/Modify';
import VectorLayer from 'ol/layer/Vector';
import { unByKey } from 'ol/Observable';
import VectorSource from 'ol/source/Vector';
import { Circle, Fill, Stroke, Style } from 'ol/style';
import HTML from '../../HTML';
import KlartextManager from '../../Objekte/Klartext';
import Querschnitt from '../../Objekte/Querschnittsdaten';
import { ModifyInteraction, SelectInteraction } from '../../openLayers/Interaction';
import Map from "../../openLayers/Map";
import PublicWFS from '../../PublicWFS';
import Vektor from '../../Vektor';
import Tool from '../prototypes/Tool';
import QuerInfoTool from './QuerInfoTool';

/**
 * Funktion zum Verändern von Querschnittsflächen
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.04.22
 * @license GPL-3.0-or-later
*/
export default class QuerModifyTool extends Tool {
    private info: QuerInfoTool;
    private modify: ModifyInteraction;
    private selectLinien: SelectInteraction;
    private selectFlaechen: SelectInteraction;
    private snapTrenn: Snap;
    private snapStation: Snap;
    private multiEditForm: HTMLFormElement;
    private multiCountInput: HTMLInputElement;
    private multiBreite: HTMLInputElement;
    private multiBisBreite: HTMLInputElement;
    private multiBreiteButton: HTMLInputElement;
    private multiArtSelect: HTMLSelectElement;
    private multiOberSelect: HTMLSelectElement;
    private moveTypeForm: HTMLFormElement;
    private modifyLayer: VectorLayer;
    private modifyOverlayLayer: VectorLayer;
    private sidebar: HTMLDivElement;
    private pointermove: EventsKey;
    private selectEventsKey: EventsKey;

    constructor(map: Map, info: QuerInfoTool, sidebar: HTMLDivElement, layerTrenn: VectorLayer, layerStation: VectorLayer) {
        super(map);
        this.info = info;
        this.sidebar = sidebar;

        this.selectLinien = Querschnitt.getSelectLinien();
        this.selectFlaechen = Querschnitt.getSelectFlaechen();
        this.createModify();
        this.createSnap(layerTrenn, layerStation);
    };

    private createMoveTypeForm() {
        if (this.moveTypeForm) return;
        this.moveTypeForm = HTML.createToolForm(this.sidebar, false, 'modify');
        this.moveTypeForm.innerHTML += "Nachfolgende Querschnitte:";
        HTML.createBreak(this.moveTypeForm);
        let radio = HTML.createFormGroup(this.moveTypeForm);
        let verschieben = HTML.createRadio(radio, "typ", "move", "modify_move", "...verschieben");
        verschieben.checked = true;
        HTML.createBreak(radio);
        HTML.createRadio(radio, "typ", "fit", "modify_fit", "...anpassen");
        HTML.createBreak(this.moveTypeForm);
        HTML.createCheckbox(this.moveTypeForm, "modify_glue", "modify_glue", "angrenzende Querschnitte mitziehen");
    }

    private createMultiModForm() {
        if (this.multiEditForm) return;
        this.multiEditForm = HTML.createToolForm(this.sidebar, false, "qsMultiMod");

        this.multiBreite = HTML.createNumberInput(this.multiEditForm, "Breite", "qsmm_breite");
        this.multiBisBreite = HTML.createNumberInput(this.multiEditForm, "Bis Breite", "qsmm_bisBreite");

        $(this.multiBreite).on("change", this.updateMultiBreite.bind(this))
        $(this.multiBisBreite).on("change", this.updateMultiBisBreite.bind(this))

        let art = KlartextManager.createKlartextSelectForm("Itquerart", this.multiEditForm, "Art", 'qsmm_art', undefined, "- verschiedene -")
        this.multiArtSelect = art.select;

        let ober = KlartextManager.createKlartextSelectForm("Itquerober", this.multiEditForm, "Art der Oberfläche", 'qsmm_ober', undefined, "- verschiedene -")
        this.multiOberSelect = ober.select;

        this.multiCountInput = HTML.createNumberInput(this.multiEditForm, "Anzahl", "qsmm_anzahl");
        this.multiCountInput.disabled = true;

        Promise.all([ober.promise, art.promise]).then(() => {
            $(this.multiArtSelect).on("change", this.updateMultiArt.bind(this));
            $(this.multiOberSelect).on("change", this.updateMultiOber.bind(this));
        });
    }




    private createModify() {
        this.modifyLayer = new VectorLayer({
            source: new VectorSource(),
            style: function (feat: FeatureLike) {
                let color = 'green';
                if (feat.get("st") && feat.get("st") == "Bst")
                    color = 'red';
                return new Style({
                    image: new Circle({
                        radius: 5,
                        fill: new Fill({ color: color }),
                        stroke: new Stroke({
                            color: 'rgba(50,50,50,0.5)', width: 1
                        })
                    })
                })
            }
        });
        this.map.addLayer(this.modifyLayer)

        this.modifyOverlayLayer = new VectorLayer({
            source: new VectorSource(),
            style: new Style({
                stroke: new Stroke({
                    color: 'rgba(255,255,0,0.7)', width: 3
                })
            })
        });

        this.modify = new ModifyInteraction({
            deleteCondition: never,
            insertVertexCondition: never,
            source: this.modifyLayer.getSource()
        });
        this.modify.on('modifystart', this.modifyStart.bind(this));
        this.modify.on('modifyend', this.modifyEnd.bind(this));
        this.modify.on('change', console.log)
    }

    private modifyStart(_: ModifyEvent) {
        this.map.addInteraction(this.snapStation);
        this.pointermove = this.map.on("pointermove", this.mouseMove.bind(this))
        this.map.addLayer(this.modifyOverlayLayer)
    }

    private mouseMove(_: MapBrowserEvent) {
        this.modifyOverlayLayer.getSource().clear();

        let abs = this.calcAbstand()
        if (abs == null) return
        let seite = abs.querschnitt.getStreifen();
        if (seite == 'M') {
            this.makeVorschauLinie(abs, 'R', Math.abs(abs.abstand));
            this.makeVorschauLinie(abs, 'L', - Math.abs(abs.abstand))
        } else {
            this.makeVorschauLinie(abs, seite);
        };
    }

    private makeVorschauLinie(abs: { abstand: number, vstOrBst: 'Vst' | 'Bst', querschnitt: Querschnitt }, seite: 'L' | 'R', abstand: number = abs.abstand) {
        let abstVst = (abs.vstOrBst == 'Vst') ? abstand : abs.querschnitt.getX('Vst', seite)
        let abstBst = (abs.vstOrBst == 'Bst') ? abstand : abs.querschnitt.getX('Bst', seite)
        let diff2 = abstBst - abstVst

        let punkte = abs.querschnitt.getStation().getPunkte();

        let erster = punkte[0];
        let letzter = punkte[punkte.length - 1]

        let l = [];
        for (let i = 0; i < punkte.length; i++) {
            let pkt = punkte[i]
            let faktor = (pkt.vorherLaenge - erster.vorherLaenge) / (letzter.vorherLaenge - erster.vorherLaenge);
            if (pkt.vektorZumNaechsten)
                pkt.seitenFaktor = 1. / Math.sin(Vektor.winkel(pkt.seitlicherVektorAmPunkt, pkt.vektorZumNaechsten))
            let coord = Vektor.sum(pkt.getCoordinates(), Vektor.multi(pkt.seitlicherVektorAmPunkt, -(faktor * diff2 + abstVst) * pkt.seitenFaktor));
            if (isNaN(coord[0]) || isNaN(coord[1])) {
                console.log("Fehler: keine Koordinaten");
                continue;
            }
            l.push(coord);
        }
        this.modifyOverlayLayer.getSource().addFeature(new Feature(new LineString(l)));
    }

    calcAbstand(): { abstand: number, vstOrBst: 'Vst' | 'Bst', querschnitt: Querschnitt } {
        let querschnitt = this.selectFlaechen.getFeatures().item(0) as Querschnitt;
        if (querschnitt == null) return null;
        let pkt_segment = querschnitt.getStation().getPunkte();
        let pkt_karte = this.modifyLayer.getSource().getFeatures();

        // Feststellen ob VST oder BST bearbeitet wurden
        let vstOrBst: 'Vst' | 'Bst';
        let point: number[];
        for (let feat of pkt_karte) {
            let neu = (feat.getGeometry() as Point).getCoordinates();
            let x = feat.get('x');
            let y = feat.get('y');
            if (neu[0] != x || neu[1] != y) {
                vstOrBst = feat.get("st")
                point = neu;
                break;
            }
        }
        if (!vstOrBst || !point) return null;

        // Achspunkt für Abstandberechnung bestimmen
        let pkt = pkt_segment[(vstOrBst == 'Vst') ? 0 : (pkt_segment.length - 1)]

        // Abstand berechnen
        let abstand = -Math.round((Vektor.skalar(Vektor.diff(point, pkt.getCoordinates()), pkt.seitlicherVektorAmPunkt)) / (Vektor.skalar(pkt.seitlicherVektorAmPunkt, pkt.seitlicherVektorAmPunkt)) * 100) / 100
        return { abstand: abstand, vstOrBst: vstOrBst, querschnitt: querschnitt }
    }

    private modifyEnd(_: ModifyEvent) {
        unByKey(this.pointermove)
        this.map.removeLayer(this.modifyOverlayLayer)

        // Abstand berechnen
        let abs = this.calcAbstand()
        if (!abs) return;

        // Differenz bestimmen
        //let diff = abs.abstand - abs.querschnitt.getX(abs.vstOrBst, abs.abstand > 0 ? "R" : "L")
        let neueBreite;
        if (abs.querschnitt.getStreifen() == "M") {
            neueBreite = 2 * Math.abs(abs.abstand);
        } else if (abs.abstand >= 0) {
            // neuer Punkt liegt rechts oder mittig
            neueBreite = abs.abstand - abs.querschnitt.getX(abs.vstOrBst, "L")
        } else {
            // neuer Punkt liegt links
            neueBreite = abs.querschnitt.getX(abs.vstOrBst, "R") - abs.abstand;
        }

        // in cm umwandeln und runden
        neueBreite = Math.round(neueBreite * 100);

        // negative Breiten verhindern
        if (neueBreite < 0) neueBreite = 0;

        let vstBreite = (abs.vstOrBst == "Vst" ? neueBreite : abs.querschnitt.getBreite());
        let bstBreite = (abs.vstOrBst == "Vst" ? abs.querschnitt.getBisBreite() : neueBreite);

        abs.querschnitt.editBreite(vstBreite, bstBreite, document.forms.namedItem("modify").modify_fit.checked, document.forms.namedItem("modify").modify_glue.checked)

        this.featureSelected()
        this.map.removeInteraction(this.snapStation);
    }

    private featureSelected() {
        let selection = this.selectFlaechen.getFeatures().getArray() as Querschnitt[];

        this.modifyLayer.getSource().clear();

        if (selection.length == 1) {
            this.singleSelect();
        } else if (selection.length > 1) {
            this.multiSelect(selection);
        } else {
            this.info.hideInfoBox();
            this.setModifyActive(false);
            $(this.moveTypeForm).show("fast");
            $(this.multiEditForm).hide("fast");
        }
    }

    private singleSelect() {
        console.log("singleSelect")
        $(this.multiEditForm).hide("fast");
        $(this.moveTypeForm).show("fast");

        this.setModifyActive(true);
        this.info.featureSelect(this.selectFlaechen, true);

        let linien = this.selectLinien.getFeatures().item(0).getGeometry() as MultiLineString;

        for (let linie of linien.getCoordinates()) {
            this.modifyLayer.getSource().addFeature(new Feature({
                geometry: new Point(linie[0]),
                st: "Vst",
                x: linie[0][0],
                y: linie[0][1]
            }));
            this.modifyLayer.getSource().addFeature(new Feature({
                geometry: new Point(linie[linie.length - 1]),
                st: "Bst",
                x: linie[linie.length - 1][0],
                y: linie[linie.length - 1][1]
            }));
        }
    }

    private multiSelect(selection: Querschnitt[]) {
        console.log("multiSelect")
        this.createMultiModForm();
        this.info.hideInfoBox();
        this.setModifyActive(false);
        $(this.moveTypeForm).hide("fast");

        let art = selection[0].getArt() ? selection[0].getArt().getXlink() : null;
        let ober = selection[0].getArtober() ? selection[0].getArtober().getXlink() : null;
        let breite = selection[0].getBreite();
        let bisBreite = selection[0].getBisBreite();
        for (let querschnitt of selection) {
            if (art != (querschnitt.getArt() ? querschnitt.getArt().getXlink() : null))
                art = null;
            if (ober != (querschnitt.getArtober() ? querschnitt.getArtober().getXlink() : null))
                ober = null;
            if (breite != querschnitt.getBreite())
                breite = null;
            if (bisBreite != querschnitt.getBisBreite())
                bisBreite = null;
            if (art == null && ober == null && breite == null && bisBreite == null)
                break;
        }

        this.multiCountInput.value = selection.length.toString();
        $(this.multiArtSelect).val(art);
        $(this.multiOberSelect).val(ober);
        $(this.multiBreite).val(breite);
        $(this.multiBisBreite).val(bisBreite);

        $(this.multiArtSelect).trigger("chosen:updated");
        $(this.multiOberSelect).trigger("chosen:updated");

        $(this.multiEditForm).show("fast");
    }

    private setModifyActive(status: boolean) {
        this.snapStation.setActive(status);
        this.snapTrenn.setActive(status);
        this.modify.setActive(status);
    }

    private createSnap(layerTrenn: VectorLayer, layerStation: VectorLayer) {
        this.snapTrenn = new Snap({
            source: layerTrenn.getSource(),
            edge: false
        });
        this.snapStation = new Snap({
            source: layerStation.getSource(),
            pixelTolerance: 100,
            vertex: false
        });
    }

    private async updateMultiBreite() {
        let breite = parseInt(this.multiBreite.value);
        this.updateMultiVonUndBisBreite(breite, undefined)
    }

    private async updateMultiBisBreite() {
        let bisbreite = parseInt(this.multiBisBreite.value);
        this.updateMultiVonUndBisBreite(undefined, bisbreite)
    }

    private async updateMultiVonUndBisBreite(breite?: number, bisbreite?: number) {
        try {
            await Querschnitt.updateMultiBreite(this.selectFlaechen.getFeatures().getArray() as Querschnitt[], breite, bisbreite);
            PublicWFS.showMessage("Erfolgreich");
            Promise.resolve();
        } catch (e) {
            PublicWFS.showMessage("Fehler", true);
            Promise.reject();
        }
    }

    private async updateMultiArt(): Promise<void> {
        let querschnitte = this.selectFlaechen.getFeatures().getArray() as Querschnitt[];
        let art = this.multiArtSelect.value;

        let tasks: Promise<any>[] = [];
        for (let querschnitt of querschnitte) {
            tasks.push(
                querschnitt.updateArtEinzeln(art)
            );
        }
        try {
            await Promise.all(tasks);
            PublicWFS.showMessage("Erfolgreich");
            Promise.resolve();
        } catch (e) {
            PublicWFS.showMessage("Fehler", true);
            Promise.reject();
        }
    }


    private async updateMultiOber(): Promise<void> {
        let querschnitte = this.selectFlaechen.getFeatures().getArray() as Querschnitt[];
        let artober = this.multiOberSelect.value;

        let tasks: Promise<any>[] = [];
        for (let querschnitt of querschnitte) {
            tasks.push(
                querschnitt.updateOberEinzeln(artober)
            );
        }
        try {
            await Promise.all(tasks);
            PublicWFS.showMessage("Erfolgreich");
            Promise.resolve();
        } catch (e) {
            PublicWFS.showMessage("Fehler", true);
            Promise.reject();
        }
    }

    public start() {
        Querschnitt.setSelectLinienCondition(never);
        Querschnitt.setSelectFlaechenToggleCondition(platformModifierKeyOnly);
        this.createMoveTypeForm();
        $(this.moveTypeForm).show("fast");
        this.map.addInteraction(this.selectLinien);
        this.map.addInteraction(this.selectFlaechen);
        this.map.addInteraction(this.modify);
        this.map.addInteraction(this.snapTrenn);

        if (this.multiEditForm = null) this.createMultiModForm();

        this.selectEventsKey = this.selectFlaechen.on('select', this.featureSelected.bind(this));
        this.featureSelected()
    }

    stop() {
        Querschnitt.setSelectLinienCondition();
        Querschnitt.setSelectFlaechenToggleCondition();
        unByKey(this.selectEventsKey)

        if (this.selectFlaechen.getFeatures().getLength() > 1) {
            this.selectFlaechen.getFeatures().clear();
            this.selectLinien.getFeatures().clear();
        }

        $(this.moveTypeForm).hide("fast");
        this.info.hideInfoBox();
        this.map.removeInteraction(this.selectLinien);
        this.map.removeInteraction(this.selectFlaechen);
        this.map.removeInteraction(this.modify);
        this.map.removeInteraction(this.snapTrenn);
        this.map.removeInteraction(this.snapStation);
        this.modifyLayer.getSource().clear();
        $(this.multiEditForm).hide("hide");
    }
}