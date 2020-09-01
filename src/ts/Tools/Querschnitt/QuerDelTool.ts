// SPDX-License-Identifier: GPL-3.0-or-later

import { Collection } from "ol";
import QuerInfoTool from "./QuerInfoTool";
import Tool from '../prototypes/Tool';
import { never, platformModifierKeyOnly } from 'ol/events/condition';
import { SelectInteraction } from '../../openLayers/Interaction'
import Querschnitt from "../../Objekte/Querschnittsdaten";
import InfoTool from "../InfoTool";
import Map from "../../openLayers/Map";
import PublicWFS from "../../PublicWFS";
import { unByKey } from "ol/Observable";
import { EventsKey } from "ol/events";
import QuerStation from "../../Objekte/QuerStation";
import { stat } from "fs";

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
    private button: HTMLButtonElement;
    selectEventsKey: EventsKey;

    constructor(map: Map, info: QuerInfoTool) {
        super(map);
        this.info = info;

        this.selectLinien = Querschnitt.getSelectLinien();
        this.selectFlaechen = Querschnitt.getSelectFlaechen();

        this.button = <HTMLButtonElement>document.getElementById("delQuerschnittButton");
        this.button.addEventListener("click", this.querschnittLoeschenButton.bind(this))
    }

    private querschnittLoeschenButton() {
        let selection = this.selectFlaechen.getFeatures() as Collection<Querschnitt>;
        if (selection.getLength() <= 0) return;
        let querschnitt = selection.getArray();

        let dialog = document.createElement("div");
        document.body.appendChild(dialog);
        if (selection.getLength() > 1) {
            dialog.innerHTML = "Wollen Sie die " + selection.getLength() + " Flächen wirklich löschen?"
        } else {
            dialog.innerHTML = "Wollen Sie die Fläche wirklich löschen?"
        }

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

    private confirmedDelete(querschnittCollection: Querschnitt[]) {
        this.info.hideInfoBox();

        let stationen: { [id: string]: QuerStation } = {};

        for (let querschnitt of querschnittCollection) {
            if (querschnitt.getStreifen() == 'M') return; // Keine Mittelstreifen löschen

            let station = querschnitt.getStation();
            stationen[station.getAbschnitt().getAbschnittid() + "" + station.getVst()] = station;

            let gesStreifen = station.getStreifen(querschnitt.getStreifen());
            station.deleteStreifen(querschnitt.getStreifen(), querschnitt.getStreifennr());

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
        };

        this.selectLinien.getFeatures().clear();
        this.selectFlaechen.getFeatures().clear();

        let stationRewriter: Promise<Querschnitt[]>[] = [];
        for (let stationId in stationen) {
            let station = stationen[stationId];
            stationRewriter.push(station.rewrite())
        }

        Promise.all(stationRewriter)
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
        console.log(selection)
        if (selection.length < 1) {
            this.disableMenu();
            this.button.disabled = true;
            this.button.value = "Querschnitt löschen";
            return;
        } else if (selection.length == 1) {
            (this.info as InfoTool).featureSelect(this.selectFlaechen);
        } else {
            this.info.hideInfoBox();
        }
        this.button.value = selection.length + " Querschnitte löschen";
        this.button.disabled = false;
    }

    private disableMenu() {
        this.button.disabled = true;
        this.info.hideInfoBox();
    }

    start() {
        Querschnitt.setSelectLinienCondition(never);
        Querschnitt.setSelectFlaechenToggleCondition(platformModifierKeyOnly);
        Querschnitt.setSelectLinienCondition(never);
        this.map.addInteraction(this.selectLinien);
        this.map.addInteraction(this.selectFlaechen);
        document.forms.namedItem("quer_del").style.display = 'block';
        this.selectEventsKey = this.selectFlaechen.on('select', this.featureSelected.bind(this));
        this.featureSelected();
    }

    stop() {
        Querschnitt.setSelectLinienCondition();
        Querschnitt.setSelectFlaechenToggleCondition();
        unByKey(this.selectEventsKey)

        if (this.selectFlaechen.getFeatures().getLength() > 1) {
            this.selectFlaechen.getFeatures().clear();
            this.selectLinien.getFeatures().clear();
        }

        this.map.removeInteraction(this.selectLinien);
        this.map.removeInteraction(this.selectFlaechen);
        this.disableMenu()
        document.forms.namedItem("quer_del").style.display = 'none';
        this.info.hideInfoBox();
        unByKey(this.selectEventsKey);
    }
}

export default QuerDelTool;