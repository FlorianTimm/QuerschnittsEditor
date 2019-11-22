import { Feature, Collection } from "ol";
import QuerInfoTool from "./QuerInfoTool";
import Tool from '../prototypes/Tool';
import { never } from 'ol/events/condition';
import { SelectInteraction } from '../../openLayers/Interaction'
import Querschnitt from "../../Objekte/Querschnittsdaten";
import InfoTool from "../InfoTool";
import { VectorLayer } from "../../openLayers/Layer";
import Map from "../../openLayers/Map";

/**
 * Funktion zum Löschen von Querschnitten
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */

class QuerDelTool extends Tool {
    private info: QuerInfoTool;
    private selectLinien: SelectInteraction;
    private selectFlaechen: SelectInteraction;

    constructor(map: Map, info: QuerInfoTool, layerTrenn: VectorLayer, layerQuer: VectorLayer) {
        super(map);
        this.info = info;

        this.createLinienSelect(layerTrenn);
        this.createFlaechenSelect(layerQuer);

        document.getElementById("delQuerschnittButton").addEventListener("click", this.querschnittLoeschenButton.bind(this))
    }

    private querschnittLoeschenButton() {
        let selection = this.selectFlaechen.getFeatures() as Collection<Querschnitt>;
        if (selection.getLength() <= 0) return;
        let querschnitt = <Querschnitt>selection.item(0);

        let dialog = document.createElement("div");
        document.body.appendChild(dialog);
        dialog.innerHTML = "Wollen Sie die Fläche wirklich löschen?"
        let jqueryDialog = $(dialog).dialog({
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            buttons: {
                "Ja": function (this: QuerDelTool) {
                    this.confirmedDelete(querschnitt);
                    jqueryDialog.dialog("close");
                }.bind(this),
                "Nein": function () {
                    jqueryDialog.dialog("close");
                }
            }
        });
    }

    private confirmedDelete(querschnitt: Querschnitt) {
        if (querschnitt.getStreifen() == 'M') return; // Keine Mittelstreifen löschen
        querschnitt.getStreifennr
        let gesStreifen = querschnitt.getStation().getStreifen(querschnitt.getStreifen());
        querschnitt.getStation().deleteStreifen(querschnitt.getStreifen(), querschnitt.getStreifennr());

        for (let nr in gesStreifen) {
            let quer = gesStreifen[nr];
            if (quer.getStreifennr() <= querschnitt.getStreifennr()) continue;

            quer.setStreifennr(quer.getStreifennr() - 1);
            if (quer.getStreifen() == 'L') {
                quer.setXBstR(quer.getXBstR() + querschnitt.getBisBreite() / 100);
                quer.setXVstR(quer.getXVstR() + querschnitt.getBreite() / 100);
                quer.setXBstL(quer.getXBstL() + querschnitt.getBisBreite() / 100);
                quer.setXVstL(quer.getXVstL() + querschnitt.getBreite() / 100);
            }
            else if (quer.getStreifen() == 'R') {
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

    private createLinienSelect(layerTrenn: VectorLayer) {
        this.selectLinien = new SelectInteraction({
            layers: [layerTrenn],
            condition: never,
            style: InfoTool.selectStyle
        });
    }

    private createFlaechenSelect(layerQuer: VectorLayer) {
        this.selectFlaechen = new SelectInteraction({
            layers: [layerQuer],
            toggleCondition: never,
            style: InfoTool.selectStyle
        });

        this.selectFlaechen.on('select', this.flaecheSelected.bind(this));
    }

    private flaecheSelected() {
        this.selectLinien.getFeatures().clear();
        let auswahl = (this.selectFlaechen as SelectInteraction).getFeatures();
        auswahl.forEach(function (this: QuerDelTool, feat: Feature) {
            this.selectLinien.getFeatures().push((feat as Querschnitt).trenn);
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