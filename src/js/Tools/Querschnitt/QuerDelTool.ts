import { Map, Feature } from "ol";
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
    private selectLinien: SelectInteraction;
    private selectFlaechen: SelectInteraction;

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
        let selection = this.selectFlaechen.getFeatures();
        if (this.selectLinien.getFeatures().getLength() <= 0) return;
        if (!confirm("Wollen Sie die Fläche wirklich löschen?")) return;

        let querschnitt = <Querschnitt>selection.item(0);
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
        }

        this.selectLinien.getFeatures().clear();
        this.selectFlaechen.getFeatures().clear();
        querschnitt.getStation().rewrite();

    }

    private createLinienSelect() {
        this.selectLinien = new SelectInteraction({
            layers: [this.daten.layerTrenn],
            condition: never,
            style: InfoTool.selectStyle
        });
    }

    private createFlaechenSelect() {
        this.selectFlaechen = new SelectInteraction({
            layers: [this.daten.layerQuer],
            toggleCondition: never,
            style: InfoTool.selectStyle
        });

        this.selectFlaechen.on('select', this.flaecheSelected.bind(this));
    }

    private flaecheSelected(event: SelectEvent) {
        this.selectLinien.getFeatures().clear();
        let auswahl = (this.selectFlaechen as SelectInteraction).getFeatures();
        auswahl.forEach(function (feat: Querschnitt) {
            this.selectLinien.getFeatures().push(feat.trenn);
        }.bind(this))
        this.featureSelected()
    }

    featureSelected() {
        let selection = this.selectFlaechen.getFeatures().getArray();
        if (selection.length != 1) {
            this.disableMenu();
            return;
        }
        (<HTMLButtonElement>document.getElementById("delQuerschnittButton")).disabled = false;
        let auswahl = selection[0];
        let a = (auswahl as Querschnitt).trenn;
        this.selectLinien.getFeatures().push(a);

        (this.info as InfoTool).featureSelect(this.selectFlaechen);
    }

    private disableMenu() {
        (<HTMLButtonElement>document.getElementById("delQuerschnittButton")).disabled = true;
        this.info.hideInfoBox();
    }

    start() {
        this.map.addInteraction(this.selectLinien);
        this.map.addInteraction(this.selectFlaechen);
        document.forms.namedItem("quer_del").style.display = 'block';
    }

    stop() {
        this.map.removeInteraction(this.selectLinien);
        this.map.removeInteraction(this.selectFlaechen);
        this.disableMenu()
        document.forms.namedItem("quer_del").style.display = 'none';
        this.info.hideInfoBox();
    }
}

export default QuerDelTool;