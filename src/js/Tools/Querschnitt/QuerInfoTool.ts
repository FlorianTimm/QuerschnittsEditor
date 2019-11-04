import { Style, Stroke, Fill } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import { never } from 'ol/events/condition';
import Daten from '../../Daten';
import { SelectEvent } from 'ol/interaction/Select';
import Querschnitt from 'src/js/Objekte/Querschnittsdaten';
import InfoTool from '../InfoTool';
import Map from '../../openLayers/Map';
import { Layer } from 'ol/layer';

/**
 * Funktion zum Anzeigen von Informationen über Aufstellvorrichtungen
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */
class QuerInfoTool extends InfoTool {
    daten: Daten;
    protected selectLinie: SelectInteraction;

    constructor(map: Map, layerLinie: Layer, layerFlaechen: Layer, sidebar: string) {
        super(map, layerFlaechen, sidebar);


        this.selectLinie = new SelectInteraction({
            layers: [layerLinie],
            condition: never,
            style: InfoTool.selectStyle
        });

        this.select.on("select", this.featureSelectedFlaeche.bind(this))
    }

    private featureSelectedFlaeche(e: SelectEvent) {
        console.log("Select Fläche")
        this.selectLinie.getFeatures().clear()
        this.select.getFeatures().forEach(function (feature: Querschnitt) {
            this.selectLinie.getFeatures().push(feature.trenn)
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

export default QuerInfoTool;