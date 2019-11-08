import { Snap } from 'ol/interaction';
import Vektor from '../../Vektor';
import { platformModifierKeyOnly, never } from 'ol/events/condition';
import QuerInfoTool from './QuerInfoTool';
import Daten from '../../Daten';
import { Map, Feature, MapBrowserEvent } from 'ol';
import Tool from '../prototypes/Tool';
import { SelectInteraction, ModifyInteraction } from '../../openLayers/Interaction'
import { ModifyEvent } from 'ol/interaction/Modify';
import Querschnitt from 'src/js/Objekte/Querschnittsdaten';
import { SelectEvent } from 'ol/interaction/Select';
import InfoTool from '../InfoTool';
import { MultiLineString } from 'ol/geom';
import HTML from '../../HTML';
import Klartext from '../../Objekte/Klartext';

import "../../import_jquery.js";
import 'chosen-js';
import 'chosen-js/chosen.css';
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css'

/**
 * Funktion zum Verändern von Querschnittsflächen
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */
export default class QuerModifyTool extends Tool {
    private map: Map;
    private daten: Daten;
    private info: QuerInfoTool;
    private modify: ModifyInteraction;
    private selectLinien: SelectInteraction;
    private selectFlaechen: SelectInteraction;
    private snapTrenn: Snap;
    private snapStation: Snap;
    //private streifen: 'M' | 'L' | 'R';
    //private streifennr: number;
    private multiEditForm: HTMLFormElement = null;
    private multiCountInput: HTMLInputElement;
    private multiArtSelect: HTMLSelectElement;
    private multiOberSelect: HTMLSelectElement;
    private moveTypeForm: HTMLFormElement = null;

    constructor(map: Map, info: QuerInfoTool) {
        super();
        this.map = map;
        this.daten = Daten.getInstanz();
        this.info = info;

        this.createLinienSelect();
        this.createFlaechenSelect();
        this.createModify();
        this.createSnap();
    };

    private createMoveTypeForm() {
        if (this.moveTypeForm != null) return;
        this.moveTypeForm = HTML.createToolForm(document.getElementById('sidebar'), false, 'modify');
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
        this.multiEditForm = HTML.createToolForm(document.getElementById("sidebar"), false, "qsMultiMod");

        this.multiArtSelect = Klartext.createKlartextSelectForm("Itquerart", this.multiEditForm, "Art", 'qsmm_art', undefined, "- verschiedene -")
        this.multiOberSelect = Klartext.createKlartextSelectForm("Itquerober", this.multiEditForm, "Art der Oberfläche", 'qsmm_ober', undefined, "- verschiedene -")
        this.multiCountInput = HTML.createNumberInput(this.multiEditForm, "Anzahl", "qsmm_anzahl");
        this.multiCountInput.disabled = true;

        $(this.multiArtSelect).on("change", this.updateMultiArt.bind(this));
        $(this.multiOberSelect).on("change", this.updateMultiOber.bind(this));
    }

    private createModify() {
        this.modify = new ModifyInteraction({
            deleteCondition: never,
            insertVertexCondition: never,
            features: this.selectLinien.getFeatures()
        });
        this.modify.geo_vorher = null;
        this.modify.modify = this;

        this.modify.on('modifystart', this.modifyStart.bind(this));
        this.modify.on('modifyend', this.modifyEnd.bind(this));
    }

    private modifyStart(e: ModifyEvent) {
        let auswahl = e.features.getArray()[0];
        e.target.geo_vorher = auswahl.getGeometry().clone();
        this.map.addInteraction(this.snapStation);
    }

