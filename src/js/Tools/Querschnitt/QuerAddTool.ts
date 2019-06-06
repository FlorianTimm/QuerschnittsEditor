import { Style, Stroke } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import PublicWFS from '../../PublicWFS';
import Querschnitt from '../../Objekte/Querschnittsdaten';
import Map from 'ol/Map';
import Daten from '../../Daten';
import QuerInfoTool from './QuerInfoTool';
import Tool from '../Tool';

/**
 * Funktion zum Hinzufügen von Querschnittsflächen
 * @author Florian Timm, LGV HH 
 * @version 2019.05.20
 * @copyright MIT
 */
class QuerAddTool implements Tool {
    private _daten: Daten;
    private _info: QuerInfoTool;
    private _select: SelectInteraction;
    private _map: Map;

    constructor(map: Map, daten: Daten, info: QuerInfoTool) {
        this._map = map;
        this._daten = daten;
        this._info = info;
        this._select = new SelectInteraction({
            layers: [this._daten.l_trenn],
            style: new Style({
                stroke: new Stroke({
                    color: 'rgba(255, 0, 0, 0.5)',
                    width: 5
                })
            })
        });

        this._select.on('select', function (e) {
            if (e.selected.length == 0) {
                document.forms.namedItem("hinzu").getElementsByTagName("input")[0].style.backgroundColor = "";
                document.forms.namedItem("hinzu").getElementsByTagName("input")[0].disabled = true;
                return
            }

            this.info.logAuswahl(this.select);
            document.forms.namedItem("hinzu").getElementsByTagName("input")[0].style.backgroundColor = "#ffcc00";
            document.forms.namedItem("hinzu").getElementsByTagName("input")[0].disabled = false;
        }.bind(this));

        document.getElementById("addQuerschnittButton").addEventListener('click', this.addQuerschnitt.bind(this));
    }

    start() {
        document.forms.namedItem("hinzu").style.display = 'block';
        this._map.addInteraction(this._select);
    }

    stop() {
        document.forms.namedItem("hinzu").style.display = 'none';
        this._map.removeInteraction(this._select);
        document.forms.namedItem("info").style.display = "none";
    }


    addQuerschnitt() {
        let selection = this._select.getFeatures();
        if (this._select.getFeatures().getLength() <= 0) return;
        let querschnitt = selection.item(0).get('objekt');
        let gesStreifen = querschnitt.station.getStreifen(querschnitt.streifen);
        let soap = "";

        let querschnittNeu = new Querschnitt(this._daten);
        querschnittNeu.breite = 2.75;
        querschnittNeu.bisBreite = 2.75;

        let strArray = []
        for (let nnr in gesStreifen) {
            if (nnr <= querschnitt.streifennr) continue;
            strArray.push(gesStreifen[nnr]);
        }
        console.log(strArray);

        for (let quer of strArray) {
            gesStreifen[quer.streifennr + 1] = quer;
            quer.streifennr = quer.streifennr + 1;
            if (quer.streifen == 'L') {
                quer.XBstR -= querschnittNeu.bisBreite;
                quer.XVstR -= querschnittNeu.breite;
                quer.XBstL -= querschnittNeu.bisBreite;
                quer.XVstL -= querschnittNeu.breite;
            } else if (quer.streifen == 'R') {
                quer.XBstL += querschnittNeu.bisBreite;
                quer.XVstL += querschnittNeu.breite;
                quer.XBstR += querschnittNeu.bisBreite;
                quer.XVstR += querschnittNeu.breite;
            }
            quer.createGeom();
            soap += quer.createUpdateStreifenXML();
        }


        if (querschnitt.streifen == 'L') {
            querschnittNeu.XBstR = querschnitt.XBstL;
            querschnittNeu.XVstR = querschnitt.XVstL;
            querschnittNeu.XBstL = querschnittNeu.XBstR - querschnittNeu.bisBreite;
            querschnittNeu.XVstL = querschnittNeu.XVstR - querschnittNeu.breite;
        } else if (querschnitt.streifen == 'R') {
            querschnittNeu.XBstL = querschnitt.XBstR;
            querschnittNeu.XVstL = querschnitt.XVstR;
            querschnittNeu.XBstR = querschnittNeu.XBstL + querschnittNeu.bisBreite;
            querschnittNeu.XVstR = querschnittNeu.XVstL + querschnittNeu.breite;
        }

        querschnittNeu.streifen = querschnitt.streifen;
        querschnittNeu.streifennr = querschnitt.streifennr + 1;
        querschnittNeu.art = querschnitt.art;
        querschnittNeu.artober = querschnitt.artober;
        querschnittNeu.station = querschnitt.station;
        querschnittNeu.vst = querschnitt.vst;
        querschnittNeu.bst = querschnitt.bst;
        querschnittNeu.abschnittId = querschnitt.abschnittId;
        gesStreifen[querschnittNeu.streifennr] = querschnittNeu;
        querschnittNeu.createGeom();

        soap += querschnittNeu.createInsertXML();

        console.log(soap);
        PublicWFS.showMessage("Noch nicht möglich", true);
    }


    insertQuerschnittDb(abschnittid, station) {


    }
}

export default QuerAddTool;