// SPDX-License-Identifier: GPL-3.0-or-later

import { Circle, Style, Stroke, Fill } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { LineString, Point, Geometry } from 'ol/geom';
import Feature from 'ol/Feature';
import { never as neverCondition } from 'ol/events/condition';
import { MapBrowserEvent, Collection, Observable } from 'ol';
import InfoTool from './InfoTool';
import Tool from './prototypes/Tool';
import { ModifyInteraction } from '../openLayers/Interaction';
import { Coordinate } from 'ol/coordinate';
import PunktObjekt from '../Objekte/prototypes/PunktObjekt';
import { SelectEvent } from 'ol/interaction/Select';
import { ModifyEvent } from 'ol/interaction/Modify';
import Abschnitt, { StationObj } from '../Objekte/Abschnitt';
import Map from "../openLayers/Map";
import GeometryType from 'ol/geom/GeometryType';
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';

/**
 * Funktion zum Verschieben von Punktobjekten
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.04.03
 * @license GPL-3.0-or-later
*/
export default class MoveTool extends Tool {
    private infoTool: InfoTool;
    private select: SelectInteraction;
    private v_overlay: VectorSource<Geometry>;
    private l_overlay: VectorLayer;
    private feat_station_line: Feature<LineString>;
    private modifyPoint: ModifyInteraction;
    private lineRechts: Feature<Point>;
    private lineLinks: Feature<Point>;
    private modifyLine: ModifyInteraction;
    private linePreview: Feature<LineString>;
    private pointermove: EventsKey;

