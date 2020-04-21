// SPDX-License-Identifier: GPL-3.0-or-later

import { Select as SelectInteraction } from 'ol/interaction';
import { never } from 'ol/events/condition';
import Querschnitt from '../../Objekte/Querschnittsdaten';
import InfoTool from '../InfoTool';
import Map from '../../openLayers/Map';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import { VectorLayer } from '../../openLayers/Layer';
import { unByKey } from 'ol/Observable';

/**
 * Funktion zum Anzeigen von Informationen über Querschnitte
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.04.03
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
    constructor(map: Map, layerLinie: VectorLayer, layerFlaechen: VectorLayer, sidebar: HTMLDivElement) {
        super(map, layerFlaechen, sidebar, Querschnitt.getSelectFlaechen());

        // Linienauswahl, erfolgt nur indirekt durch Flächenauswahl
        this.selectLinie = new SelectInteraction({
            layers: [layerLinie],
            condition: never,
            style: InfoTool.selectStyle
        });

        
    }

    /** wird vom Flächen-Select-Event ausgelöst */
    private featureSelectedFlaeche() {
        console.log("Select Fläche")
        this.selectLinie.getFeatures().clear()
        this.select.getFeatures().forEach((feature: Feature<Geometry>) => {
            this.selectLinie.getFeatures().push((feature as Querschnitt).trenn)
        });
    }

    /** Startet das Werkzeug */
    public start() {
        super.start()
        
        // Flächenauswahl (zusätzlicher Listener zu dem vom InfoTool)
        this.selectEventsKey = this.select.on("select", this.featureSelectedFlaeche.bind(this))
        this.map.addInteraction(this.selectLinie);
    }

    /** Stoppt das Werkzeug */
    public stop() {
        super.stop()
        unByKey(this.selectEventsKey)
        this.map.removeInteraction(this.selectLinie);
        this.selectLinie.getFeatures().clear();
    }
}