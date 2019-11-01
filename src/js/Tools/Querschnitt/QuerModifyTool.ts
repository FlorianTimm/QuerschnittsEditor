import { Snap } from 'ol/interaction';
import Vektor from '../../Vektor';
import { platformModifierKeyOnly, never } from 'ol/events/condition';
import QuerInfoTool from './QuerInfoTool';
import Daten from '../../Daten';
import { Map, Feature } from 'ol';
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
    private streifen: 'M' | 'L' | 'R';
    private streifennr: number;
    private multiEditForm: HTMLFormElement;
    private multiCountInput: HTMLInputElement;
    private multiArtSelect: HTMLSelectElement;
    private multiOberSelect: HTMLSelectElement;

    constructor(map: Map, info: QuerInfoTool) {
        super();
        this.map = map;
        this.daten = Daten.getInstanz();
        this.info = info;

        this.createLinienSelect();
        this.createFlaechenSelect();
        this.createModify();
        this.createSnap();

        document.getElementById('befehl_modify').addEventListener('change', this._switch.bind(this));

        this.createMultiModForm();
    };

    private createMultiModForm() {
        this.multiEditForm = HTML.createToolForm(document.getElementById("sidebar"), false, "qsMultiMod");

        this.multiArtSelect = Klartext.createKlartextSelectForm("Itquerart", this.multiEditForm, "Art", 'qsmm_art', undefined, "- verschiedene -")
        this.multiOberSelect = Klartext.createKlartextSelectForm("Itquerober", this.multiEditForm, "Art der Oberfläche", 'qsmm_ober', undefined, "- verschiedene -")
        this.multiCountInput = HTML.createNumberInput(this.multiEditForm, "Anzahl", "qsmm_anzahl");
        this.multiCountInput.disabled = true;

        $(this.multiArtSelect).on("change", this.updateMultiArt.bind(this));
        $(this.multiOberSelect).on("change", this.updateMultiOber.bind(this));
    }

    _switch() {
        if ((document.getElementById('befehl_info') as HTMLInputElement).checked) {
            this.start();
        } else {
            this.stop();
        }
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

    private modifyStart(e) {
        let auswahl = e.features.getArray()[0];
        e.target.geo_vorher = auswahl.getGeometry().clone();
        this.map.addInteraction(this.snapStation);
    }

    private modifyEnd(event: ModifyEvent) {
        this.map.removeInteraction(this.snapStation);
        let auswahl = event.features.getArray()[0];
        let querschnitt = auswahl.get('objekt') as Querschnitt;
        let nachher = (auswahl.getGeometry() as MultiLineString).getCoordinates();
        let vorher = event.target.geo_vorher.getCoordinates();

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
                    let pos = Vektor.get_pos(querschnitt.getStation().getGeometry(), nachher[i][j]);
                    let dist = Math.round(pos[4] * 100) / 100;

                    // Streifen und Nr
                    let streifen = querschnitt.getStreifen();

                    if (streifen == 'L')
                        dist *= -1;

                    let diff = dist - querschnitt['X' + edit + streifen];

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
        this.info.featureSelect(this.selectFlaechen);
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
        querschnitt['X' + Vst_or_Bst + streifen] += diff;
        querschnitt[breite_or_bisBreite] = Math.round(100 * (querschnitt['X' + Vst_or_Bst + 'R'] - querschnitt['X' + Vst_or_Bst + 'L']));
        querschnitt.editBreite(Vst_or_Bst, diff, (document.getElementById('modify_fit') as HTMLInputElement).checked);
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

    /*
    private linieSelected(event: SelectEvent) {
        this.selectFlaechen.getFeatures().clear();
        let auswahl = (this.selectLinien as SelectInteraction).getFeatures();
        if (auswahl.getLength() > 0) {
            auswahl.forEach(function (feat: Feature) {
                this.selectFlaechen.getFeatures().push(feat.get("objekt"));
            }.bind(this))
        }
        this.featureSelected();
    }*/

    private flaecheSelected(event: SelectEvent) {
        this.selectLinien.getFeatures().clear();
        let auswahl = (this.selectFlaechen as SelectInteraction).getFeatures();
        auswahl.forEach(function (feat: Querschnitt) {
            this.selectLinien.getFeatures().push(feat.trenn);
        }.bind(this))

        this.featureSelected();
    }

    private featureSelected() {
        let selection = this.selectFlaechen.getFeatures().getArray() as Querschnitt[];

        this.selectLinien.getFeatures().clear()
        this.selectFlaechen.getFeatures().forEach(function (feature: Feature) {
            (this as QuerModifyTool).selectLinien.getFeatures().push((feature as Querschnitt).trenn)
        }.bind(this));

        if (selection.length == 1) {
            this.singleSelect(selection);
        } else if (selection.length > 1) {
            this.multiSelect(selection);
        } else {
            this.info.hideInfoBox();
            this.setModifyActive(false);
            $("#modify").show("fast");
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
        this.info.hideInfoBox();
        this.setModifyActive(false);
        $("#modify").hide("fast");

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

    /*
    private _getSelection(): Querschnitt {
        let selection = this.selectFlaechen.getFeatures();
        if (this.selectFlaechen.getFeatures().getLength() <= 0)
            return;
        return selection.item(0) as Querschnitt;
    }
    
    private updateInfoBreite(test) {
        let querschnitt = this._getSelection();
        let form = $(this.info.getForm());

        let max_diff_vst = null, max_diff_bst = null;
        if ((document.getElementById('modify_fit') as HTMLInputElement).checked && querschnitt.getStation().getQuerschnitt(this.streifen, this.streifennr + 1) != null) {
            max_diff_vst = querschnitt.getStation().getQuerschnitt(this.streifen, this.streifennr + 1).getBreite() / 100;
            max_diff_bst = querschnitt.getStation().getQuerschnitt(this.streifen, this.streifennr + 1).getBisBreite() / 100;
        }

        if (querschnitt.getBreite() != Number((form.children('#breite').val())) - querschnitt.getBreite()) / 100;
            if (max_diff_vst !== null && diff > max_diff_vst) {
                diff = (max_diff_vst);
            }
            querschnitt.setBreite(querschnitt.getBreite() + diff * 100);
            if (querschnitt.getStreifen() == 'L') {
                querschnitt.setXVstL(querschnitt.getXVstL() - diff);
                querschnitt.editBreite('Vst', -diff, (document.getElementById('modify_fit') as HTMLInputElement).checked);
            }
            else if (querschnitt.getStreifen() == 'R') {
                querschnitt.setXVstR(querschnitt.getXVstL() + diff);
                querschnitt.editBreite('Vst', diff, (document.getElementById('modify_fit') as HTMLInputElement).checked);
            }

        }
        else if (querschnitt.getBisBreite() != Number((document.getElementById('info_bisbreite') as HTMLInputElement).value)) {
            let diff = (Math.round(Number((document.getElementById('info_bisbreite') as HTMLInputElement).value)) - querschnitt.getBisBreite()) / 100;
            if (max_diff_bst !== null && diff > max_diff_bst) {
                diff = (max_diff_bst);
            }
            querschnitt.setBisBreite(querschnitt.getBisBreite() + diff * 100);
            if (querschnitt.getStreifen() == 'L') {
                querschnitt.setXBstL(querschnitt.getXBstL() - diff);
                querschnitt.editBreite('Bst', -diff, (document.getElementById('modify_fit') as HTMLInputElement).checked);
            }
            else if (querschnitt.getStreifen() == 'R') {
                querschnitt.setXBstR(querschnitt.getXBstR() + diff);
                querschnitt.editBreite('Bst', diff, (document.getElementById('modify_fit') as HTMLInputElement).checked);
            }
        }
    }*/

    start() {
        $("#modify").show("fast");
        this.map.addInteraction(this.selectLinien);
        this.map.addInteraction(this.selectFlaechen);
        this.map.addInteraction(this.modify);
        this.map.addInteraction(this.snapTrenn);
    }

    stop() {
        $("#modify").hide("fast");
        this.info.hideInfoBox();
        this.map.removeInteraction(this.selectLinien);
        this.map.removeInteraction(this.selectFlaechen);
        this.map.removeInteraction(this.modify);
        this.map.removeInteraction(this.snapTrenn);
        this.map.removeInteraction(this.snapStation);

        $(this.multiEditForm).hide("hide");
    }
}