// SPDX-License-Identifier: GPL-3.0-or-later

import { EventsKey } from 'ol/events';
import Event from 'ol/events/Event';
import { LineString } from 'ol/geom';
import Geometry from 'ol/geom/Geometry';
import GeometryType from 'ol/geom/GeometryType';
import Draw, { DrawEvent } from 'ol/interaction/Draw';
import { Vector as VectorLayer } from 'ol/layer';
import { unByKey } from 'ol/Observable';
import Overlay from 'ol/Overlay';
import OverlayPositioning from 'ol/OverlayPositioning';
import { Vector as VectorSource } from 'ol/source';
import { getLength } from 'ol/sphere';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { Map } from "../openLayers/Map";
import { Tool } from './prototypes/Tool';
import { CONFIG } from '../../config/config'

/**
 * Messfunktion
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.04.03
 * @license GPL-3.0-or-later
*/
export class Measure extends Tool {
    private source: VectorSource<any>;
    private vector: VectorLayer<VectorSource<any>>;
    private draw: Draw;
    private measureTooltip: Overlay;

    constructor(map: Map) {
        super(map);

        // Layer erzeugen
        this.source = new VectorSource();
        this.vector = new VectorLayer({
            source: this.source,
            style: new Style({
                stroke: new Stroke({
                    color: '#ffcc33',
                    width: 2
                })
            })
        });

        // Interaktion erzeugen
        this.draw = new Draw({
            source: this.source,
            type: GeometryType.LINE_STRING,
            style: new Style({
                stroke: new Stroke({
                    color: 'rgba(0, 0, 0, 0.5)',
                    lineDash: [10, 10],
                    width: 2
                }),
                image: new CircleStyle({
                    radius: 5,
                    stroke: new Stroke({
                        color: 'rgba(0, 0, 0, 0.7)'
                    }),
                    fill: new Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    })
                })
            })
        });

        let listener: EventsKey;

        // Tooltip erzeugen
        let measureTooltipElement = document.createElement('div');
        measureTooltipElement.className = 'tooltip tooltip-measure';
        this.measureTooltip = new Overlay({
            element: measureTooltipElement,
            offset: [0, -15],
            positioning: OverlayPositioning.BOTTOM_CENTER
        });

        var formatLength = function (line: Geometry) {
            var length = getLength(line, { projection: CONFIG.EPSG_CODE });
            var output;
            if (length > 100) {
                output = (Math.round(length / 1000 * 100) / 100) +
                    ' ' + 'km';
            } else {
                output = (Math.round(length * 100) / 100) +
                    ' ' + 'm';
            }
            return output;
        };

        this.draw.on('drawstart',
            (evt: DrawEvent) => {
                // set sketch
                this.source.clear();

                /** @type {module:ol/coordinate~Coordinate|undefined} */
                let tooltipCoord = (evt.feature.getGeometry() as LineString).getFirstCoordinate();
                measureTooltipElement.className = 'tooltip tooltip-measure';

                listener = evt.feature.getGeometry().on('change', (evt: Event) => {
                    var geom = <LineString>evt.target;
                    var output = formatLength(geom);
                    tooltipCoord = geom.getLastCoordinate();
                    measureTooltipElement.innerHTML = output;
                    this.measureTooltip.setPosition(tooltipCoord);
                });
            });

        this.draw.on('drawend', () => {
            measureTooltipElement.className = 'tooltip tooltip-static';
            this.measureTooltip.setOffset([0, -7]);
            unByKey(listener);
        });
    }

    start() {
        this.map.addInteraction(this.draw);
        this.map.addLayer(this.vector)
        this.map.addOverlay(this.measureTooltip);
    }
    stop() {
        this.map.removeInteraction(this.draw);
        this.map.removeLayer(this.vector)
        this.map.removeOverlay(this.measureTooltip);
    }
}
