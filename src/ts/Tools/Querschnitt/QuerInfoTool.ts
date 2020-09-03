// SPDX-License-Identifier: GPL-3.0-or-later

import { never } from 'ol/events/condition';
import { Select as SelectInteraction } from 'ol/interaction';
import Querschnitt from '../../Objekte/Querschnittsdaten';
import Map from '../../openLayers/Map';
import InfoTool from '../InfoTool';

/**
 * Funktion zum Anzeigen von Informationen über Querschnitte
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.04.22
 * @license GPL-3.0-or-later
*/
export default class QuerInfoTool extends InfoTool {
    /** Linienauswahl */
    private selectLinie: SelectInteraction;
    selectEventsKey: any;

    /**
     * @param map Kartenobjekt
     * @param layerLinie Layer mit den Querschnittstrennlinien
     * @param layerFlaechen Layer mit den Querschnittsflächen
     * @param sidebar DIV-Bereich, in dem das Tool angezeigt wird
     */
    constructor(map: Map, sidebar: HTMLDivElement) {
        super(map, sidebar, Querschnitt.getSelectFlaechen());

        // Linienauswahl, erfolgt nur indirekt durch Flächenauswahl
        this.selectLinie = Querschnitt.getSelectLinien();
    }

    /** Startet das Werkzeug */
    public start() {

        if (this.select.getFeatures().getLength() > 1) {
            this.selectLinie.getFeatures().clear();
            this.selectLinie.getFeatures().push((<Querschnitt>this.select.getFeatures().item(0)).trenn)
        }
        super.start()
        // Flächenauswahl (zusätzlicher Listener zu dem vom InfoTool)
        this.map.addInteraction(this.selectLinie);
        Querschnitt.setSelectLinienCondition(never);
    }

    /** Stoppt das Werkzeug */
    public stop() {
        super.stop()
        Querschnitt.setSelectLinienCondition();
        this.map.removeInteraction(this.selectLinie);
    }
}