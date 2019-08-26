import { Vector as VectorSource } from 'ol/source';
import Draw from 'ol/interaction/Draw';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { Vector as VectorLayer } from 'ol/layer';
import Overlay from 'ol/Overlay';
import { getLength } from 'ol/sphere';
import { unByKey } from 'ol/Observable';
import Map from '../openLayers/Map';
import GeometryType from 'ol/geom/GeometryType';
import OverlayPositioning from 'ol/OverlayPositioning';
import Tool from './prototypes/Tool';
var CONFIG = require('../config.json');

/**
 * Messfunktion
 * @author Florian Timm, LGV HH 
 * @version 2019.06.06
 * @copyright MIT
 */
class Measure extends Tool {
    private map: Map;
    private source: VectorSource;
    private vector: VectorLayer;
    private draw: Draw;
    private measureTooltip: Overlay;

    constructor(map: Map) {
        super();
        this.map = map;

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

        let listener;

        // Tooltip erzeugen
        let measureTooltipElement = document.createElement('div');
        measureTooltipElement.className = 'tooltip tooltip-measure';
        this.measureTooltip = new Overlay({
            element: measureTooltipElement,
            offset: [0, -15],
            positioning: OverlayPositioning.BOTTOM_CENTER
        });

        var formatLength = function (line) {
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
            function (evt) {
                // set sketch
                this._source.clear();

                /** @type {module:ol/coordinate~Coordinate|undefined} */
                var tooltipCoord = evt.coordinate;
                measureTooltipElement.className = 'tooltip tooltip-measure';

                listener = evt.feature.getGeometry().on('change', function (evt) {
                    var geom = evt.target;
                    var output = formatLength(geom);
                    tooltipCoord = geom.getLastCoordinate();
                    measureTooltipElement.innerHTML = output;
                    this.measureTooltip.setPosition(tooltipCoord);
                }.bind(this));
            }.bind(this));

        this.draw.on('drawend',
            function () {
                measureTooltipElement.className = 'tooltip tooltip-static';
                this.measureTooltip.setOffset([0, -7]);
                unByKey(listener);
            }.bind(this));
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

export default Measure;