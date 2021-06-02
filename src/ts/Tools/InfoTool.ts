// SPDX-License-Identifier: GPL-3.0-or-later

import "../import_jquery.js";
import { Feature } from 'ol';
import { FeatureLike } from 'ol/Feature';
import { Geometry } from 'ol/geom';
import GeometryType from 'ol/geom/GeometryType';
import { Select as SelectInteraction } from 'ol/interaction';
import { SelectEvent } from 'ol/interaction/Select';
import { unByKey } from 'ol/Observable';
import { Fill, Stroke, Style } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import { HTML } from '../HTML';
import { Map } from '../openLayers/Map';
import { PublicWFS } from '../PublicWFS';
import { Tool } from './prototypes/Tool';

/**
 * Funktion zum Anzeigen von Informationen zu Aufstellvorrichtungen und Schildern
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.04.22
 * @license GPL-3.0-or-later
*/
export class InfoTool extends Tool {
    private infoField: HTMLFormElement;
    protected select: SelectInteraction;
    protected lastFeature: InfoToolOverlay;
    selectEventKey: any;

    constructor(map: Map, sidebar: HTMLDivElement, selectInteraction: SelectInteraction) {
        super(map);

        this.select = selectInteraction;

        this.infoField = HTML.createToolForm(sidebar, false)
    }

    /**
     * Wird ausgelöst beim Auswählen einer Aufstellvorrichtung
     * @param {SelectEvent} event 
     */
    private featureSelectedEvent(__: SelectEvent, changeable: boolean = false) {
        this.featureSelect(this.select, changeable);
    }

    public featureSelect(select: SelectInteraction = this.select, changeable: boolean = false) {
        let auswahl = select.getFeatures();

        if (auswahl.getLength() == 0) {
            this.hideInfoBox();
            return;
        }
        this.infoField.innerHTML = "";
        let feat = auswahl.item(0);
        this.getInfoFieldForFeature(feat, changeable)

        // Overlays
        this.removeOverlays()
        if (!changeable && "showOverlay" in feat) {
            this.lastFeature = feat as unknown as InfoToolOverlay
            this.lastFeature.showOverlay(this.map)
        }

    }

    public getInfoFieldForFeature(feature: Feature<Geometry>, changeable: boolean = false) {
        this.infoField.innerHTML = "";
        let promise = (feature as InfoToolSelectable).getInfoForm(this.infoField, changeable);
        if (changeable) {
            // Button
            let input = document.createElement("input");
            input.id = "info_button";
            input.type = "submit"
            input.value = "Speichern"
            input.disabled = true;
            promise.then(() => { input.disabled = false })
            this.infoField.appendChild(input);
            $(this.infoField).off("submit");
            $(this.infoField).on("submit", (event: Event) => {
                event.preventDefault();
                (feature as InfoToolEditable).changeAttributes(this.infoField)
                    .then(() => { PublicWFS.showMessage("Erfolgreich") })
                    .catch(() => { PublicWFS.showMessage("Fehler", true) });
            });
        }
        this.showInfoBox();
    }

    public showInfoBox() {
        $(this.infoField).show("fast")
    }

    public hideInfoBox() {
        $(this.infoField).off("submit");
        $(this.infoField).hide("fast", "linear", undefined, () => {
            this.infoField.innerHTML = "";
        })
        this.removeOverlays();
    }

    private removeOverlays() {
        if (this.lastFeature) {
            this.lastFeature.hideOverlay(this.map);
            this.lastFeature = undefined;
        }
    }

    public static selectStyle(feat: FeatureLike, __: number): Style {
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
        this.selectEventKey = this.select.on('select', this.featureSelectedEvent.bind(this));

        if (this.select.getFeatures().getLength() > 1) {
            let f = this.select.getFeatures().item(0);
            this.select.getFeatures().clear()
            this.select.getFeatures().push(f);
        }

        this.featureSelect();
        this.map.addInteraction(this.select);
    }

    public stop() {
        unByKey(this.selectEventKey);
        this.map.removeInteraction(this.select);
        this.hideInfoBox();
    }
}

export interface InfoToolSelectable extends Feature<Geometry> {
    getInfoForm: (sidebar: HTMLElement, changeable?: boolean) => Promise<any>;
}
export interface InfoToolEditable extends Feature<Geometry> {
    changeAttributes: (form: HTMLFormElement) => Promise<any>;
}

export interface InfoToolOverlay {
    showOverlay: (map: Map) => void;
    hideOverlay: (map: Map) => void;
}