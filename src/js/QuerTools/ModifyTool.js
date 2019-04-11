import { Modify as ModifyInteraction, Select as SelectInteraction, Snap } from 'ol/interaction';
import { Fill, Stroke, Style } from 'ol/style';
import Vektor from '../Vektor.js';
import { platformModifierKeyOnly, never } from 'ol/events/condition';

class ModifyTool {
    constructor(map, daten, info) {
        this.map = map;
        this.daten = daten;
        this.info = info;

        this._createLinienSelect();
        this._createFlaechenSelect();
        this._createModify();
        this._createSnap();

        document.getElementById('info_art').addEventListener('change', this.updateInfo.bind(this));
        document.getElementById('info_ober').addEventListener('change', this.updateInfo.bind(this));
        document.getElementById('info_breite').addEventListener('change', this.updateInfoBreite.bind(this));
        document.getElementById('info_bisbreite').addEventListener('change', this.updateInfoBreite.bind(this));

        document.getElementById('befehl_modify').addEventListener('change', this._switch.bind(this));

        document.getElementById('qsmm_art').addEventListener('change', this.updateMulti.bind(this));
        document.getElementById('qsmm_ober').addEventListener('change', this.updateMulti.bind(this));
    };

    _switch() {
        if (document.getElementById('befehl_info').checked) {
            this.start();
        } else {
            this.stop();
        }
    }

