import { Circle, Style, Stroke, Fill } from 'ol/style';
import {Modify as ModifyInteraction, Select as SelectInteraction } from 'ol/interaction';
import Vektor from '../Vektor.js';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { LineString } from 'ol/geom';
import Feature from 'ol/Feature.js';
import never from 'ol/events/condition';

class AvMove {
    constructor(map, daten, avInfoTool) {
        this._map = map;
        this._daten = daten;
        this._avInfoTool = avInfoTool;

        this.abschnitt = null;
        this.station = null;
        this.abstand = null;
        this.seite = null;

        this._select = new SelectInteraction({
            layers: [this._daten.l_aufstell],
        });

        this._createLayer();
        this._createModify();

        this._select.on("select", this._selected.bind(this));
    }

    _createLayer() {
        this._v_overlay = new VectorSource({
            features: []
        });
        this._l_overlay = new VectorLayer({
            source: this._v_overlay,
            style: new Style({
                stroke: new Stroke({
                    color: '#dd0000',
                    width: 3
                }),
                image: new Circle({
                    radius: 7,
                    fill: new Fill({ color: 'black' }),
                    stroke: new Stroke({
                        color: [255, 0, 0], width: 2
                    })
                }),
            })
        });
        this._feat_station_line = new Feature({ geometry: new LineString([[0, 0][0, 0]]) });
        this._feat_station_line.setStyle(new Style({
            stroke: new Stroke({
                color: 'rgba(0, 0, 255, 0.5)',
                width: 2
            }),
        }));
        this._v_overlay.addFeature(this._feat_station_line);
    }

    _createModify() {
        this._modify = new ModifyInteraction({
            deleteCondition: never,
            insertVertexCondition: never,
            features: this._select.getFeatures()
        });
        this._modify.geo_vorher = null;
        this._modify.modify = this;

        this._modify.on('modifystart', this._modifyStart.bind(this));
        this._modify.on('modifyend', this._modifyEnd.bind(this));
    }
/*
    1 = Verkehrszeichen
    8 = noch nicht drin, Verkehrszeichen
    9 = Verkehrszeich
    5 = Wegweisend
    17 = Touri

    */

    _selected (event) {
        if (this._select.getFeatures().getLength() > 0) {
            this._map.on("pointermove", this._move.bind(this));
        } else {
            console.log("unselect")
            this._map.unset("pointermove", this._move.bind(this));
            this._feat_station_line.getGeometry().setCoordinates([[0,0],[0,0]]);
        }
        this._avInfoTool.featureSelected(event);
    }

    _modifyStart (event) {
        this._map.on("pointermove", this._move.bind(this));
    }

    _modifyEnd (event) {
        this._map.unset("pointermove", this._move.bind(this));
        let feat = this._select.getFeatures().item(0);
        this._feat_station_line.getGeometry().setCoordinates([[0,0],[0,0]]);
        let daten = this._get_station(feat.getGeometry().getCoordinates());

        if (daten == null || daten['pos'] == null) return;

        
        this._select.getFeatures().clear();
        feat.getGeometry().setCoordinates(daten['pos'][6]);

        let station = Math.round(daten['pos'][2] * feat.abschnitt.getFaktor());
        let abstand = Math.round(daten['pos'][4] * 10) / 10;
        let seite = daten['pos'][3]
        if (seite == 'M') abstand = 0;
        else if (seite == 'L') abstand = -abstand;
        console.log(abstand);

        feat.updateStation(station, abstand);
    }

    _get_station(coordinates) {
        let achse = null;
        if (this._select.getFeatures().getLength() > 0) {
            achse = this._select.getFeatures().item(0).abschnitt;
        } else {
            return null;
        }

        return { achse: achse, pos: Vektor.get_pos(achse.getGeometry().getCoordinates(), coordinates) };
    }

    _move(event) {
        let daten = this._get_station(event.coordinate);

        if (daten == null || daten['pos'] == null) return;

        //this._select.getFeatures().item(0).getGeometry().setCoordinates(daten['pos'][6]);
        this._feat_station_line.getGeometry().setCoordinates([daten['pos'][6], daten['pos'][5]]);
    }

    static _wfsEditAufstell(_this) {
        
    }


    start() {
        this._map.addInteraction(this._select);
        this._map.addInteraction(this._modify);
        this._map.addLayer(this._l_overlay);
    }

    stop() {
        this._map.removeInteraction(this._select);
        this._map.removeInteraction(this._modify);
        this._map.removeLayer(this._l_overlay);
        this._map.unset("pointermove", this._move.bind(this));
        this._feat_station_line.getGeometry().setCoordinates([[0,0],[0,0]]);
    }
}

module.exports = AvMove;