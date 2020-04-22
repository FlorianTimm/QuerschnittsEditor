// SPDX-License-Identifier: GPL-3.0-or-later

import { Collection } from "ol";
import QuerInfoTool from "./QuerInfoTool";
import Tool from '../prototypes/Tool';
import { never } from 'ol/events/condition';
import { SelectInteraction } from '../../openLayers/Interaction'
import Querschnitt from "../../Objekte/Querschnittsdaten";
import InfoTool from "../InfoTool";
import Map from "../../openLayers/Map";
import PublicWFS from "../../PublicWFS";
import { unByKey } from "ol/Observable";
import { EventsKey } from "ol/events";

/**
 * Funktion zum Löschen von Querschnitten
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.04.22
 * @license GPL-3.0-or-later
*/
class QuerDelTool extends Tool {
    private info: QuerInfoTool;
    private selectLinien: SelectInteraction;
    private selectFlaechen: SelectInteraction;
    selectEventsKey: EventsKey;

    constructor(map: Map, info: QuerInfoTool) {
        super(map);
        this.info = info;

        this.selectLinien = Querschnitt.getSelectLinien();
        this.selectFlaechen = Querschnitt.getSelectFlaechen();

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
                "Ja": () => {
                    this.confirmedDelete(querschnitt);
                    jqueryDialog.dialog("close");
                },
                "Nein": () => {
                    jqueryDialog.dialog("close");
                }
            }
        });
    }

    private confirmedDelete(querschnitt: Querschnitt) {
        if (querschnitt.getStreifen() == 'M') return; // Keine Mittelstreifen löschen
        this.info.hideInfoBox();
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
        querschnitt.getStation().rewrite()
            .then(() => {
                PublicWFS.showMessage("Erfolgreich gelöscht")
            })
            .catch(() => {
                PublicWFS.showMessage("Fehler beim Löschen", true)
            });
    }

    featureSelected() {
        console.log("select")
        let selection = this.selectFlaechen.getFeatures().getArray();
        if (selection.length != 1) {
            this.disableMenu();
            return;
        }
        (<HTMLButtonElement>document.getElementById("delQuerschnittButton")).disabled = false;

        (this.info as InfoTool).featureSelect(this.selectFlaechen);
    }

    private disableMenu() {
        (<HTMLButtonElement>document.getElementById("delQuerschnittButton")).disabled = true;
        this.info.hideInfoBox();
    }

    start() {
        Querschnitt.setSelectLinienCondition(never);
        this.map.addInteraction(this.selectLinien);
        this.map.addInteraction(this.selectFlaechen);
        document.forms.namedItem("quer_del").style.display = 'block';
        this.selectEventsKey = this.selectFlaechen.on('select', this.featureSelected.bind(this));
        this.featureSelected();
    }

    stop() {
        Querschnitt.setSelectLinienCondition();
        this.map.removeInteraction(this.selectLinien);
        this.map.removeInteraction(this.selectFlaechen);
        this.disableMenu()
        document.forms.namedItem("quer_del").style.display = 'none';
        this.info.hideInfoBox();
        unByKey(this.selectEventsKey);
    }
}

export default QuerDelTool;