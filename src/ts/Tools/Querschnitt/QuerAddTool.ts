import { Select as SelectInteraction } from 'ol/interaction';
import Querschnitt from '../../Objekte/Querschnittsdaten';
import QuerInfoTool from './QuerInfoTool';
import Tool from '../prototypes/Tool';
import { SelectEvent } from 'ol/interaction/Select';
import InfoTool from '../InfoTool';
import HTML from '../../HTML';
import { VectorLayer } from '../../openLayers/Layer';
import Map from "../../openLayers/Map";

import "../../import_jquery.js";
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css'

/**
 * Funktion zum Hinzufügen von Querschnittsflächen
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */
class QuerAddTool extends Tool {
    private _info: QuerInfoTool;
    private _select: SelectInteraction;
    private form: HTMLFormElement = null;
    button: HTMLInputElement;

    constructor(map: Map, info: QuerInfoTool, layerTrennLinien: VectorLayer) {
        super(map);
        this._info = info;
        this._select = new SelectInteraction({
            layers: [layerTrennLinien],
            style: InfoTool.selectStyle,
            hitTolerance: 10
        });

        this._select.on('select', this.selected.bind(this));
    }

    private createForm() {
        if (this.form != null) return;
        this.form = HTML.createToolForm(document.getElementById('sidebar'), false, 'hinzu');
        this.button = HTML.createButton(this.form, "Querschnitt hinzufügen", "addQuerschnittButton");
        this.button.addEventListener('click', this.addQuerschnitt.bind(this));
        this.button.disabled = true;
    }

    private selected(e: SelectEvent) {
        if (e.selected.length != 1) {
            this.disableMenu();
            return
        }

        (this._info as QuerInfoTool).getInfoFieldForFeature(e.selected[0].get("objekt"))
        this.button.disabled = false;
    }

    private disableMenu() {
        if (this.form != null) {
            this.button.disabled = true;
        }
        (this._info as QuerInfoTool).hideInfoBox();
    }

    start() {
        this.createForm();
        if (this.form != null) $(this.form).show("fast");
        this.map.addInteraction(this._select);
    }

    stop() {
        if (this.form != null) $(this.form).hide("fast");
        this.disableMenu()
        this.map.removeInteraction(this._select);
        this._info.hideInfoBox();
    }


    addQuerschnitt() {
        let selection = this._select.getFeatures();
        if (this._select.getFeatures().getLength() != 1) return;
        let querschnitt = <Querschnitt>selection.item(0).get('objekt');
        let streifen = querschnitt.getStreifen();
        if (streifen == "M") {
            this.askWhichSide(querschnitt);
        } else {
            this.loadAufbaudaten(querschnitt, streifen);
        }
        this._select.getFeatures().clear();
        this._info.hideInfoBox();
        this.disableMenu();
    }

    private askWhichSide(querschnitt: Querschnitt) {
        let dialog = document.createElement("div");
        document.body.appendChild(dialog);
        dialog.innerHTML = "Auf welcher Seite soll der Querschnitt hinzugefügt werden?"
        let jqueryDialog = $(dialog).dialog({
            resizable: false,
            height: "auto",
            width: 400,
            title: "Querschnitt hinzufügen",
            modal: true,
            buttons: {
                "Links": () => {
                    this.loadAufbaudaten(querschnitt, "L");
                    jqueryDialog.dialog("close");
                },
                "Rechts": () => {
                    this.loadAufbaudaten(querschnitt, "R");
                    jqueryDialog.dialog("close");
                },
                "Abbrechen": function () {
                    jqueryDialog.dialog("close");
                }
            }
        });
    }

    private loadAufbaudaten(querschnitt: Querschnitt, seite: "R" | "L"): Promise<void> {
        return querschnitt.getStation().getAbschnitt().getAufbauDaten()
            .then(() => { this.addQuerschnittCallback(seite, querschnitt) });
    }

    private addQuerschnittCallback(seite: 'L' | 'R', querschnitt: Querschnitt) {
        let gesStreifen = querschnitt.getStation().getStreifen(seite);
        let querschnittNeu = new Querschnitt();
        querschnittNeu.setBreite(275);
        querschnittNeu.setBisBreite(275);
        querschnittNeu.setStreifen(seite)

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

        if (seite == 'L') {
            querschnittNeu.setXBstR(querschnitt.getXBstL());
            querschnittNeu.setXVstR(querschnitt.getXVstL());
            querschnittNeu.setXBstL(querschnittNeu.getXBstR() - querschnittNeu.getBisBreite() / 100);
            querschnittNeu.setXVstL(querschnittNeu.getXVstR() - querschnittNeu.getBreite() / 100);
        } else if (seite == 'R') {
            querschnittNeu.setXBstL(querschnitt.getXBstR());
            querschnittNeu.setXVstL(querschnitt.getXVstR());
            querschnittNeu.setXBstR(querschnittNeu.getXBstL() + querschnittNeu.getBisBreite() / 100);
            querschnittNeu.setXVstR(querschnittNeu.getXVstL() + querschnittNeu.getBreite() / 100);
        }

        querschnittNeu.setProjekt(querschnitt.getProjekt());
        querschnittNeu.setStreifen(seite);
        querschnittNeu.setStreifennr(querschnitt.getStreifennr() + 1);
        querschnittNeu.setArt(querschnitt.getArt());
        querschnittNeu.setArtober(querschnitt.getArtober());
        querschnittNeu.setStation(querschnitt.getStation());
        querschnittNeu.setVst(querschnitt.getVst());
        querschnittNeu.setBst(querschnitt.getBst());
        querschnittNeu.setAbschnittId(querschnitt.getAbschnittId());
        console.log(gesStreifen)
        gesStreifen[querschnittNeu.getStreifennr()] = querschnittNeu;
        console.log(gesStreifen)
        //querschnittNeu.createGeom();
        querschnitt.getStation().addQuerschnitt(querschnittNeu);

        querschnitt.getStation().rewrite();
    }

}

export default QuerAddTool;