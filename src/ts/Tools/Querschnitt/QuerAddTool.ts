// SPDX-License-Identifier: GPL-3.0-or-later

import "../../import_jquery.js";
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css';
import { Feature } from 'ol';
import { EventsKey } from 'ol/events';
import { platformModifierKeyOnly } from 'ol/events/condition';
import { LineString } from 'ol/geom';
import { Select as SelectInteraction } from 'ol/interaction';
import { unByKey } from 'ol/Observable';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
import { Daten } from '../../Daten';
import { HTML } from '../../HTML';
import { Abschnitt } from '../../Objekte/Abschnitt';
import { Klartext } from '../../Objekte/Klartext';
import { Querschnitt } from '../../Objekte/Querschnittsdaten';
import { QuerStation } from '../../Objekte/QuerStation';
import { VectorLayer } from '../../openLayers/Layer';
import { Map } from "../../openLayers/Map";
import { PublicWFS } from '../../PublicWFS';
import { Tool } from '../prototypes/Tool';
import { QuerInfoTool } from './QuerInfoTool';

/**
 * Funktion zum Hinzufügen von Querschnittsflächen
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.04.22
 * @license GPL-3.0-or-later
*/
export class QuerAddTool extends Tool {
    private _info: QuerInfoTool;
    private selectFehlende: SelectInteraction;
    private form: HTMLFormElement = null;
    private button: HTMLInputElement;
    private fehlendeQuerschnitte: VectorLayer<VectorSource<Feature<LineString>>, Feature<LineString>>;
    private selectQuerschnitte: SelectInteraction;
    private selectQuerschnitteEventsKey: EventsKey;

    constructor(map: Map, info: QuerInfoTool) {
        super(map);
        this._info = info;
        this.fehlendeQuerschnitte = new VectorLayer({
            source: new VectorSource(),
            style: new Style({
                stroke: new Stroke({
                    lineDash: [2, 7],
                    width: 5,
                    color: 'rgb(255,255,0)'
                })
            })
        })
        this.selectFehlende = new SelectInteraction({
            layers: [this.fehlendeQuerschnitte],
            hitTolerance: 10
        });
        this.selectQuerschnitte = Querschnitt.getSelectLinien();

        this.selectFehlende.on('select', this.fehlendSelected.bind(this));
    }

    private createForm() {
        if (this.form != null) return;
        this.form = HTML.createToolForm(document.getElementById('sidebar'), false, 'hinzu');
        this.button = HTML.createButton(this.form, "Querschnittsfläche hinzu.", "addQuerschnittButton");
        this.button.addEventListener('click', this.addQuerschnitt.bind(this));
        this.button.disabled = true;
    }

    private fehlendSelected() {
        this.disableMenu();
        let feat = this.selectFehlende.getFeatures().item(0);
        this.generateBestandsachse(feat.get('abschnitt'), feat.get('vst'), feat.get('bst'))
    }

    private querschnittSelected() {
        let anz = this.selectQuerschnitte.getFeatures().getLength();
        if (anz == 0) {
            this.disableMenu();
            return
        } else if (anz == 1) {
            (this._info as QuerInfoTool).getInfoFieldForFeature(this.selectQuerschnitte.getFeatures().item(0).get("objekt"))
            this.button.value = "Querschnittsfläche hinzu.";
        } else {
            (this._info as QuerInfoTool).hideInfoBox();
            this.button.value = anz + " Querschnittsflächen hinzu.";
        }
        this.button.disabled = false;
    }

    private disableMenu() {
        if (this.form != null) {
            this.button.disabled = true;
            this.button.value = "Querschnittsfläche hinzu.";
        }

        (this._info as QuerInfoTool).hideInfoBox();
    }

    start() {
        this.createForm();
        if (this.form != null) $(this.form).show("fast");
        this.map.addInteraction(this.selectFehlende);
        this.map.addInteraction(this.selectQuerschnitte);
        Querschnitt.setSelectLinienToggleCondition(platformModifierKeyOnly);
        this.map.addLayer(this.fehlendeQuerschnitte);
        this.fehlendeBestandsAchseErzeugen();
        this.selectQuerschnitteEventsKey = this.selectQuerschnitte.on('select', this.querschnittSelected.bind(this));
        this.querschnittSelected();
    }

