import { Circle, Style, Stroke, Fill } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import Vektor from '../Vektor';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { LineString, Point } from 'ol/geom';
import Feature from 'ol/Feature';
import { never as neverCondition } from 'ol/events/condition';
import { Map, MapBrowserEvent } from 'ol';
import InfoTool from './InfoTool';
import Tool from './prototypes/Tool';
import { ModifyInteraction } from '../openLayers/Interaction';
import { Coordinate } from 'ol/coordinate';
import PunktObjekt from '../Objekte/PunktObjekt';
import { SelectEvent } from 'ol/interaction/Select';
import { ModifyEvent } from 'ol/interaction/Modify';

/**
 * Funktion zum Verschieben von Punktobjekten
 * @author Florian Timm, LGV HH 
 * @version 2019.09.19
 * @copyright MIT
 */

export default class MoveTool extends Tool {
    private map: Map;
    private infoTool: InfoTool;
    private select: SelectInteraction;
    private v_overlay: VectorSource;
    private l_overlay: VectorLayer;
    private feat_station_line: Feature;
    private modify: ModifyInteraction;
    
    constructor(map: Map, avInfoTool: InfoTool, selectLayer: VectorLayer) {
        super();
        this.map = map;
        this.infoTool = avInfoTool;

        this.select = new SelectInteraction({
            layers: [selectLayer],
        });

        this.createLayer();
        this.createModify();

        this.select.on("select", this.selected.bind(this));
    }

    private createLayer() {
        this.v_overlay = new VectorSource({
            features: []
        });
        this.l_overlay = new VectorLayer({
            source: this.v_overlay,
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
        this.feat_station_line = new Feature({ geometry: new LineString([[0, 0], [0, 0]]) });
        this.feat_station_line.setStyle(new Style({
            stroke: new Stroke({
                color: 'rgba(0, 0, 255, 0.5)',
                width: 2
            }),
        }));
        this.v_overlay.addFeature(this.feat_station_line);
    }

    private createModify() {
        this.modify = new ModifyInteraction({
            deleteCondition: neverCondition,
            insertVertexCondition: neverCondition,
            features: this.select.getFeatures()
        });
        this.modify.geo_vorher = null;
        this.modify.modify = this;

        this.modify.on('modifystart', this.modifyStart.bind(this));
        this.modify.on('modifyend', this.modifyEnd.bind(this));
    }

    private selected(event: SelectEvent) {
        if (this.select.getFeatures().getLength() > 0) {
            this.map.on("pointermove", this.move.bind(this));
        } else {
            console.log("unselect")
            this.map.unset("pointermove", this.move.bind(this));
            (this.feat_station_line.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
        }
        this.infoTool.featureSelected(event);
    }

    private modifyStart(event: ModifyEvent) {
        this.map.on("pointermove", this.move.bind(this));
    }

    private modifyEnd(event: ModifyEvent) {
        this.map.unset("pointermove", this.move.bind(this));
        let feat = this.select.getFeatures().item(0);
        (this.feat_station_line.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
        let daten = this.getStation((feat.getGeometry() as Point).getCoordinates());

        if (daten == null || daten['pos'] == null) return;


        this.select.getFeatures().clear();
        (feat.getGeometry() as Point).setCoordinates(daten['pos'][6]);

        let station = Math.round(daten['pos'][2] * (feat as PunktObjekt).abschnitt.getFaktor());
        let abstand = Math.round(daten['pos'][4] * 10) / 10;
        let seite = daten['pos'][3]
        if (seite == 'M') abstand = 0;
        else if (seite == 'L') abstand = -abstand;
        console.log(abstand);

        (feat as PunktObjekt).updateStation(station, abstand);
    }

    private getStation(coordinates: Coordinate) {
        let achse = null;
        if (this.select.getFeatures().getLength() > 0) {
            achse = (this.select.getFeatures().item(0) as PunktObjekt).abschnitt;
        } else {
            return null;
        }

        return { achse: achse, pos: Vektor.get_pos(achse.getGeometry().getCoordinates(), coordinates) };
    }

    private move(event: MapBrowserEvent) {
        let daten = this.getStation(event.coordinate);

        if (daten == null || daten['pos'] == null) return;

        //this._select.getFeatures().item(0).getGeometry().setCoordinates(daten['pos'][6]);
        (this.feat_station_line.getGeometry() as LineString).setCoordinates([daten['pos'][6], daten['pos'][5]]);
    }

    public start() {
        this.map.addInteraction(this.select);
        this.map.addInteraction(this.modify);
        this.map.addLayer(this.l_overlay);
    }

    public stop() {
        this.map.removeInteraction(this.select);
        this.map.removeInteraction(this.modify);
        this.map.removeLayer(this.l_overlay);
        this.map.unset("pointermove", this.move.bind(this));
        (this.feat_station_line.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
    }
}