 import { Circle, Style, Stroke, Fill } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import Vektor from '../../Vektor';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { LineString, Point } from 'ol/geom';
import Feature from 'ol/Feature';
import {never as neverCondition} from 'ol/events/condition';
import { Map } from 'ol';
import Daten from '../../Daten';
import InfoTool from '../InfoTool';
import Tool from '../Tool';
import Abschnitt from '../../Objekte/Abschnitt';
import StrassenAusPunkt from '../../Objekte/StrassenAusPunkt';
import { ModifyInteraction } from '../../openLayers/Interaction';

/**
 * Funktion zum Verschieben von Aufstellvorrichtungen
 * @author Florian Timm, LGV HH 
 * @version 2019.05.20
 * @copyright MIT
 */
export default class SAPMove implements Tool {
    private _map: Map;
    private _daten: Daten;
    private _infoTool: InfoTool;
    abschnitt: Abschnitt = null;
    station: number = null;
    abstand: number = null;
    seite: string = null;
    private _select: SelectInteraction;
    private _v_overlay: VectorSource;
    private _l_overlay: VectorLayer;
    private _feat_station_line: Feature;
    private _modify: ModifyInteraction;

    constructor(map: Map, infoTool: InfoTool) {
        this._map = map;
        this._daten = Daten.getInstanz();
        this._infoTool = infoTool;

        this._select = new SelectInteraction({
            layers: [this._daten.l_straus],
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
        this._feat_station_line = new Feature({ geometry: new LineString([[0, 0], [0, 0]]) });
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
            deleteCondition: neverCondition,
            insertVertexCondition: neverCondition,
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

    _selected(event) {
        if (this._select.getFeatures().getLength() > 0) {
            this._map.on("pointermove", this._move.bind(this));
        } else {
            console.log("unselect")
            this._map.unset("pointermove", this._move.bind(this));
            (this._feat_station_line.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
        }
        this._infoTool.featureSelected(event);
    }

    _modifyStart(event) {
        this._map.on("pointermove", this._move.bind(this));
    }

    _modifyEnd(event) {
        this._map.unset("pointermove", this._move.bind(this));
        let feat = this._select.getFeatures().item(0);
        (this._feat_station_line.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
        let daten = this._get_station((feat.getGeometry() as Point).getCoordinates());

        if (daten == null || daten['pos'] == null) return;


        this._select.getFeatures().clear();
        (feat.getGeometry() as Point).setCoordinates(daten['pos'][6]);

        let station = Math.round(daten['pos'][2] * (feat as StrassenAusPunkt).abschnitt.getFaktor());
        let abstand = Math.round(daten['pos'][4] * 10) / 10;
        let seite = daten['pos'][3]
        if (seite == 'M') abstand = 0;
        else if (seite == 'L') abstand = -abstand;
        console.log(abstand);

        (feat as StrassenAusPunkt).updateStation(station, abstand);
    }

    _get_station(coordinates) {
        let achse = null;
        if (this._select.getFeatures().getLength() > 0) {
            achse = (this._select.getFeatures().item(0) as StrassenAusPunkt).abschnitt;
        } else {
            return null;
        }

        return { achse: achse, pos: Vektor.get_pos(achse.getGeometry().getCoordinates(), coordinates) };
    }

    _move(event) {
        let daten = this._get_station(event.coordinate);

        if (daten == null || daten['pos'] == null) return;

        //this._select.getFeatures().item(0).getGeometry().setCoordinates(daten['pos'][6]);
        (this._feat_station_line.getGeometry() as LineString).setCoordinates([daten['pos'][6], daten['pos'][5]]);
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
        (this._feat_station_line.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
    }
}