    stop() {
        if (this.form != null) $(this.form).hide("fast");
        this.disableMenu()
        this.map.removeInteraction(this.selectFehlende);
        this.map.removeInteraction(this.selectQuerschnitte);
        Querschnitt.setSelectLinienToggleCondition();

        this.map.removeLayer(this.fehlendeQuerschnitte);
        this._info.hideInfoBox();
        unByKey(this.selectQuerschnitteEventsKey);
    }


    private addQuerschnitt() {
        let selection = this.selectQuerschnitte.getFeatures();
        if (this.selectQuerschnitte.getFeatures().getLength() < 1) return;
        let querschnitt: Querschnitt[] = [];

        let mStreifenVorhanden: boolean = false;
        selection.forEach((feature) => {
            let q = <Querschnitt>feature.get('objekt');
            querschnitt.push(q);
            if (q.getStreifen() == 'M') mStreifenVorhanden = true;
        })
        console.log(querschnitt);

        if (mStreifenVorhanden) {
            this.askWhichSide(querschnitt);
        } else {
            this.querschnittErzeugen(querschnitt);
        }

        this.selectQuerschnitte.getFeatures().clear();
        this._info.hideInfoBox();
        this.disableMenu();
    }

    private askWhichSide(querschnittListe: Querschnitt[]) {
        let dialog = document.createElement("div");
        document.body.appendChild(dialog);
        dialog.innerHTML = "Auf welcher Seite sollen die Querschnittsflächen hinzugefügt werden? (sofern ein M-Streifen gewählt)"
        let jqueryDialog = $(dialog).dialog({
            resizable: false,
            height: "auto",
            width: 400,
            title: "Querschnitt hinzufügen",
            modal: true,
            buttons: {
                "Links": () => {
                    this.querschnittErzeugen(querschnittListe, "L");
                    jqueryDialog.dialog("close");
                },
                "Rechts": () => {
                    this.querschnittErzeugen(querschnittListe, "R");
                    jqueryDialog.dialog("close");
                },
                "Abbrechen": function () {
                    jqueryDialog.dialog("close");
                }
            }
        });
    }

    private fehlendeBestandsAchseErzeugen() {
        this.fehlendeQuerschnitte.getSource().clear();
        let abschnitte = Abschnitt.getAll();
        for (let abschnittid in abschnitte) {
            let abschnitt = abschnitte[abschnittid]
            if (!abschnitt.isOKinER('Querschnitt')) continue;
            let stationen = abschnitt.getAlleStationen();
            let letzterBst = 0;
            for (let vst in stationen) {
                if ((Number(vst) - letzterBst) > 0) {
                    this.fehlendeBestandsachseGeom(abschnitt, letzterBst, stationen[vst].getVst());
                }
                letzterBst = stationen[vst].getBst();
            }
            if ((abschnitt.getLen() - letzterBst) > 0) {
                this.fehlendeBestandsachseGeom(abschnitt, letzterBst, abschnitt.getLen());
            }
        }
    }

    private fehlendeBestandsachseGeom(abschnitt: Abschnitt, vst: number, bst: number) {
        let abs = abschnitt.getAbschnitt(vst, bst);
        let geom = [];
        for (let pkt of abs) {
            geom.push(pkt.getCoordinates())
        }
        let feat = new Feature<LineString>(new LineString(geom))
        feat.set('vst', vst);
        feat.set('bst', bst);
        feat.set('abschnitt', abschnitt);
        feat.set('fehlend', true);
        this.fehlendeQuerschnitte.getSource().addFeature(feat);
    }

