import { Map } from "ol";
import Daten from '../../Daten';
import QuerInfoTool from "./QuerInfoTool";
import Tool from '../prototypes/Tool';
import { Fill, Stroke, Style } from 'ol/style';
import { never } from 'ol/events/condition';
import { SelectInteraction } from '../../openLayers/Interaction'
import Querschnitt from "src/js/Objekte/Querschnittsdaten";
import InfoTool from "../InfoTool";
import { SelectEvent } from "ol/interaction/Select";

/**
 * Funktion zum Löschen von Querschnitten
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */
class QuerDelTool extends Tool {
    private map: Map;
    private daten: Daten;
    private info: QuerInfoTool;
    private select: SelectInteraction;
    private select_fl: SelectInteraction;

    constructor(map: Map, info: QuerInfoTool) {
        super();
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
        let gesStreifen = querschnitt.getStation().getStreifen(querschnitt.getStreifen());
        querschnitt.getStation().deleteStreifen(querschnitt.getStreifen(), querschnitt.getStreifennr())
        for (let nr in gesStreifen) {
            let quer = gesStreifen[nr];
            quer.setStreifennr(quer.getStreifennr() - 1);
            if (quer.getStreifen() == 'L') {
                quer.setXBstR(quer.getXBstR() + querschnitt.getBisBreite() / 100);
                quer.setXVstR(quer.getXVstR() + querschnitt.getBreite() / 100);
                quer.setXBstL(quer.getXBstL() + querschnitt.getBisBreite() / 100);
                quer.setXVstL(quer.getXVstL() + querschnitt.getBreite() / 100);
            } else if (quer.getStreifen() == 'R') {
                quer.setXBstL(quer.getXBstL() - querschnitt.getBisBreite() / 100);
                quer.setXVstL(quer.getXVstL() - querschnitt.getBreite() / 100);
                quer.setXBstR(quer.getXBstR() - querschnitt.getBisBreite() / 100);
                quer.setXVstR(quer.getXVstR() - querschnitt.getBreite() / 100);
            }
            //querschnitt.getStation().addQuerschnitt(quer);
        }

        this.select.getFeatures().clear();
        this.select_fl.getFeatures().clear();
        querschnitt.getStation().rewrite();

    }

    private createLinienSelect() {
        this.select = new SelectInteraction({
            layers: [this.daten.layerTrenn],
            toggleCondition: never,
            style: InfoTool.selectStyle
        });
        this.select.info = this.info;
        this.select.on('select', function (e) {
            this.select_fl.getFeatures().clear();
            let auswahl = (this.select as SelectInteraction).getFeatures();
            if (auswahl.getLength() > 0) {
                this.select_fl.getFeatures().push(auswahl.item(0).get("objekt"))
            }
            this.featureSelected()
        }.bind(this));
    }

    private createFlaechenSelect() {
        this.select_fl = new SelectInteraction({
            layers: [this.daten.layerQuer],
            toggleCondition: never,
            style: InfoTool.selectStyle
        });

        this.select_fl.on('select', function (e, zwei) {
            this.select.getFeatures().clear();
            let auswahl = (this.select_fl as SelectInteraction).getFeatures();
            if (auswahl.getLength() > 0) {
                this.select.getFeatures().push((auswahl.item(0) as Querschnitt).trenn)
            }
            this.featureSelected()
        }.bind(this));
    }

    featureSelected() {
        let selection = this.select_fl.getFeatures().getArray();
        if (selection.length != 1) {
            this.disableMenu();
            return;
        }
        (<HTMLButtonElement>document.getElementById("delQuerschnittButton")).disabled = false;
        let auswahl = selection[0];
        let a = (auswahl as Querschnitt).trenn;
        this.select.getFeatures().push(a);

        (this.info as InfoTool).featureSelect(this.select_fl);
    }

    private disableMenu() {
        (<HTMLButtonElement>document.getElementById("delQuerschnittButton")).disabled = true;
        this.info.hideInfoBox();
    }

    start() {
        this.map.addInteraction(this.select);
        this.map.addInteraction(this.select_fl);
        document.forms.namedItem("quer_del").style.display = 'block';
    }

    stop() {
        this.map.removeInteraction(this.select);
        this.map.removeInteraction(this.select_fl);
        this.disableMenu()
        document.forms.namedItem("quer_del").style.display = 'none';
        document.forms.namedItem("info").style.display = "none";
    }
}

export default QuerDelTool;