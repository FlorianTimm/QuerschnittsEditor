import { Style, Stroke } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import Querschnitt from '../../Objekte/Querschnittsdaten';
import Map from 'ol/Map';
import Daten from '../../Daten';
import QuerInfoTool from './QuerInfoTool';
import Tool from '../prototypes/Tool';
import { SelectEvent } from 'ol/interaction/Select';
import InfoTool from '../InfoTool';

/**
 * Funktion zum Hinzufügen von Querschnittsflächen
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */
class QuerAddTool extends Tool {
    private _daten: Daten;
    private _info: QuerInfoTool;
    private _select: SelectInteraction;
    private _map: Map;

    constructor(map: Map, info: QuerInfoTool) {
        super();
        this._map = map;
        this._daten = Daten.getInstanz();
        this._info = info;
        this._select = new SelectInteraction({
            layers: [this._daten.layerTrenn],
            style: InfoTool.selectStyle
        });

        this._select.on('select', function (e: SelectEvent) {
            if (e.selected.length == 0) {
                this.disableMenu();
                return
            }
            //console.log(this);
            (this._info as QuerInfoTool).getInfoFieldForFeature(e.selected[0].get("objekt"))
            document.forms.namedItem("hinzu").getElementsByTagName("input")[0].style.backgroundColor = "#ffcc00";
            document.forms.namedItem("hinzu").getElementsByTagName("input")[0].disabled = false;
        }.bind(this));

        document.getElementById("addQuerschnittButton").addEventListener('click', this.addQuerschnitt.bind(this));
    }


    private disableMenu() {
        document.forms.namedItem("hinzu").getElementsByTagName("input")[0].style.backgroundColor = "";
        document.forms.namedItem("hinzu").getElementsByTagName("input")[0].disabled = true;
        (this._info as QuerInfoTool).hideInfoBox();
    }

    start() {
        document.forms.namedItem("hinzu").style.display = 'block';
        this._map.addInteraction(this._select);
    }

    stop() {
        this.disableMenu()
        document.forms.namedItem("hinzu").style.display = 'none';
        this._map.removeInteraction(this._select);
        this._info.hideInfoBox();
    }


    addQuerschnitt() {
        let selection = this._select.getFeatures();
        if (this._select.getFeatures().getLength() <= 0) return;
        let querschnitt = <Querschnitt>selection.item(0).get('objekt');
        querschnitt.getStation().getAbschnitt().getAufbauDaten(this.addQuerschnittCallback.bind(this));
    }

    addQuerschnittCallback() {
        let selection = this._select.getFeatures();
        if (this._select.getFeatures().getLength() <= 0) return;
        let querschnitt = <Querschnitt>selection.item(0).get('objekt');
        let gesStreifen = querschnitt.getStation().getStreifen(querschnitt.getStreifen());

        let querschnittNeu = new Querschnitt();
        querschnittNeu.setBreite(275);
        querschnittNeu.setBisBreite(275);

        let strArray = []
        for (let nnr in gesStreifen) {
            if (Number(nnr) <= querschnitt.getStreifennr()) continue;
            strArray.push(gesStreifen[nnr]);
        }

        for (let quer of strArray) {
            gesStreifen[quer.getStreifennr() + 1] = quer;
            quer.setStreifennr(quer.getStreifennr() + 1);
            if (quer.getStreifen() == 'L') {
                quer.setXBstR(quer.getXBstR() - querschnittNeu.getBisBreite() / 100);
                quer.setXVstR(quer.getXVstR() - querschnittNeu.getBreite() / 100);
                quer.setXBstL(quer.getXBstL() - querschnittNeu.getBisBreite() / 100);
                quer.setXVstL(quer.getXVstL() - querschnittNeu.getBreite() / 100);
            } else if (quer.getStreifen() == 'R') {
                quer.setXBstL(quer.getXBstL() + querschnittNeu.getBisBreite() / 100);
                quer.setXVstL(quer.getXVstL() + querschnittNeu.getBreite() / 100);
                quer.setXBstR(quer.getXBstR() + querschnittNeu.getBisBreite() / 100);
                quer.setXVstR(quer.getXVstR() + querschnittNeu.getBreite() / 100);
            }
            //quer.createGeom();
            querschnitt.getStation().addQuerschnitt(quer);
        }

        if (querschnitt.getStreifen() == 'L') {
            querschnittNeu.setXBstR(querschnitt.getXBstL());
            querschnittNeu.setXVstR(querschnitt.getXVstL());
            querschnittNeu.setXBstL(querschnittNeu.getXBstR() - querschnittNeu.getBisBreite() / 100);
            querschnittNeu.setXVstL(querschnittNeu.getXVstR() - querschnittNeu.getBreite() / 100);
        } else if (querschnitt.getStreifen() == 'R') {
            querschnittNeu.setXBstL(querschnitt.getXBstR());
            querschnittNeu.setXVstL(querschnitt.getXVstR());
            querschnittNeu.setXBstR(querschnittNeu.getXBstL() + querschnittNeu.getBisBreite() / 100);
            querschnittNeu.setXVstR(querschnittNeu.getXVstL() + querschnittNeu.getBreite() / 100);
        }

        querschnittNeu.setProjekt(querschnitt.getProjekt());
        querschnittNeu.setStreifen(querschnitt.getStreifen());
        querschnittNeu.setStreifennr(querschnitt.getStreifennr() + 1);
        querschnittNeu.setArt(querschnitt.getArt());
        querschnittNeu.setArtober(querschnitt.getArtober());
        querschnittNeu.setStation(querschnitt.getStation());
        querschnittNeu.setVst(querschnitt.getVst());
        querschnittNeu.setBst(querschnitt.getBst());
        querschnittNeu.setAbschnittId(querschnitt.getAbschnittId());
        gesStreifen[querschnittNeu.getStreifennr()] = querschnittNeu;
        //querschnittNeu.createGeom();
        querschnitt.getStation().addQuerschnitt(querschnittNeu);

        this._select.getFeatures().clear();
        this._info.hideInfoBox();
        querschnitt.getStation().rewrite();
    }

}

export default QuerAddTool;