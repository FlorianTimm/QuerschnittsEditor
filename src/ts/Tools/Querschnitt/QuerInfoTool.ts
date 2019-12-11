import { Select as SelectInteraction } from 'ol/interaction';
import { never } from 'ol/events/condition';
import Querschnitt from '../../Objekte/Querschnittsdaten';
import InfoTool from '../InfoTool';
import Map from '../../openLayers/Map';
import { Layer } from 'ol/layer';
import { Feature } from 'ol';

/**
 * Funktion zum Anzeigen von Informationen über Querschnitte
 * @author Florian Timm, LGV HH 
 * @version 2019-11-20
 * @copyright MIT
 */
export default class QuerInfoTool extends InfoTool {
    /** Linienauswahl */
    private selectLinie: SelectInteraction;

    /**
     * @param map Kartenobjekt
     * @param layerLinie Layer mit den Querschnittstrennlinien
     * @param layerFlaechen Layer mit den Querschnittsflächen
     * @param sidebar DIV-Bereich, in dem das Tool angezeigt wird
     */
    constructor(map: Map, layerLinie: Layer, layerFlaechen: Layer, sidebar: HTMLDivElement) {
        super(map, layerFlaechen, sidebar);

        // Linienauswahl, erfolgt nur indirekt durch Flächenauswahl
        this.selectLinie = new SelectInteraction({
            layers: [layerLinie],
            condition: never,
            style: InfoTool.selectStyle
        });

        // Flächenauswahl (zusätzlicher Listener zu dem vom InfoTool)
        this.select.on("select", this.featureSelectedFlaeche.bind(this))
    }

    /** wird vom Flächen-Select-Event ausgelöst */
    private featureSelectedFlaeche() {
        console.log("Select Fläche")
        this.selectLinie.getFeatures().clear()
        this.select.getFeatures().forEach((feature: Feature) => {
            this.selectLinie.getFeatures().push((feature as Querschnitt).trenn)
        });
    }

    /** Startet das Werkzeug */
    public start() {
        super.start()
        this.map.addInteraction(this.selectLinie);
    }

    /** Stoppt das Werkzeug */
    public stop() {
        super.stop()
        this.map.removeInteraction(this.selectLinie);
        this.selectLinie.getFeatures().clear();
    }
}