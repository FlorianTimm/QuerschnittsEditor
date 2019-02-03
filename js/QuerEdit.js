import { Select, Modify } from 'ol/interaction';
import { Style, Fill, Stroke } from 'ol/style';
import never from 'ol/events/condition';


class QuerEdit {
    constructor(querschnitte) {
        this.querschnitte = querschnitte;
        this.select = new Select({
            layers: [this.querschnitte.l_trenn],
            style: new Style({
                stroke: new Stroke({
                    color: 'rgba(255, 0, 0, 0.5)',
                    width: 3
                })
            })
        });
        this.select.on('select', function (e) {
            logAuswahl(this.select);
        });
        this.select_fl = new Select({
            layers: [this.querschnitte.l_quer],
            style: new Style({
                fill: new Fill({
                    color: 'rgba(255, 0, 0, 0.3)'
                })
            })
        });
        this.select_fl.on('select', function (e) {
            this.select.getFeatures().clear();
            if (e.selected.length > 0) {
                auswahl = e.selected[0];
                var absid = auswahl.get('abschnittsid');
                var streifen = auswahl.get('streifen');
                var nr = auswahl.get('nr');
                var station = auswahl.get('station');
                a = querschnitte[absid][station]['streifen'][streifen][nr]['trenn'];
                this.select.getFeatures().push(a);
            }
            logAuswahl(this.select);
            //this.select_fl.getFeatures().clear()
        });
        this.modify = new Modify({
            deleteCondition: never,
            insertVertexCondition: never,
            features: this.select.getFeatures()
        });
        this.geo_vorher = null;
        this.modify.on('modifystart', function (e) {
            auswahl = e.features.getArray()[0];
            this.geo_vorher = auswahl.getGeometry().clone();
        });
        this.modify.on('modifyend', function (e) {
            console.log(e);
            auswahl = e.features.getArray()[0];
            var absid = auswahl.get('abschnittsid');
            var streifen = auswahl.get('streifen');
            var nr = auswahl.get('nr');
            var station = auswahl.get('station');
            var nachher = auswahl.getGeometry().getCoordinates();
            var vorher = this.geo_vorher.getCoordinates();
            var diff = 0, edit = null;
            var max_diff_vst = null, max_diff_bst = null;
            if (document.getElementById("modify_fit").checked && (nr + 1) in querschnitte[absid][station]['streifen'][streifen]) {
                max_diff_vst = querschnitte[absid][station]['streifen'][streifen][nr + 1]['breite'] / 100;
                max_diff_bst = querschnitte[absid][station]['streifen'][streifen][nr + 1]['bisBreite'] / 100;
            }
            for (var i = 0; i < vorher.length; i++) {
                for (var j = 0; j < vorher[i].length; j += vorher[i].length - 1) {
                    if (nachher[i][j][0] != vorher[i][j][0] || nachher[i][j][1] != vorher[i][j][1]) {
                        var pos = get_pos(querschnitte[absid][station]['geo'], nachher[i][j]);
                        var dist = Math.round(pos[4] * 100) / 100;
                        if (streifen == "L")
                            dist *= -1;
                        console.log(pos);
                        if (j > 0) {
                            diff = dist - querschnitte[absid][station]['streifen'][streifen][nr]['XBst' + streifen];
                            console.log((streifen == 'L') ? (-diff) : (diff));
                            console.log(max_diff_bst);
                            if (max_diff_bst !== null && ((streifen == 'L') ? (-diff) : (diff)) > max_diff_bst) {
                                diff = ((streifen == 'L') ? (-max_diff_bst) : (max_diff_bst));
                            }
                            edit = "Bst";
                            querschnitte[absid][station]['streifen'][streifen][nr]['XBst' + streifen] += diff;
                            querschnitte[absid][station]['streifen'][streifen][nr]['bisBreite'] =
                                Math.round(100 * (querschnitte[absid][station]['streifen'][streifen][nr]['XBstR'] -
                                    querschnitte[absid][station]['streifen'][streifen][nr]['XBstL']));
                        }
                        else {
                            diff = dist - querschnitte[absid][station]['streifen'][streifen][nr]['XVst' + streifen];
                            edit = "Vst";
                            console.log((streifen == 'L') ? (-diff) : (diff));
                            console.log(max_diff_vst);
                            if (max_diff_vst !== null && ((streifen == 'L') ? (-diff) : (diff)) > max_diff_vst) {
                                diff = ((streifen == 'L') ? (-max_diff_vst) : (max_diff_vst));
                            }
                            querschnitte[absid][station]['streifen'][streifen][nr]['XVst' + streifen] += diff;
                            querschnitte[absid][station]['streifen'][streifen][nr]['breite'] =
                                Math.round(100 * (querschnitte[absid][station]['streifen'][streifen][nr]['XVstR'] -
                                    querschnitte[absid][station]['streifen'][streifen][nr]['XVstL']));
                        }
                        break;
                    }
                }
            }
            if (edit == null)
                return;
            breiteNachfAnpassen(absid, station, streifen, nr, edit, diff);
        });
    };

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
            if (streifen != "M" && (nr + 1) in querschnitte[absid][station]['streifen'][streifen]) {
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
        querschnitte[absid][station]['streifen'][streifen][nr]['art'] = document.getElementById("info_art").value;
        querschnitte[absid][station]['streifen'][streifen][nr]['flaeche'].set('art', document.getElementById("info_art").value);
        querschnitte[absid][station]['streifen'][streifen][nr]['artober'] = document.getElementById("info_ober").value;
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
        if (querschnitte[absid][station]['streifen'][streifen][nr]['breite'] != Number(document.getElementById("info_breite").value)) {
            diff = (Math.round(Number(document.getElementById("info_breite").value)) - querschnitte[absid][station]['streifen'][streifen][nr]['breite']) / 100;
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
            breiteNachfAnpassen(absid, station, streifen, nr, "Vst", diff);
        }
        else if (querschnitte[absid][station]['streifen'][streifen][nr]['bisBreite'] != Number(document.getElementById("info_bisbreite").value)) {
            diff = (Math.round(Number(document.getElementById("info_bisbreite").value)) - querschnitte[absid][station]['streifen'][streifen][nr]['bisBreite']) / 100;
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
            breiteNachfAnpassen(absid, station, streifen, nr, "Bst", diff);
        }
    }
}

module.exports = QuerEdit;