    _createModify() {
        this.modify = new ModifyInteraction({
            deleteCondition: never,
            insertVertexCondition: never,
            features: this.select.getFeatures()
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
        this.map.removeInteraction(this.snap_station);
        console.log(event);
        let auswahl = event.features.getArray()[0];
        let querschnitt = auswahl.get('objekt');
        let nachher = auswahl.getGeometry().getCoordinates();
        let vorher = event.target.geo_vorher.getCoordinates();

        let streifen = querschnitt.streifen;
        let nr = querschnitt.streifennr;

        let diff = 0, edit = null;
        let max_diff_vst = null, max_diff_bst = null;

        if (document.getElementById('modify_fit').checked && querschnitt.station.getQuerschnitt(streifen, nr + 1) != null) {
            max_diff_vst = querschnitt.station.getQuerschnitt(streifen, nr + 1).breite / 100;
            max_diff_bst = querschnitt.station.getQuerschnitt(streifen, nr + 1).bisBreite / 100;
        }

        for (let i = 0; i < vorher.length; i++) {
            for (let j = 0; j < vorher[i].length; j += vorher[i].length - 1) {
                if (nachher[i][j][0] != vorher[i][j][0] || nachher[i][j][1] != vorher[i][j][1]) {
                    let pos = Vektor.get_pos(querschnitt.station.geo, nachher[i][j]);
                    let dist = Math.round(pos[4] * 100) / 100;
                    if (streifen == 'L')
                        dist *= -1;

                    if (j > 0) {
                        diff = dist - querschnitt['XBst' + streifen];

                        if (max_diff_bst !== null && ((streifen == 'L') ? (-diff) : (diff)) > max_diff_bst) {
                            diff = ((streifen == 'L') ? (-max_diff_bst) : (max_diff_bst));
                        }
                        edit = 'Bst';
                        querschnitt['XBst' + streifen] += diff;
                        querschnitt['bisBreite'] =
                            Math.round(100 * (querschnitt['XBstR'] -
                                querschnitt['XBstL']));
                    }
                    else {
                        diff = dist - querschnitt['XVst' + streifen];
                        edit = 'Vst';

                        if (max_diff_vst !== null && ((streifen == 'L') ? (-diff) : (diff)) > max_diff_vst) {
                            diff = ((streifen == 'L') ? (-max_diff_vst) : (max_diff_vst));
                        }
                        querschnitt['XVst' + streifen] += diff;
                        querschnitt['breite'] =
                            Math.round(100 * (querschnitt['XVstR'] -
                                querschnitt['XVstL']));
                    }
                    break;
                }
            }
        }
        if (edit == null) return;
        querschnitt.editBreite(edit, diff, document.getElementById('modify_fit').checked);
        //breiteNachfAnpassen(absid, station, streifen, nr, edit, diff);
        this.info.logAuswahl(this.select);
    }

    _createLinienSelect() {
        this.select = new SelectInteraction({
            layers: [this.daten.l_trenn],
            toggleCondition: never,
            style: new Style({
                stroke: new Stroke({
                    color: 'rgba(255, 0, 0, 0.5)',
                    width: 3
                })
            })
        });
        this.select.info = this.info;
        this.select.on('select', function (e) {
            this.select_fl.getFeatures().clear();
            e.target.info.logAuswahl(e.target);
        });
    }

    _createFlaechenSelect() {
        this.select_fl = new SelectInteraction({
            layers: [this.daten.l_quer],
            toggleCondition: platformModifierKeyOnly,
            style: new Style({
                fill: new Fill({
                    color: 'rgba(255, 0, 0, 0.3)'
                })
            })
        });

        this.select_fl.on('select', function (e, zwei) {
            this.select.getFeatures().clear();
            let selection = this.select_fl.getFeatures().getArray();
            document.forms.qsMultiMod.style.display = 'none';
            if (selection.length == 1) {
                let auswahl = selection[0];
                let a = auswahl.get('objekt').trenn;
                this.select.getFeatures().push(a);
            } else if (selection.length > 1) {
                // MultiSelect
                let art = selection[0].get('objekt').art.substr(-32)
                let ober = selection[0].get('objekt').artober.substr(-32)
                for (let i = 1; i < selection.length; i++) {
                    let feat = selection[i].get('objekt');
                    if (art != feat.art.substr(-32)) art = 'diff';
                    if (ober != feat.artober.substr(-32)) ober = 'diff';
                }
                document.forms.qsMultiMod.qsmm_anzahl.value = selection.length;
                document.forms.qsMultiMod.qsmm_art.value = (art == 'diff') ? '' : art;
                document.forms.qsMultiMod.qsmm_ober.value = (ober == 'diff') ? '' : ober;
                document.forms.qsMultiMod.style.display = 'block';
            }
            this.info.logAuswahl(this.select);
        }.bind(this));
    }

    _createSnap() {
        this.snap_trenn = new Snap({
            source: this.daten.v_trenn,
            edge: false
        });
        this.snap_station = new Snap({
            source: this.daten.v_station,
            pixelTolerance: 500,
            vertex: false
        });
    }

    _getSelection() {
        let selection = this.select.getFeatures();
        if (this.select.getFeatures().getLength() <= 0)
            return;
        return selection.item(0).get('objekt');
    }

    updateInfo() {
        let querschnitt = this._getSelection();

        let art = document.getElementById('info_art').value;
        let artober = document.getElementById('info_ober').value;

        querschnitt.updateArt(art, artober);
    }

    updateMulti() {
        let querschnitte = this.select_fl.getFeatures().getArray();
        let art = document.getElementById('qsmm_art').value;
        let artober = document.getElementById('qsmm_ober').value;

        for (let querschnitt of querschnitte) {
            querschnitt.get('objekt').updateArt(art, artober);
        }
    }

    updateInfoBreite(test) {
        let querschnitt = this._getSelection();

        let max_diff_vst = null, max_diff_bst = null;
        if (document.getElementById('modify_fit').checked && querschnitt.station.getQuerschnitt(this.streifen, this.streifennr + 1) != null) {
            max_diff_vst = querschnitt.station.getQuerschnitt(streifen, nr + 1).breite / 100;
            max_diff_bst = querschnitt.station.getQuerschnitt(streifen, nr + 1).bisBreite / 100;
        }

        if (querschnitt.breite != Number(document.getElementById('info_breite').value)) {
            let diff = (Math.round(Number(document.getElementById('info_breite').value)) - querschnitt.breite) / 100;
            if (max_diff_vst !== null && diff > max_diff_vst) {
                diff = (max_diff_vst);
            }
            querschnitt.breite += diff * 100;
            if (querschnitt.streifen == 'L') {
                querschnitt.XVstL -= diff;
                querschnitt.editBreite('Vst', -diff, document.getElementById('modify_fit').checked);
            }
            else if (querschnitt.streifen == 'R') {
                querschnitt.XVstR += diff;
                querschnitt.editBreite('Vst', diff, document.getElementById('modify_fit').checked);
            }

        }
        else if (querschnitt.bisBreite != Number(document.getElementById('info_bisbreite').value)) {
            let diff = (Math.round(Number(document.getElementById('info_bisbreite').value)) - querschnitt.bisBreite) / 100;
            if (max_diff_bst !== null && diff > max_diff_bst) {
                diff = (max_diff_bst);
            }
            querschnitt.bisBreite += diff * 100;
            if (querschnitt.streifen == 'L') {
                querschnitt.XBstL -= diff;
                querschnitt.editBreite('Bst', -diff, document.getElementById('modify_fit').checked);
            }
            else if (querschnitt.streifen == 'R') {
                querschnitt.XBstR += diff;
                querschnitt.editBreite('Bst', diff, document.getElementById('modify_fit').checked);
            }
        }
    }

    start() {
        document.forms.modify.style.display = 'block';
        this.map.addInteraction(this.select);
        this.map.addInteraction(this.select_fl);
        this.map.addInteraction(this.modify);
        this.map.addInteraction(this.snap_trenn);

        document.getElementById('info_art').disabled = '';
        document.getElementById('info_ober').disabled = '';
        document.getElementById('info_breite').disabled = '';
        document.getElementById('info_bisbreite').disabled = '';
    }

    stop() {
        document.forms.modify.style.display = 'none';
        this.map.removeInteraction(this.select);
        this.map.removeInteraction(this.select_fl);
        this.map.removeInteraction(this.modify);
        this.map.removeInteraction(this.snap_trenn);
        this.map.removeInteraction(this.snap_station);

        document.getElementById('info_art').disabled = 'disabled';
        document.getElementById('info_ober').disabled = 'disabled';
        document.getElementById('info_breite').disabled = 'disabled';
        document.getElementById('info_bisbreite').disabled = 'disabled';

        document.forms.info.style.display = 'none';
        document.forms.qsMultiMod.style.display = 'none';
    }
}

module.exports = ModifyTool;