    private generateBestandsachse(abschnitt: Abschnitt, vst: number, bst: number) {
        let station = new QuerStation(abschnitt, vst, bst);

        let querschnittNeu = new Querschnitt();
        querschnittNeu.setBreite(0);
        querschnittNeu.setBisBreite(0);
        querschnittNeu.setStreifen('M')
        querschnittNeu.setXBstR(0);
        querschnittNeu.setXVstR(0);
        querschnittNeu.setXBstL(querschnittNeu.getXBstR() - querschnittNeu.getBisBreite() / 100);
        querschnittNeu.setXVstL(querschnittNeu.getXVstR() - querschnittNeu.getBreite() / 100);
        querschnittNeu.setProjekt(Daten.getInstanz().ereignisraum);
        querschnittNeu.setStreifennr(0);
        let art = Klartext.getByKlartext('Itquerart', '999');
        if (art) querschnittNeu.setArt(art);
        let ober = Klartext.getByKlartext('Itquerober', '00')
        if (ober) querschnittNeu.setArtober(ober);
        querschnittNeu.setStation(station);
        querschnittNeu.setVst(vst);
        querschnittNeu.setBst(bst);
        querschnittNeu.setAbschnittId(abschnitt.getAbschnittid());
        let gesStreifen = station.getStreifen('M');
        gesStreifen[querschnittNeu.getStreifennr()] = querschnittNeu;
        //querschnittNeu.createGeom();
        station.addQuerschnitt(querschnittNeu);

        station.rewrite().then(() => {
            PublicWFS.showMessage("Bestandsachse erzeugt")
            this.fehlendeBestandsAchseErzeugen();
            this.selectFehlende.getFeatures().clear()
            this.selectNewStreifen([{ station: station, streifen: 'M', nr: 0 }]);
        })
    }

    private async querschnittErzeugen(querschnittListe: Querschnitt[], seiteWennM?: "R" | "L"): Promise<void> {

        let stationen: { [id: string]: QuerStation } = {};
        let neueQuerschnitte: { station: QuerStation, streifen: 'L' | 'R', nr: number }[] = [];

        for (let querschnitt of querschnittListe) {
            let seite = querschnitt.getStreifen();
            if (seite == "M") seite = seiteWennM;

            let station = querschnitt.getStation();
            stationen[station.getAbschnitt().getAbschnittid() + "" + station.getVst()] = station;

            await station.getAufbauDaten();
            let gesStreifen = station.getStreifen(seite);
            let querschnittNeu = new Querschnitt();

            neueQuerschnitte.push({ station: station, streifen: seite, nr: querschnitt.getStreifennr() + 1 })
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
                station.addQuerschnitt(quer);
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

            let art = querschnitt.getArt();
            if (!art) art = Klartext.getByKlartext('Itquerart', '999');
            querschnittNeu.setArt(art);

            let ober = querschnitt.getArtober()
            if (!ober) ober = Klartext.getByKlartext('Itquerober', '00')
            querschnittNeu.setArtober(ober);
            querschnittNeu.setADatum();

            querschnittNeu.setStation(querschnitt.getStation());
            querschnittNeu.setVst(querschnitt.getVst());
            querschnittNeu.setBst(querschnitt.getBst());
            querschnittNeu.setAbschnittId(querschnitt.getAbschnittId());
            console.log(gesStreifen)
            gesStreifen[querschnittNeu.getStreifennr()] = querschnittNeu;
            console.log(gesStreifen)
            //querschnittNeu.createGeom();
            station.addQuerschnitt(querschnittNeu);
        }

        let stationRewriter: Promise<Querschnitt[]>[] = [];
        for (let stationId in stationen) {
            let station = stationen[stationId];
            stationRewriter.push(station.rewrite())
        }

        return Promise.all(stationRewriter)
            .then(() => {
                PublicWFS.showMessage("Erfolgreich");
                this.selectNewStreifen(neueQuerschnitte);
                return Promise.resolve();
            })
            .catch(() => {
                PublicWFS.showMessage("Konnte den Streifen nicht hinzufügen", true);
                return Promise.reject();
            })
    }

    private selectNewStreifen(neueStreifen: { station: QuerStation, streifen: 'M' | 'L' | 'R', nr: number }[]) {
        Querschnitt.getSelectFlaechen().getFeatures().clear();
        this.selectQuerschnitte.getFeatures().clear();
        for (let streifen of neueStreifen) {
            let neuerStreifen = streifen.station.getStreifen(streifen.streifen)[streifen.nr]
            Querschnitt.getSelectFlaechen().getFeatures().push(neuerStreifen);
            this.selectQuerschnitte.getFeatures().push(neuerStreifen.trenn);
        }

        this.querschnittSelected()
    }
}