// SPDX-License-Identifier: GPL-3.0-or-later

import { Select as SelectInteraction } from 'ol/interaction';
import { never } from 'ol/events/condition';
import Querschnitt from '../../Objekte/Querschnittsdaten';
import InfoTool from '../InfoTool';
import Map from '../../openLayers/Map';
import { VectorLayer } from '../../openLayers/Layer';

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
    constructor(map: Map, layerFlaechen: VectorLayer, sidebar: HTMLDivElement) {
        super(map, layerFlaechen, sidebar, Querschnitt.getSelectFlaechen());

        // Linienauswahl, erfolgt nur indirekt durch Flächenauswahl
        this.selectLinie = Querschnitt.getSelectLinien();
    }

    /** Startet das Werkzeug */
    public start() {
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