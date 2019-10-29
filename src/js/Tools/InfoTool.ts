import { Select as SelectInteraction } from 'ol/interaction';
import Map from '../openLayers/Map';
import { Layer } from 'ol/layer';
import Tool from './prototypes/Tool';
import { SelectEvent } from 'ol/interaction/Select';
import { Feature } from 'ol';
import "../import_jquery.js";

/**
 * Funktion zum Anzeigen von Informationen zu Aufstellvorrichtungen und Schildern
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */

export default class InfoTool extends Tool {
    private map: Map;
    private layer: Layer;
    private sidebar: HTMLElement;
    private infoField: HTMLFormElement;
    private select: SelectInteraction;
    private auswahl: Feature;

    constructor(map: Map, layer: Layer, sidebar: string) {
        super();
        this.map = map;
        this.layer = layer;
        this.sidebar = document.getElementById(sidebar);

        this.infoField = document.createElement("form");
        this.sidebar.appendChild(this.infoField);
        this.infoField.style.display = "none";

        this.select = new SelectInteraction({
            layers: [this.layer],
            hitTolerance: 10
        });
        this.select.on('select', this.featureSelected.bind(this))
    }

    /**
     * Wird ausgelöst beim Auswählen einer Aufstellvorrichtung
     * @param {SelectEvent} event 
     */
    featureSelected(event: SelectEvent, changeable: boolean = false) {
        if (event.selected.length == 0) {
            this.infoField.style.display = "none";
            return;
        }
        
        this.infoField.style.display = "block";
        this.auswahl = event.selected[0];
        this.infoField.innerHTML = "";
        console.log(this.auswahl);
        (this.auswahl as InfoToolSelectable).getHTMLInfo(this.infoField, changeable);

        if (changeable) {
            let button = $(this.infoField).children("input[type=button]");
            button.prop("disabled", false)
            button.on("click", function () {
                (this.auswahl as InfoToolSelectable).changeAttributes(this.infoField);
            }.bind(this));
        }
    }

    start() {
        this.map.addInteraction(this.select);
    }

    stop() {
        this.map.removeInteraction(this.select);
        this.infoField.style.display = "none";
    }

}

export interface InfoToolSelectable extends Feature {
    getHTMLInfo: (sidebar: HTMLElement, changeable?: boolean) => void;
    changeAttributes: (form: HTMLFormElement) => void;
}