import { Select as SelectInteraction } from 'ol/interaction';
import { never } from 'ol/events/condition';
import Daten from '../../Daten';
import Querschnitt from '../../Objekte/Querschnittsdaten';
import InfoTool from '../InfoTool';
import Map from '../../openLayers/Map';
import { Layer } from 'ol/layer';
import { Feature } from 'ol';

/**
 * Funktion zum Anzeigen von Informationen über Aufstellvorrichtungen
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */
export default class QuerInfoTool extends InfoTool {
    daten: Daten;
    protected selectLinie: SelectInteraction;

    constructor(map: Map, layerLinie: Layer, layerFlaechen: Layer, sidebar: HTMLDivElement) {
        super(map, layerFlaechen, sidebar);

        this.selectLinie = new SelectInteraction({
            layers: [layerLinie],
            condition: never,
            style: InfoTool.selectStyle
        });
        this.select.on("select", this.featureSelectedFlaeche.bind(this))
    }

    private featureSelectedFlaeche() {
        console.log("Select Fläche")
        this.selectLinie.getFeatures().clear()
        this.select.getFeatures().forEach(function (this: QuerInfoTool, feature: Feature) {
            this.selectLinie.getFeatures().push((feature as Querschnitt).trenn)
        }.bind(this));
    }

    start() {
        super.start()
        this.map.addInteraction(this.selectLinie);
    }

    stop() {
        super.stop()
        this.map.removeInteraction(this.selectLinie);
        this.selectLinie.getFeatures().clear();
    }
}