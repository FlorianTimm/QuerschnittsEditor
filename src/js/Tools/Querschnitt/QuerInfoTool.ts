import { Style, Stroke, Fill } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import { never } from 'ol/events/condition';
import Daten from '../../Daten';
import { SelectEvent } from 'ol/interaction/Select';
import Querschnitt from 'src/js/Objekte/Querschnittsdaten';
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
class QuerInfoTool extends InfoTool {
    daten: Daten;
    protected selectLinie: SelectInteraction;

    constructor(map: Map, layerLinie: Layer, layerFlaechen: Layer, sidebar: string) {
        super(map, layerFlaechen, sidebar);


        this.selectLinie = new SelectInteraction({
            layers: [layerLinie],
            toggleCondition: never,
            style: InfoTool.selectStyle
        });

        this.selectLinie.on('select', this.featureSelectedLinie.bind(this));
        this.select.on("select", function (e: SelectEvent) {
            this.selectLinie.getFeatures().clear()
            if (e.selected != undefined && e.selected.length == 1) {
                this.selectLinie.getFeatures().push(this.select.getFeatures().item(0).trenn)
            }
        }.bind(this))
    }

    private featureSelectedLinie(e: SelectEvent) {
        this.select.getFeatures().clear()
        if (e.selected != undefined && e.selected.length == 1) {
            this.select.getFeatures().push((this.selectLinie.getFeatures().item(0).get("objekt") as Querschnitt))
        }
        this.featureSelect(this.select);
    }

    start() {
        super.start()
        this.map.addInteraction(this.selectLinie);
    }

    stop() {
        super.stop()
        this.map.removeInteraction(this.selectLinie);
    }

}

export default QuerInfoTool;