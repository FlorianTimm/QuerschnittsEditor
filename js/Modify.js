import never from 'ol/events/condition';
import { Modify as ModifyInteraction, Select as SelectInteraction, Snap } from 'ol/interaction';
import { Fill, Stroke, Style } from 'ol/style';
import Vektor from './Vektor.js';


class Modify {
    constructor(map, daten, info) {
        this.map = map;
        this.daten = daten;
        this.info = info;

        this._createLinienSelect();
        this._createFlaechenSelect();
        this._createModify();
        this._createSnap();
    };

    _createModify() {
        this.modify = new ModifyInteraction({
            deleteCondition: never,
            insertVertexCondition: never,
            features: this.select.getFeatures()
        });
        this.modify.geo_vorher = null;

        this.modify.on('modifystart', function (e) {
            let auswahl = e.features.getArray()[0];
            e.target.geo_vorher = auswahl.getGeometry().clone();
        });
        this.modify.on('modifyend', this._modifyEnd);
    }

    _modifyEnd(event) {
        console.log(event);
        let auswahl = event.features.getArray()[0];
        var querschnitt = auswahl.get('objekt');
        var nachher = auswahl.getGeometry().getCoordinates();
        var vorher = this.geo_vorher.getCoordinates();

        let streifen = querschnitt.streifen;
        let nr = querschnitt.streifennr;

        var diff = 0, edit = null;
        var max_diff_vst = null, max_diff_bst = null;

        if (document.getElementById('modify_fit').checked && querschnitt.station.getQuerschnitt(streifen, nr + 1) != null) {
            max_diff_vst = querschnitt.station.getQuerschnitt(streifen, nr + 1).breite / 100;
            max_diff_bst = querschnitt.station.getQuerschnitt(streifen, nr + 1).bisBreite / 100;
        }

        for (var i = 0; i < vorher.length; i++) {
            for (var j = 0; j < vorher[i].length; j += vorher[i].length - 1) {
                if (nachher[i][j][0] != vorher[i][j][0] || nachher[i][j][1] != vorher[i][j][1]) {
                    var pos = Vektor.get_pos(querschnitt.station.geo, nachher[i][j]);
                    var dist = Math.round(pos[4] * 100) / 100;
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

    }

    _createLinienSelect() {
        this.select = new SelectInteraction({
            layers: [this.daten.l_trenn],
            style: new Style({
                stroke: new Stroke({
                    color: 'rgba(255, 0, 0, 0.5)',
                    width: 3
                })
            })
        });
        this.select.info = this.info;
        this.select.on('select', function (e) {
            e.target.info.logAuswahl(e.target);
        });
    }

    _createFlaechenSelect() {
        this.select_fl = new SelectInteraction({
            layers: [this.daten.l_quer],
            style: new Style({
                fill: new Fill({
                    color: 'rgba(255, 0, 0, 0.3)'
                })
            })
        });
        this.select_fl.info = this.info;
        this.select_fl.select = this.select;
        this.select_fl.on('select', function (e, zwei) {
            console.log(e);
            e.target.select.getFeatures().clear();
            if (e.selected.length > 0) {
                let auswahl = e.selected[0];
                let a = auswahl.get('objekt').trenn;
                e.target.select.getFeatures().push(a);
            }
            e.target.info.logAuswahl(e.target.select);
        });
    }

    _createSnap() {
        this.snap_trenn = new Snap({
            source: this.daten.v_trenn,
            edge: false
        });
        this.snap_station = new Snap({
            source: this.daten.v_station,
            pixelTolerance: 50,
            vertex: false
        });
    }

    breiteNachfAnpassen(absid, station, streifen, nr, edit, diff) {
        querstreifen = [[absid, station, streifen, nr]];
        if (document.getElementById('modify_move').checked) {
            // Verschieben
            for (var nnr in querschnitte[absid][station]['streifen'][streifen]) {
                if (nnr <= nr)
                    continue;
                querschnitte[absid][station]['streifen'][streifen][nnr]['X' + edit + 'L'] += diff;
                querschnitte[absid][station]['streifen'][streifen][nnr]['X' + edit + 'R'] += diff;
                querstreifen.push([absid, station, streifen, nnr]);
            }
        }
        else {
            // Anpassen
            if (streifen != 'M' && (nr + 1) in querschnitte[absid][station]['streifen'][streifen]) {
                if (streifen == 'L')
                    querschnitte[absid][station]['streifen'][streifen][nr + 1]['X' + edit + 'R'] += diff;
                else if (streifen == 'R')
                    querschnitte[absid][station]['streifen'][streifen][nr + 1]['X' + edit + 'L'] += diff;
                querschnitte[absid][station]['streifen'][streifen][nr + 1]['breite'] =
                    Math.round(100 * (querschnitte[absid][station]['streifen'][streifen][nr + 1]['XVstR'] -
                        querschnitte[absid][station]['streifen'][streifen][nr + 1]['XVstL']));
                querschnitte[absid][station]['streifen'][streifen][nr + 1]['bisBreite'] =
                    Math.round(100 * (querschnitte[absid][station]['streifen'][streifen][nr + 1]['XBstR'] -
                        querschnitte[absid][station]['streifen'][streifen][nr + 1]['XBstL']));
                querstreifen.push([absid, station, streifen, nr + 1]);
            }
        }
        logAuswahl(this.select);
        refreshQuerschnitte(absid);
        updateQuerschnitt(querstreifen);
    }
    updateInfo() {
        var selection = this.select.getFeatures();
        if (this.select.getFeatures().getLength() <= 0)
            return;
        var auswahl = selection.item(0);
        var absid = auswahl.get('abschnittsid');
        var streifen = auswahl.get('streifen');
        var nr = auswahl.get('nr');
        var station = auswahl.get('station');
        querschnitte[absid][station]['streifen'][streifen][nr]['art'] = document.getElementById('info_art').value;
        querschnitte[absid][station]['streifen'][streifen][nr]['flaeche'].set('art', document.getElementById('info_art').value);
        querschnitte[absid][station]['streifen'][streifen][nr]['artober'] = document.getElementById('info_ober').value;
    }
    updateInfoBreite() {
        var selection = this.select.getFeatures();
        if (this.select.getFeatures().getLength() <= 0)
            return;
        var auswahl = selection.item(0);
        var absid = auswahl.get('abschnittsid');
        var streifen = auswahl.get('streifen');
        var nr = auswahl.get('nr');
        var station = auswahl.get('station');
        var max_diff_vst = null, max_diff_bst = null;
        if (document.getElementById('modify_fit').checked && (nr + 1) in querschnitte[absid][station]['streifen'][streifen]) {
            max_diff_vst = querschnitte[absid][station]['streifen'][streifen][nr + 1]['breite'] / 100;
            max_diff_bst = querschnitte[absid][station]['streifen'][streifen][nr + 1]['bisBreite'] / 100;
        }
        if (querschnitte[absid][station]['streifen'][streifen][nr]['breite'] != Number(document.getElementById('info_breite').value)) {
            diff = (Math.round(Number(document.getElementById('info_breite').value)) - querschnitte[absid][station]['streifen'][streifen][nr]['breite']) / 100;
            if (max_diff_vst !== null && diff > max_diff_vst) {
                diff = (max_diff_vst);
            }
            querschnitte[absid][station]['streifen'][streifen][nr]['breite'] += diff * 100;
            if (streifen == 'L') {
                querschnitte[absid][station]['streifen'][streifen][nr]['XVstL'] -= diff;
            }
            else if (streifen == 'R') {
                querschnitte[absid][station]['streifen'][streifen][nr]['XVstR'] += diff;
            }
            breiteNachfAnpassen(absid, station, streifen, nr, 'Vst', diff);
        }
        else if (querschnitte[absid][station]['streifen'][streifen][nr]['bisBreite'] != Number(document.getElementById('info_bisbreite').value)) {
            diff = (Math.round(Number(document.getElementById('info_bisbreite').value)) - querschnitte[absid][station]['streifen'][streifen][nr]['bisBreite']) / 100;
            if (max_diff_bst !== null && diff > max_diff_bst) {
                diff = (max_diff_bst);
            }
            querschnitte[absid][station]['streifen'][streifen][nr]['bisBreite'] += diff * 100;
            if (streifen == 'L') {
                querschnitte[absid][station]['streifen'][streifen][nr]['XBstL'] -= diff;
            }
            else if (streifen == 'R') {
                querschnitte[absid][station]['streifen'][streifen][nr]['XBstR'] += diff;
            }
            breiteNachfAnpassen(absid, station, streifen, nr, 'Bst', diff);
        }
    }

    start() {
        document.forms.modify.style.display = 'block';
        this.map.addInteraction(this.select);
        this.map.addInteraction(this.select_fl);
        this.map.addInteraction(this.modify);
        this.map.addInteraction(this.snap_trenn);
        this.map.addInteraction(this.snap_station);

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
    }
}

module.exports = Modify;