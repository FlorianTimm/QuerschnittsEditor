import { Select as SelectInteraction } from 'ol/interaction';
import Map from '../openLayers/Map';
import { Layer } from 'ol/layer';
import Tool from './prototypes/Tool';
import { SelectEvent } from 'ol/interaction/Select';
import { Feature } from 'ol';
import "../import_jquery.js";
import HTML from '../HTML';
import { Style, Stroke, Fill } from 'ol/style';
import GeometryType from 'ol/geom/GeometryType';
import CircleStyle from 'ol/style/Circle';

/**
 * Funktion zum Anzeigen von Informationen zu Aufstellvorrichtungen und Schildern
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */

export default class InfoTool extends Tool {
    protected map: Map;
    private layer: Layer;
    private infoField: HTMLFormElement;
    protected select: SelectInteraction;

    constructor(map: Map, layer: Layer, sidebar: string) {
        super();
        this.map = map;
        this.layer = layer;

        this.select = new SelectInteraction({
            layers: [this.layer],
            hitTolerance: 10,
            style: InfoTool.selectStyle
        });
        this.select.on('select', this.featureSelectedEvent.bind(this))

        this.infoField = HTML.createToolForm(document.getElementById(sidebar), false)
    }

    /**
     * Wird ausgelöst beim Auswählen einer Aufstellvorrichtung
     * @param {SelectEvent} event 
     */
    private featureSelectedEvent(event: SelectEvent, changeable: boolean = false) {
        this.featureSelect(this.select, changeable);
        console.log("Select");
    }

    public featureSelect(select: SelectInteraction = this.select, changeable: boolean = false) {
        let auswahl = select.getFeatures();
        console.log(auswahl.getArray())

        if (auswahl.getLength() == 0) {
            this.hideInfoBox();
            return;
        }
        this.infoField.innerHTML = "";
        this.getInfoFieldForFeature(auswahl.item(0), changeable)
    }

    public getInfoFieldForFeature(feature: Feature, changeable: boolean = false) {
        (feature as InfoToolSelectable).getInfoForm(this.infoField, changeable);
        if (changeable) {
            // Button
            let input = document.createElement("input");
            input.id = "info_button";
            input.type = "submit"
            input.value = "Speichern"
            this.infoField.appendChild(input);
            $(this.infoField).on("submit", function (event: Event) {
                event.preventDefault();
                (feature as InfoToolEditable).changeAttributes(this.infoField);
            }.bind(this));
        }
        this.showInfoBox();
    }

    public showInfoBox() {
        $(this.infoField).show("fast")
    }

    public hideInfoBox() {
        $(this.infoField).hide("fast", "linear", function () {
            this.infoField.innerHTML = "";
        }.bind(this))

    }

    public static selectStyle(feat: Feature): Style {
        let typ = feat.getGeometry().getType();
        if (typ == GeometryType.LINE_STRING || typ == GeometryType.MULTI_LINE_STRING) {
            return new Style({
                stroke: new Stroke({
                    color: 'rgba(255, 0, 0, 0.5)',
                    width: 3
                })
            })
        } else if (typ == GeometryType.POLYGON) {
            return new Style({
                fill: new Fill({
                    color: 'rgba(255, 0, 0, 0.3)'
                })
            })
        } else {
            var white = [255, 255, 255, 1];
            var blue = [0, 153, 255, 1];
            var width = 3;
            return new Style({
                image: new CircleStyle({
                    radius: width * 2,
                    fill: new Fill({
                        color: blue
                    }),
                    stroke: new Stroke({
                        color: white,
                        width: width / 2
                    })
                }),
                zIndex: Infinity
            })
        }

    }

    getForm(): HTMLFormElement {
        return this.infoField;
    }

    public start() {
        this.map.addInteraction(this.select);
    }

    public stop() {
        this.map.removeInteraction(this.select);
        this.select.getFeatures().clear();
        this.hideInfoBox();
    }
}

export interface InfoToolSelectable extends Feature {
    getInfoForm: (sidebar: HTMLElement, changeable?: boolean) => void;
}
export interface InfoToolEditable extends Feature {
    changeAttributes: (form: HTMLFormElement) => void;
}