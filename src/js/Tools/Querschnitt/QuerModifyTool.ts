import { Snap } from 'ol/interaction';
import { Fill, Stroke, Style } from 'ol/style';
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

/**
 * Funktion zum Verändern von Querschnittsflächen
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */
class QuerModifyTool extends Tool {
    private map: Map;
    private daten: Daten;
    private info: QuerInfoTool;
    private modify: ModifyInteraction;
    private selectLinien: SelectInteraction;
    private selectFlaechen: SelectInteraction;
    private snapTrenn: Snap;
    private snapStation: Snap;
    private streifennr: number;

    constructor(map: Map, info: QuerInfoTool) {
        super();
        this.map = map;
        this.daten = Daten.getInstanz();
        this.info = info;

        this.createLinienSelect();
        this.createFlaechenSelect();
        this.createModify();
        this.createSnap();

        document.getElementById('info_art').addEventListener('change', this.updateInfo.bind(this));
        document.getElementById('info_ober').addEventListener('change', this.updateInfo.bind(this));
        document.getElementById('info_breite').addEventListener('change', this.updateInfoBreite.bind(this));
        document.getElementById('info_bisbreite').addEventListener('change', this.updateInfoBreite.bind(this));

        document.getElementById('befehl_modify').addEventListener('change', this._switch.bind(this));

        document.getElementById('qsmm_art').addEventListener('change', this.updateMultiArt.bind(this));
        document.getElementById('qsmm_ober').addEventListener('change', this.updateMultiOber.bind(this));
    };

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