    private modifyEnd(event: ModifyEvent) {
        this.map.removeInteraction(this.snapStation);
        let auswahl = event.features.getArray()[0];
        let querschnitt = auswahl.get('objekt') as Querschnitt;
        let nachher: number[][][] = (auswahl.getGeometry() as MultiLineString).getCoordinates();
        let vorher: number[][][] = event.target.geo_vorher.getCoordinates();

        for (let i = 0; i < vorher.length; i++) {
            for (let j = 0; j < vorher[i].length; j += vorher[i].length - 1) {
                if (nachher[i][j][0] != vorher[i][j][0] || nachher[i][j][1] != vorher[i][j][1]) {
                    // alte Daten speichern für Vergleich, wenn angrenzender Querschnitt mitbewegt werden soll
                    let alt_XBstR = querschnitt.getXBstR();
                    let alt_XBstL = querschnitt.getXBstL();
                    let alt_XVstR = querschnitt.getXVstR();
                    let alt_XVstL = querschnitt.getXVstL();

                    // Variablen, je nach dem ob BST oder VST verändert wird
                    // VST
                    let vst = true;
                    let edit: 'Vst' | 'Bst' = "Vst";
                    let edit_breite: "breite" | "bisBreite" = "breite";
                    // BST
                    if (j > 0) {
                        vst = false;
                        edit = "Bst";
                        edit_breite = "bisBreite";
                    }

                    // Berechnen des Abstandes des neuen Punktes
                    let pos = querschnitt.getAbschnitt().calcStationierung(nachher[i][j]);
                    let dist = Math.round(pos.abstand * 100) / 100;

                    // Streifen und Nr
                    let streifen = querschnitt.getStreifen();

                    if (streifen == 'L')
                        dist *= -1;

                    let diff = dist - querschnitt.getX(edit, streifen as 'L' | 'R');

                    diff = this._check_and_edit_querschnitt(querschnitt, diff, edit, edit_breite);

                    // Nachbar-Querschnitt mitziehen?
                    //console.log(querschnitt);
                    if (document.forms.namedItem("modify").modify_glue.checked) {
                        // VST, BST suchen und ändern
                        if (vst) {
                            let station = querschnitt.getStation().getAbschnitt().getStationByBST(querschnitt.getVst());
                            if (station == null) break;
                            let querschnitt_nachbar = station.getQuerschnittByBstAbstand(alt_XVstL, alt_XVstR);
                            if (querschnitt_nachbar == null) break;
                            this._check_and_edit_querschnitt(querschnitt_nachbar, diff, 'Bst', 'bisBreite')
                        }
                        //BST, VST suchen und ändern
                        else {
                            let station = querschnitt.getStation().getAbschnitt().getStationByVST(querschnitt.getBst());
                            if (station == null) break;
                            let querschnitt_nachbar = station.getQuerschnittByVstAbstand(alt_XBstL, alt_XBstR);
                            if (querschnitt_nachbar == null) break;
                            this._check_and_edit_querschnitt(querschnitt_nachbar, diff, 'Vst', 'breite')
                        }
                    }
                    break;
                }
            }
        }
        //breiteNachfAnpassen(absid, station, streifen, nr, edit, diff);
        this.info.featureSelect(this.selectFlaechen, true);
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

    private createLinienSelect() {
        this.selectLinien = new SelectInteraction({
            layers: [this.daten.layerTrenn],
            condition: never,
            style: InfoTool.selectStyle
        });
        //this.selectLinien.on('select', this.linieSelected.bind(this));
    }

    private createFlaechenSelect() {
        this.selectFlaechen = new SelectInteraction({
            layers: [this.daten.layerQuer],
            toggleCondition: platformModifierKeyOnly,
            style: InfoTool.selectStyle
        });

        this.selectFlaechen.on('select', this.flaecheSelected.bind(this));
    }

    private flaecheSelected(event: SelectEvent) {
        this.selectLinien.getFeatures().clear();
        let auswahl = (this.selectFlaechen as SelectInteraction).getFeatures();
        auswahl.forEach(function (this: QuerModifyTool, feat: Querschnitt) {
            this.selectLinien.getFeatures().push(feat.trenn);
        }.bind(this))

        this.featureSelected();
    }

    private featureSelected() {
        let selection = this.selectFlaechen.getFeatures().getArray() as Querschnitt[];

        this.selectLinien.getFeatures().clear()
        this.selectFlaechen.getFeatures().forEach(function (this: QuerModifyTool, feature: Feature) {
            this.selectLinien.getFeatures().push((feature as Querschnitt).trenn)
        }.bind(this));

        if (selection.length == 1) {
            this.singleSelect(selection);
        } else if (selection.length > 1) {
            this.multiSelect(selection);
        } else {
            this.info.hideInfoBox();
            this.setModifyActive(false);
            $(this.moveTypeForm).show("fast");
            $(this.multiEditForm).hide("fast");
        }
    }

    private singleSelect(selection: Feature[]) {
        console.log("singleSelect")
        $(this.multiEditForm).hide("fast");

        this.setModifyActive(true);
        this.info.featureSelect(this.selectFlaechen, true);
    }

    private multiSelect(selection: Querschnitt[]) {
        console.log("multiSelect")
        this.createMultiModForm();
        this.info.hideInfoBox();
        this.setModifyActive(false);
        $(this.moveTypeForm).hide("fast");

        let art = selection[0].getArt();
        let ober = selection[0].getArtober();
        console.log(art)
        for (let querschnitt of selection) {
            console.log(querschnitt.getArt());
            if (art != querschnitt.getArt())
                art = null;
            if (ober != querschnitt.getArtober())
                ober = null;
            if (art == null && ober == null)
                break;
        }
        this.multiCountInput.value = selection.length.toString();
        $(this.multiArtSelect).val(art);
        $(this.multiOberSelect).val(ober);

        console.log($(this.multiArtSelect));
        $(this.multiArtSelect).trigger("chosen:updated");
        $(this.multiOberSelect).trigger("chosen:updated");

        $(this.multiEditForm).show("fast");
    }

    private setModifyActive(status: boolean) {
        this.snapStation.setActive(status);
        this.snapTrenn.setActive(status);
        this.modify.setActive(status);
    }

    private createSnap() {
        this.snapTrenn = new Snap({
            source: this.daten.vectorTrenn,
            edge: false
        });
        this.snapStation = new Snap({
            source: this.daten.vectorStation,
            pixelTolerance: 500,
            vertex: false
        });
    }

    private updateMultiArt() {
        let querschnitte = this.selectFlaechen.getFeatures().getArray() as Querschnitt[];
        let art = this.multiArtSelect.value;

        for (let querschnitt of querschnitte) {
            querschnitt.updateArtEinzeln(art);
        }
    }


    private updateMultiOber() {
        let querschnitte = this.selectFlaechen.getFeatures().getArray() as Querschnitt[];
        let artober = this.multiOberSelect.value;

        for (let querschnitt of querschnitte) {
            querschnitt.updateOberEinzeln(artober);
        }
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