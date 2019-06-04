import { Vector as VectorSource } from 'ol/source.js';
import Draw from 'ol/interaction/Draw.js';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import Overlay from 'ol/Overlay.js';
import { getLength } from 'ol/sphere.js';
import { unByKey } from 'ol/Observable.js';
var CONFIG = require('./config.json');

class Measure {

    constructor(map) {
        this._map = map;

        // Layer erzeugen
        this._source = new VectorSource();
        this._vector = new VectorLayer({
            source: this._source,
            style: new Style({
                stroke: new Stroke({
                    color: '#ffcc33',
                    width: 2
                })
            })
        });

        // Interaktion erzeugen
        this._draw = new Draw({
            source: this._source,
            type: 'LineString',
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
            positioning: 'bottom-center'
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

        this._draw.on('drawstart',
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
            }.bind(this), this);

        this._draw.on('drawend',
            function () {
                measureTooltipElement.className = 'tooltip tooltip-static';
                this.measureTooltip.setOffset([0, -7]);
                unByKey(listener);
            }.bind(this), this);
    }

    start() {
        this._map.addInteraction(this._draw);
        this._map.addLayer(this._vector)
        this._map.addOverlay(this.measureTooltip);
    }
    stop() {
        this._map.removeInteraction(this._draw);
        this._map.removeLayer(this._vector)
        this._map.removeOverlay(this.measureTooltip);
    }
}

module.exports = Measure;