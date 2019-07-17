import { Map } from "ol";
import Daten from '../../Daten';
import QuerInfoTool from "./QuerInfoTool";
import Tool from '../Tool';
import { Fill, Stroke, Style } from 'ol/style';
import { never } from 'ol/events/condition';
import { SelectInteraction } from '../../openLayers/Interaction'
import Querschnitt from "src/js/Objekte/Querschnittsdaten";

/**
 * Funktion zum Löschen von Querschnitten
 * @author Florian Timm, LGV HH 
 * @version 2019.05.20
 * @copyright MIT
 */
class QuerDelTool implements Tool {
    private map: Map;
    private daten: Daten;
    private info: QuerInfoTool;
    private select: SelectInteraction;
    private select_fl: SelectInteraction;

    constructor(map: Map, info: QuerInfoTool) {
        this.map = map;
        this.daten = Daten.getInstanz();
        this.info = info;

        this.createLinienSelect();
        this.createFlaechenSelect();

        document.getElementById("delQuerschnittButton").addEventListener("click", this.querschnittLoeschenButton.bind(this))
    }

    private querschnittLoeschenButton() {
        let selection = this.select.getFeatures();
        if (this.select.getFeatures().getLength() <= 0) return;
        if (!("Wollen Sie die Fläche wirklich löschen?")) return;

        let querschnitt = <Querschnitt>selection.item(0).get('objekt');
        let gesStreifen = querschnitt.station.getStreifen(querschnitt.streifen);
        querschnitt.station.deleteStreifen(querschnitt.streifen, querschnitt.streifennr)
        for (let nr in gesStreifen) {
            let quer = gesStreifen[nr];
            quer.streifennr = quer.streifennr - 1;
            if (quer.streifen == 'L') {
                quer.XBstR += querschnitt.bisBreite / 100;
                quer.XVstR += querschnitt.breite / 100;
                quer.XBstL += querschnitt.bisBreite / 100;
                quer.XVstL += querschnitt.breite / 100;
            } else if (quer.streifen == 'R') {
                quer.XBstL -= querschnitt.bisBreite / 100;
                quer.XVstL -= querschnitt.breite / 100;
                quer.XBstR -= querschnitt.bisBreite / 100;
                quer.XVstR -= querschnitt.breite / 100;
            }
            //querschnitt.station.addQuerschnitt(quer);
        }

        this.select.getFeatures().clear();
        this.select_fl.getFeatures().clear();
        querschnitt.station.rewrite();

    }

    private createLinienSelect() {
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
        }.bind(this));
    }

    private createFlaechenSelect() {
        this.select_fl = new SelectInteraction({
            layers: [this.daten.l_quer],
            toggleCondition: never,
            style: new Style({
                fill: new Fill({
                    color: 'rgba(255, 0, 0, 0.3)'
                })
            })
        });

        this.select_fl.on('select', function (e, zwei) {
            this.select.getFeatures().clear();
            let selection = this.select_fl.getFeatures().getArray();
            if (selection.length != 1) {
                (<HTMLButtonElement>document.getElementById("delQuerschnittButton")).disabled = true;
                return;
            }
            (<HTMLButtonElement>document.getElementById("delQuerschnittButton")).disabled = false;
            let auswahl = selection[0];
            let a = auswahl.get('objekt').trenn;
            this.select.getFeatures().push(a);

            this.info.logAuswahl(this.select);
        }.bind(this));
    }

    start() {
        this.map.addInteraction(this.select);
        this.map.addInteraction(this.select_fl);
        document.forms.namedItem("quer_del").style.display = 'block';
    }

    stop() {
        this.map.removeInteraction(this.select);
        this.map.removeInteraction(this.select_fl);
        (<HTMLButtonElement>document.getElementById("delQuerschnittButton")).disabled = true;
        document.forms.namedItem("quer_del").style.display = 'none';
        document.forms.namedItem("info").style.display = "none";
    }
}

export default QuerDelTool;