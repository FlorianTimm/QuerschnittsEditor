// SPDX-License-Identifier: GPL-3.0-or-later

import { Style, Stroke } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import PublicWFS from '../../PublicWFS';
import Tool from '../prototypes/Tool'
import Daten from '../../Daten';
import Map from "../../openLayers/Map";
import { SelectEventType } from 'ol/interaction/Select';
import Abschnitt from '../../Objekte/Abschnitt';
import WaitBlocker from '../../WaitBlocker';

/**
 *
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.01.28
 * @license GPL-3.0-or-later
*/
export default abstract class Add2ER extends Tool {
    private daten: Daten;
    private select: SelectInteraction;
    private objektklasse: string;

    protected abstract loadAbschnitt(abschnitt: Abschnitt): void;

    constructor(map: Map, objektklasse: string) {
        super(map);
        this.daten = Daten.getInstanz();
        this.objektklasse = objektklasse;

        this.select = new SelectInteraction({
            layers: [Abschnitt.getLayer()],
            hitTolerance: 10,
            style: new Style({
                stroke: new Stroke({
                    color: 'rgba(0, 50, 255, 0.5)',
                    width: 5
                })
            })
        });
        this.select.on('select', this.onSelect.bind(this))
    }
    onSelect(__: SelectEventType) {
        console.log("Auswahl");
        if (this.select.getFeatures().getArray().length == 0) return;

        let abschnitt = this.select.getFeatures().getArray()[0] as Abschnitt;
        if (abschnitt.isOKinER(this.objektklasse)) return;
        WaitBlocker.warteAdd()
        PublicWFS.addInER(abschnitt, this.objektklasse, this.daten.ereignisraum_nr)
            .then(() => {
                abschnitt.addOKinER(this.objektklasse);
                this.loadAbschnitt(abschnitt);
                this.select.getFeatures().clear();
                Abschnitt.getLayer().changed();
                WaitBlocker.warteSub()
            })
            .catch(() => {
                WaitBlocker.warteSub()
                PublicWFS.showMessage("Konnte Abschnitt nicht zum ER hinzufügen", true)
            });
    }

    start() {
        this.map.addInteraction(this.select);
    }

    stop() {
        this.map.removeInteraction(this.select);
    }
}