        this.modify.on('modifystart', function (e) {
            let auswahl = e.features.getArray()[0];
            e.target.geo_vorher = auswahl.getGeometry().clone();
            this.map.addInteraction(this.snap_station);
        }.bind(this));
        this.modify.on('modifyend', this._modifyEnd.bind(this));
    }

    _modifyEnd(event) {
        this.map.removeInteraction(this.snapStation);
        console.log(event);
        let auswahl = event.features.getArray()[0];
        let querschnitt = auswahl.get('objekt') as Querschnitt;
        let nachher = auswahl.getGeometry().getCoordinates();
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
                    let edit = "Vst";
                    let edit_breite = "breite";
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
                    console.log(querschnitt);
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
        this.info.featureSelect(auswahl);
    }

    _check_and_edit_querschnitt(querschnitt, diff, Vst_or_Bst, breite_or_bisBreite) {
        let streifen = querschnitt.streifen;
        let nr = querschnitt.streifennr;

        // Überschneidung mit nächsten 
        let next_quer = querschnitt.station.getQuerschnitt(streifen, nr + 1)
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
            toggleCondition: platformModifierKeyOnly,
            style: InfoTool.selectStyle
        });
        this.selectLinien.on('select', this.linieSelected.bind(this));
    }

    private createFlaechenSelect() {
        this.selectFlaechen = new SelectInteraction({
            layers: [this.daten.layerQuer],
            toggleCondition: platformModifierKeyOnly,
            style: InfoTool.selectStyle
        });

        this.selectFlaechen.on('select', this.flaecheSelected.bind(this));
    }

    private linieSelected(event: SelectEvent) {
        this.selectFlaechen.getFeatures().clear();
        let auswahl = (this.selectLinien as SelectInteraction).getFeatures();
        if (auswahl.getLength() > 0) {
            auswahl.forEach(function (feat: Feature) {
                this.selectFlaechen.getFeatures().push(feat.get("objekt"));
            }.bind(this))
        }
        this.featureSelected();
    }

    private flaecheSelected(event: SelectEvent) {
        this.selectLinien.getFeatures().clear();
        let auswahl = (this.selectFlaechen as SelectInteraction).getFeatures();
        console.log(auswahl.getArray())
        if (auswahl.getLength() > 0) {
            auswahl.forEach(function (feat: Feature) {
                this.selectLinien.getFeatures().push((feat as Querschnitt).trenn);
            }.bind(this))
        }
        document.forms.namedItem("qsMultiMod").style.display = 'none';
        this.featureSelected();
    }

    private featureSelected() {
        let selection = this.selectFlaechen.getFeatures().getArray();
        if (selection.length == 1) {
            this.singleSelect(selection);
        } else if (selection.length > 1) {
            this.multiSelect(selection);
        }
    }

    private singleSelect(selection: Feature[]) {
        let auswahl = selection[0] as Querschnitt;
        let trennlinie = auswahl.trenn;
        this.selectLinien.getFeatures().push(trennlinie);
        (this.info as QuerInfoTool).featureSelect(this.selectFlaechen, true);
    }

    private multiSelect(selection: Feature[]) {
        this.info.hideInfoBox();
        let art = 'diff';
        let ober = 'diff';
        if ((selection[0] as Querschnitt).getArt() != null)
            art = (selection[0] as Querschnitt).getArt().substr(-32);
        if ((selection[0] as Querschnitt).getArtober() != null)
            ober = ((selection[0] as Querschnitt) as Querschnitt).getArtober().substr(-32);
        for (let i = 1; i < selection.length; i++) {
            let feat = selection[i] as Querschnitt;
            if (feat.getArt() != null || art != feat.getArt().substr(-32))
                art = 'diff';
            if (feat.getArt() != null || ober != feat.getArtober().substr(-32))
                ober = 'diff';
        }
        document.forms.namedItem("qsMultiMod").qsmm_anzahl.value = selection.length;
        document.forms.namedItem("qsMultiMod").qsmm_art.value = (art == 'diff') ? '' : art;
        document.forms.namedItem("qsMultiMod").qsmm_ober.value = (ober == 'diff') ? '' : ober;
        document.forms.namedItem("qsMultiMod").style.display = 'block';
    }

    createSnap() {
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

    _getSelection() {
        let selection = this.selectLinien.getFeatures();
        if (this.selectLinien.getFeatures().getLength() <= 0)
            return;
        return selection.item(0).get('objekt');
    }

    updateInfo() {
        let querschnitt = this._getSelection();

        let art = (document.getElementById('info_art') as HTMLInputElement).value;
        let artober = (document.getElementById('info_ober') as HTMLInputElement).value;

        querschnitt.updateArt(art, artober);
    }

    updateMultiArt() {
        let querschnitte = this.selectFlaechen.getFeatures().getArray();
        let art = (document.getElementById('qsmm_art') as HTMLInputElement).value;

        for (let querschnitt of querschnitte) {
            querschnitt.get('objekt').updateArtEinzeln(art);
        }
    }


    updateMultiOber() {
        let querschnitte = this.selectFlaechen.getFeatures().getArray();
        let artober = (document.getElementById('qsmm_ober') as HTMLInputElement).value;

        for (let querschnitt of querschnitte) {
            querschnitt.get('objekt').updateOberEinzeln(artober);
        }
    }

    updateInfoBreite(test) {
        let querschnitt = this._getSelection();

        let max_diff_vst = null, max_diff_bst = null;
        if ((document.getElementById('modify_fit') as HTMLInputElement).checked && querschnitt.station.getQuerschnitt(this.streifen, this.streifennr + 1) != null) {
            max_diff_vst = querschnitt.station.getQuerschnitt(this.streifen, this.streifennr + 1).breite / 100;
            max_diff_bst = querschnitt.station.getQuerschnitt(this.streifen, this.streifennr + 1).bisBreite / 100;
        }

        if (querschnitt.breite != Number((document.getElementById('info_breite') as HTMLInputElement).value)) {
            let diff = (Math.round(Number((document.getElementById('info_breite') as HTMLInputElement).value)) - querschnitt.breite) / 100;
            if (max_diff_vst !== null && diff > max_diff_vst) {
                diff = (max_diff_vst);
            }
            querschnitt.breite += diff * 100;
            if (querschnitt.streifen == 'L') {
                querschnitt.XVstL -= diff;
                querschnitt.editBreite('Vst', -diff, (document.getElementById('modify_fit') as HTMLInputElement).checked);
            }
            else if (querschnitt.streifen == 'R') {
                querschnitt.XVstR += diff;
                querschnitt.editBreite('Vst', diff, (document.getElementById('modify_fit') as HTMLInputElement).checked);
            }

        }
        else if (querschnitt.bisBreite != Number((document.getElementById('info_bisbreite') as HTMLInputElement).value)) {
            let diff = (Math.round(Number((document.getElementById('info_bisbreite') as HTMLInputElement).value)) - querschnitt.bisBreite) / 100;
            if (max_diff_bst !== null && diff > max_diff_bst) {
                diff = (max_diff_bst);
            }
            querschnitt.bisBreite += diff * 100;
            if (querschnitt.streifen == 'L') {
                querschnitt.XBstL -= diff;
                querschnitt.editBreite('Bst', -diff, (document.getElementById('modify_fit') as HTMLInputElement).checked);
            }
            else if (querschnitt.streifen == 'R') {
                querschnitt.XBstR += diff;
                querschnitt.editBreite('Bst', diff, (document.getElementById('modify_fit') as HTMLInputElement).checked);
            }
        }
    }
    streifen(streifen: any, arg1: any) {
        throw new Error("Method not implemented.");
    }

    start() {
        document.forms.namedItem("modify").style.display = 'block';
        this.map.addInteraction(this.selectLinien);
        this.map.addInteraction(this.selectFlaechen);
        this.map.addInteraction(this.modify);
        this.map.addInteraction(this.snapTrenn);

        (document.getElementById('info_art') as HTMLInputElement).disabled = false;
        (document.getElementById('info_ober') as HTMLInputElement).disabled = false;
        (document.getElementById('info_breite') as HTMLInputElement).disabled = false;
        (document.getElementById('info_bisbreite') as HTMLInputElement).disabled = false;
    }

    stop() {
        document.forms.namedItem("modify").style.display = 'none';
        this.map.removeInteraction(this.selectLinien);
        this.map.removeInteraction(this.selectFlaechen);
        this.map.removeInteraction(this.modify);
        this.map.removeInteraction(this.snapTrenn);
        this.map.removeInteraction(this.snapStation);

        (document.getElementById('info_art') as HTMLInputElement).disabled = true;
        (document.getElementById('info_ober') as HTMLInputElement).disabled = true;
        (document.getElementById('info_breite') as HTMLInputElement).disabled = true;
        (document.getElementById('info_bisbreite') as HTMLInputElement).disabled = true;

        document.forms.namedItem("info").style.display = 'none';
        document.forms.namedItem("qsMultiMod").style.display = 'none';
    }
}

export default QuerModifyTool;