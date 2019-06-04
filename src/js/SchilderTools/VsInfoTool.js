import { Select as SelectInteraction } from 'ol/interaction';

/**
 * Funktion zum Anzeigen von Informationen zu Aufstellvorrichtungen und Schildern
 * @author Florian Timm, LGV HH 
 * @version 2019.05.20
 * @copyright MIT
 */
class VsInfoTool {

    /**
     * Konstruktor
     * @param {Map} map 
     * @param {*} layer 
     * @param {*} sidebar 
     */
    constructor(map, layer, sidebar) {
        this._map = map;
        this._layer = layer;
        this._sidebar = document.getElementById(sidebar);

        this._infoField = document.createElement("form");
        this._sidebar.appendChild(this._infoField);
        this._infoField.style.display = "none";

        this._select = new SelectInteraction({
            layers: this._layer,
            hitTolerance: 10
        });
        this._select.on('select', this.featureSelected.bind(this))
    }

    /**
     * Wird ausgelöst beim Auswählen einer Aufstellvorrichtung
     * @param {SelectEvent} event 
     */
    featureSelected(event) {
        if (event.selected.length == 0) {
            this._infoField.style.display = "none";
            return;
        }
        this._infoField.style.display = "block";
        let auswahl = event.selected[0];

        auswahl.getHTMLInfo(this._infoField);
    }


    start() {
        this._map.addInteraction(this._select);
    }

    stop() {
        this._map.removeInteraction(this._select);
        this._infoField.style.display = "none";
    }

}

module.exports = VsInfoTool;