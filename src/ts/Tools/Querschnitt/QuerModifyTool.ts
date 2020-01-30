// SPDX-License-Identifier: GPL-3.0-or-later

import { Snap } from 'ol/interaction';
import { platformModifierKeyOnly, never } from 'ol/events/condition';
import QuerInfoTool from './QuerInfoTool';
import { Feature, MapBrowserEvent } from 'ol';
import Tool from '../prototypes/Tool';
import { SelectInteraction, ModifyInteraction } from '../../openLayers/Interaction'
import { ModifyEvent } from 'ol/interaction/Modify';
import Querschnitt from '../../Objekte/Querschnittsdaten';
import InfoTool from '../InfoTool';
import { MultiLineString, Point, LineString } from 'ol/geom';
import HTML from '../../HTML';
import KlartextManager from '../../Objekte/Klartext';
import Map from "../../openLayers/Map";
import "../../import_jquery.js";
import 'chosen-js';
import 'chosen-js/chosen.css';
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css'
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Circle, Style, Stroke, Fill } from 'ol/style';
import { FeatureLike } from 'ol/Feature';
import Vektor from '../../Vektor';
import PublicWFS from '../../PublicWFS';

/**
 * Funktion zum Verändern von Querschnittsflächen
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.10.29
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
    private multiArtSelect: HTMLSelectElement;
    private multiOberSelect: HTMLSelectElement;
    private moveTypeForm: HTMLFormElement;
    private modifyLayer: VectorLayer;
    private modifyOverlayLayer: VectorLayer;
    private sidebar: HTMLDivElement;

    constructor(map: Map, info: QuerInfoTool, sidebar: HTMLDivElement, layerTrenn: VectorLayer, layerQuer: VectorLayer, layerStation: VectorLayer) {
        super(map);
        this.info = info;
        this.sidebar = sidebar;

        this.createLinienSelect(layerTrenn);
        this.createFlaechenSelect(layerQuer);
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
                    color: 'rgba(50,50,50,0.5)', width: 3
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
        this.map.on("pointermove", this.mouseMove.bind(this))
        this.map.addLayer(this.modifyOverlayLayer)
    }

    private mouseMove(_: MapBrowserEvent) {
        this.modifyOverlayLayer.getSource().clear();

        let abs = this.calcAbstand()
        if (abs == null) return
        let seite = abs.querschnitt.getStreifen();
        if (seite == 'M') return;

        let abstVst = (abs.vstOrBst == 'Vst') ? abs.abstand : abs.querschnitt.getX('Vst', seite)
        let abstBst = (abs.vstOrBst == 'Bst') ? abs.abstand : abs.querschnitt.getX('Bst', seite)
        let diff2 = abstBst - abstVst

        let punkte = abs.querschnitt.getStation().getPunkte();

        let erster = punkte[0];
        let letzter = punkte[punkte.length - 1]

        let l = [];
        for (let i = 0; i < punkte.length; i++) {
            let pkt = punkte[i]
            let faktor = (pkt.vorherLaenge - erster.vorherLaenge) / (letzter.vorherLaenge - erster.vorherLaenge);
            let coord = Vektor.sum(pkt.pkt, Vektor.multi(pkt.seitlicherVektorAmPunkt, -(faktor * diff2 + abstVst)));
            if (isNaN(coord[0]) || isNaN(coord[1])) {
                console.log("Fehler: keine Koordinaten");
                continue;
            }
            l.push(coord);
        }
        this.modifyOverlayLayer.getSource().addFeature(new Feature(new LineString(l)));
    }

    calcAbstand() {
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
        let abstand = -Math.round((Vektor.skalar(Vektor.diff(point, pkt.pkt), pkt.seitlicherVektorAmPunkt)) / (Vektor.skalar(pkt.seitlicherVektorAmPunkt, pkt.seitlicherVektorAmPunkt)) * 100) / 100
        return { abstand: abstand, vstOrBst: vstOrBst, querschnitt: querschnitt }
    }

    private modifyEnd(_: ModifyEvent) {
        this.map.un("pointermove", this.mouseMove.bind(this));
        this.map.removeLayer(this.modifyOverlayLayer)

        // Abstand berechnen
        let abs = this.calcAbstand()
        if (!abs) return;

        // Mittelstreifen filtern
        let seite = abs.querschnitt.getStreifen();
        if (seite == 'M') {
            PublicWFS.showMessage("Mittelstreifen können nicht bearbeitet werden")
            return;
        }

        // Differenz bestimmen
        let diff = abs.abstand - abs.querschnitt.getX(abs.vstOrBst, seite)

        // alte Daten speichern für Vergleich, wenn angrenzender Querschnitt mitbewegt werden soll
        let alt_XBstR = abs.querschnitt.getXBstR();
        let alt_XBstL = abs.querschnitt.getXBstL();
        let alt_XVstR = abs.querschnitt.getXVstR();
        let alt_XVstL = abs.querschnitt.getXVstL();

        // Daten prüfen und bearbeiten 
        diff = this._check_and_edit_querschnitt(abs.querschnitt, diff, abs.vstOrBst, (abs.vstOrBst == "Vst" ? "breite" : "bisBreite"));

        if (document.forms.namedItem("modify").modify_glue.checked) {
            // VST, BST suchen und ändern
            if (abs.vstOrBst == "Vst") {
                let station = abs.querschnitt.getStation().getAbschnitt().getStationByBST(abs.querschnitt.getVst());
                if (station == null) return;
                let querschnitt_nachbar = station.getQuerschnittByBstAbstand(alt_XVstL, alt_XVstR);
                if (querschnitt_nachbar == null) return;
                this._check_and_edit_querschnitt(querschnitt_nachbar, diff, 'Bst', 'bisBreite')
            }
            //BST, VST suchen und ändern
            else {
                let station = abs.querschnitt.getStation().getAbschnitt().getStationByVST(abs.querschnitt.getBst());
                if (station == null) return;
                let querschnitt_nachbar = station.getQuerschnittByVstAbstand(alt_XBstL, alt_XBstR);
                if (querschnitt_nachbar == null) return;
                this._check_and_edit_querschnitt(querschnitt_nachbar, diff, 'Vst', 'breite')
            }
        }
        this.featureSelected()
        this.map.removeInteraction(this.snapStation);
    }

    _check_and_edit_querschnitt(querschnitt: Querschnitt, diff: number, Vst_or_Bst: 'Vst' | 'Bst', breite_or_bisBreite: 'breite' | 'bisBreite') {
        let streifen = querschnitt.getStreifen();
        let nr = querschnitt.getStreifennr();

        // Überschneidung mit nächsten 
        let next_quer = querschnitt.getStation().getQuerschnitt(streifen, nr + 1)
        if ((document.getElementById('modify_fit') as HTMLInputElement).checked && next_quer != undefined) {
            let max_diff = next_quer[breite_or_bisBreite] / 100;
            if (((streifen == 'L') ? (-diff) : (diff)) > max_diff) {
                diff = ((streifen == 'L') ? (-max_diff) : (max_diff));
            }
        }
        // negative Breiten verhindern
        if (((streifen == 'L') ? (diff) : (-diff)) * 100 > querschnitt[breite_or_bisBreite]) {
            diff = ((streifen == 'L') ? (querschnitt[breite_or_bisBreite]) : (-querschnitt[breite_or_bisBreite])) / 100;
        }
        querschnitt.setX(Vst_or_Bst, streifen as 'R' | 'L', querschnitt.getX(Vst_or_Bst, streifen as 'R' | 'L') + diff);
        querschnitt[breite_or_bisBreite] = Math.round(100 * (querschnitt.getX(Vst_or_Bst, 'R') - querschnitt.getX(Vst_or_Bst, 'L')));
        querschnitt.editBreiteOld(Vst_or_Bst, diff, (document.getElementById('modify_fit') as HTMLInputElement).checked);
        return diff;
    }

    private createLinienSelect(layerTrenn: VectorLayer) {
        this.selectLinien = new SelectInteraction({
            layers: [layerTrenn],
            condition: never,
            style: InfoTool.selectStyle
        });
        //this.selectLinien.on('select', this.linieSelected.bind(this));
    }

    private createFlaechenSelect(layerQuer: VectorLayer) {
        this.selectFlaechen = new SelectInteraction({
            layers: [layerQuer],
            toggleCondition: platformModifierKeyOnly,
            style: InfoTool.selectStyle
        });
        this.selectFlaechen.on('select', this.flaecheSelected.bind(this));
    }

    private flaecheSelected() {
        this.selectLinien.getFeatures().clear();
        let auswahl = this.selectFlaechen.getFeatures();
        auswahl.forEach((feat: Feature) => {
            this.selectLinien.getFeatures().push((feat as Querschnitt).trenn);
        })

        this.featureSelected();
    }

    private featureSelected() {
        let selection = this.selectFlaechen.getFeatures().getArray() as Querschnitt[];

        this.selectLinien.getFeatures().clear()
        this.modifyLayer.getSource().clear();

        this.selectFlaechen.getFeatures().forEach((feature: Feature) => {
            this.selectLinien.getFeatures().push((feature as Querschnitt).trenn)
        });

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
        console.log(art)
        for (let querschnitt of selection) {
            console.log(querschnitt.getArt());
            if (art != (querschnitt.getArt() ? querschnitt.getArt().getXlink() : null))
                art = null;
            if (ober != (querschnitt.getArtober() ? querschnitt.getArtober().getXlink() : null))
                ober = null;
            if (art == null && ober == null)
                break;
        }
        this.multiCountInput.value = selection.length.toString();
        $(this.multiArtSelect).val(art);
        $(this.multiOberSelect).val(ober);

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

    private updateMultiArt(): Promise<void> {
        let querschnitte = this.selectFlaechen.getFeatures().getArray() as Querschnitt[];
        let art = this.multiArtSelect.value;

        let tasks: Promise<any>[] = [];
        for (let querschnitt of querschnitte) {
            tasks.push(
                querschnitt.updateArtEinzeln(art)
            );
        }
        return Promise.all(tasks)
            .then(() => {
                PublicWFS.showMessage("Erfolgreich")
                Promise.resolve()
            })
            .catch(() => {
                PublicWFS.showMessage("Fehler", true)
                Promise.reject()
            });
    }


    private updateMultiOber(): Promise<void> {
        let querschnitte = this.selectFlaechen.getFeatures().getArray() as Querschnitt[];
        let artober = this.multiOberSelect.value;

        let tasks: Promise<any>[] = [];
        for (let querschnitt of querschnitte) {
            tasks.push(
                querschnitt.updateOberEinzeln(artober)
            );
        }
        return Promise.all(tasks)
            .then(() => {
                PublicWFS.showMessage("Erfolgreich")
                Promise.resolve()
            })
            .catch(() => {
                PublicWFS.showMessage("Fehler", true)
                Promise.reject()
            });
    }

    public start() {
        this.createMoveTypeForm();
        $(this.moveTypeForm).show("fast");
        this.map.addInteraction(this.selectLinien);
        this.map.addInteraction(this.selectFlaechen);
        this.map.addInteraction(this.modify);
        this.map.addInteraction(this.snapTrenn);

        if (this.multiEditForm = null) this.createMultiModForm();
    }

    stop() {
        $(this.moveTypeForm).hide("fast");
        this.info.hideInfoBox();
        this.map.removeInteraction(this.selectLinien);
        this.map.removeInteraction(this.selectFlaechen);
        this.map.removeInteraction(this.modify);
        this.map.removeInteraction(this.snapTrenn);
        this.map.removeInteraction(this.snapStation);

        $(this.multiEditForm).hide("hide");
    }
}