    constructor(map: Map, avInfoTool: InfoTool, selectLayer: VectorLayer) {
        super(map);
        this.infoTool = avInfoTool;

        this.select = new SelectInteraction({
            layers: [selectLayer],
            hitTolerance: 10
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
        this.feat_station_line = new Feature<LineString>({ geometry: new LineString([[0, 0], [0, 0]]) });
        this.feat_station_line.setStyle(new Style({
            stroke: new Stroke({
                color: 'rgba(0, 0, 255, 0.5)',
                width: 2
            }),
        }));
        this.v_overlay.addFeature(this.feat_station_line);
    }

    private createModify() {
        this.modifyPoint = new ModifyInteraction({
            deleteCondition: neverCondition,
            insertVertexCondition: neverCondition,
            features: this.select.getFeatures()
        });
        this.modifyPoint.geo_vorher = null;
        this.modifyPoint.modify = this;

        this.modifyPoint.on('modifystart', this.modifyStart.bind(this));
        this.modifyPoint.on('modifyend', this.modifyEnd.bind(this));
        this.modifyPoint.setActive(false)

        // zweibeinig

        this.lineRechts = new Feature<Point>()
        this.lineRechts.setStyle(new Style({
            image: new Circle({
                radius: 4,
                fill: new Fill({ color: 'rgba(0,255,0,0.6)' }),
                stroke: new Stroke({
                    color: 'rgba(0,255,0,0.9)',
                    width: 2
                })
            })
        }));
        this.lineLinks = new Feature<Point>()
        this.lineLinks.setStyle(new Style({
            image: new Circle({
                radius: 4,
                fill: new Fill({ color: 'rgba(255,0,0,0.6)' }),
                stroke: new Stroke({
                    color: 'rgba(255,0,0,0.9)',
                    width: 2
                })
            })
        }));

        this.linePreview = new Feature<LineString>()
        this.linePreview.setStyle(new Style({
            stroke: new Stroke({
                color: 'rgba(0, 0, 255, 0.5)',
                width: 2
            })
        }));

        this.v_overlay.addFeatures([this.lineLinks, this.lineRechts, this.linePreview]);

        this.modifyLine = new ModifyInteraction({
            deleteCondition: neverCondition,
            insertVertexCondition: neverCondition,
            features: new Collection([this.lineLinks, this.lineRechts])
        });
        this.modifyLine.on('modifystart', (e: ModifyEvent) => this.modifyLineStart(e));
        this.modifyLine.on('modifyend', (e: ModifyEvent) => this.modifyLineEnd(e));
        this.map.addInteraction(this.modifyLine);
    }

    modifyLineStart(__: ModifyEvent) {
        this.pointermove = this.map.on("pointermove", this.moveLine.bind(this));
    }

    modifyLineEnd(__: ModifyEvent) {
        unByKey(this.pointermove);
        let dat = this.calcZweibeinig();
        if (!dat) return;
        dat.feature.setGeometry(dat.linestring);
        dat.feature.updateStation(dat.vst, dat.rabstvst, dat.labstvst);
        this.lineRechts.setGeometry(null);
        this.lineLinks.setGeometry(null);
        this.linePreview.setGeometry(null);
        this.select.getFeatures().clear();
    }

    private selected(__: SelectEvent) {
        if (this.select.getFeatures().getLength() > 0) {
            console.log(this.select.getFeatures().item(0))
            if (this.select.getFeatures().item(0).getGeometry().getType() == GeometryType.LINE_STRING) {
                this.modifyPoint.setActive(false);
                this.changeLine(this.select.getFeatures().item(0) as Feature<LineString>);
            } else {
                this.modifyPoint.setActive(true);
                this.modifyLine.setActive(false);
            }
        } else {
            console.log("unselect")
            unByKey(this.pointermove);
            this.modifyPoint.setActive(false);
            this.modifyLine.setActive(false);
            this.lineRechts.setGeometry(null);
            this.lineLinks.setGeometry(null);
            (this.feat_station_line.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
        }
        this.infoTool.featureSelect(this.select, true)
    }

    private changeLine(feat: Feature<LineString>) {
        this.lineRechts.setGeometry(new Point(feat.getGeometry().getFirstCoordinate()));
        this.lineLinks.setGeometry(new Point(feat.getGeometry().getLastCoordinate()));
        this.lineRechts.set('feature', feat);
        this.lineLinks.set('feature', feat);
        this.modifyLine.setActive(true);
    }

    private calcZweibeinig(): { feature: PunktObjekt, vst: number, rabstvst: number, labstvst: number, linestring: LineString } | null {
        let feat = this.lineRechts.get('feature') as PunktObjekt;
        if (feat == null) return null;
        let rabstvst = feat.getRAbstBaVst();
        let labstvst = feat.getLAbstBaVst();
        let rechtsStation = feat.getAbschnitt().getStationierung(this.lineRechts.getGeometry().getCoordinates())
        let linksStation = feat.getAbschnitt().getStationierung(this.lineLinks.getGeometry().getCoordinates())
        let vst = feat.getVst()
        let rabstvstNeu = ((rechtsStation.seite == 'L') ? -1 : 1) * rechtsStation.abstand;
        let labstvstNeu = ((linksStation.seite == 'L') ? -1 : 1) * linksStation.abstand;


        if (Math.abs(rabstvstNeu - feat.getRAbstBaVst()) > 0.05) {
            // Rechts
            console.log("rechts")
            rabstvst = Math.round(rabstvstNeu * 10) / 10;
            vst = rechtsStation.station;
        } else if (Math.abs(labstvstNeu - feat.getLAbstBaVst()) > 0.01) {
            // Links
            console.log("links")
            labstvst = Math.round(labstvstNeu * 10) / 10;
            vst = linksStation.station;
        }
        let rechts = feat.getAbschnitt().stationierePunkt(vst, rabstvst)
        let links = feat.getAbschnitt().stationierePunkt(vst, labstvst)
        return { feature: feat, vst: vst, rabstvst: rabstvst, labstvst: labstvst, linestring: new LineString([rechts, links]) }
    }

    private moveLine() {
        let dat = this.calcZweibeinig();
        if (!dat) return;

        this.linePreview.setGeometry(dat.linestring)
    }

    private modifyStart(__: ModifyEvent) {
        this.pointermove = this.map.on("pointermove", this.move.bind(this));
    }

    private modifyEnd(__: ModifyEvent) {
        unByKey(this.pointermove);
        let feat = this.select.getFeatures().item(0);
        (this.feat_station_line.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
        let daten = this.getStation((feat.getGeometry() as Point).getCoordinates());

        if (daten == null || daten['pos'] == null) return;

        (feat.getGeometry() as Point).setCoordinates(daten['pos'].neuerPkt);

        let station = daten.pos.station
        let abstand = daten.pos.abstand;
        let seite = daten.pos.seite
        if (seite == 'M') abstand = 0;
        else if (seite == 'L') abstand = -abstand;
        console.log(abstand);

        (feat as PunktObjekt).updateStation(station, abstand);
    }

    private getStation(coordinates: Coordinate): { achse: Abschnitt, pos: StationObj } {
        let achse: Abschnitt = null;
        if (this.select.getFeatures().getLength() > 0) {
            achse = (this.select.getFeatures().item(0) as PunktObjekt).getAbschnitt();
        } else {
            return null;
        }

        return { achse: achse, pos: achse.getStationierung(coordinates) };
    }

    private move(event: MapBrowserEvent) {
        let daten = this.getStation(event.coordinate);

        if (daten == null || daten['pos'] == null) return;

        //this._select.getFeatures().item(0).getGeometry().setCoordinates(daten['pos'][6]);
        (this.feat_station_line.getGeometry() as LineString).setCoordinates([daten['pos'].fusspkt, daten['pos'].neuerPkt]);
    }

    public start() {
        this.map.addInteraction(this.select);
        this.map.addInteraction(this.modifyPoint);
        this.map.addLayer(this.l_overlay);
    }

    public stop() {
        this.map.removeInteraction(this.select);
        this.map.removeInteraction(this.modifyPoint);
        this.select.getFeatures().clear();
        this.map.removeLayer(this.l_overlay);
        if (this.pointermove)
            unByKey(this.pointermove);
        (this.feat_station_line.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
    }
}