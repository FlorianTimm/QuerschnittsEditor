import { Circle, Style, Stroke, Fill } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Point, LineString } from 'ol/geom';
import Feature from 'ol/Feature';
import Tool from '../prototypes/Tool';
import { MapBrowserEvent } from 'ol';
import Map from "../../openLayers/Map";
import Abschnitt, { StationObj } from '../../Objekte/Abschnitt';
import PublicWFS from '../../PublicWFS';
import PunktObjekt from '../../Objekte/prototypes/PunktObjekt';

/**
 * Funktion zum Hinzufügen von Objekten
 * @author Florian Timm, LGV HH 
 * @version 2019.09.20
 * @copyright MIT
 */

export default abstract class AddTool extends Tool {
    protected map: Map;
    protected abschnitt: Abschnitt = null;
    protected station: number = null;
    protected abstand: number = null;
    protected seite: string = null;
    protected select: SelectInteraction;
    protected v_overlay: VectorSource;
    protected l_overlay: VectorLayer;
    protected feat_station: Feature;
    protected feat_neu: Feature;
    protected feat_station_line: Feature;
    protected form: HTMLFormElement = null;
    protected sidebar: HTMLDivElement;
    private layerAchse: VectorLayer;
    private promise: Promise<void>;

    protected abstract createForm(): Promise<void>;

    constructor(map: Map, sidebar: HTMLDivElement, layerAchse: VectorLayer) {
        super(map);
        this.sidebar = sidebar;
        this.layerAchse = layerAchse;

        this.createAchsSelect();
        this.createOverlayGeometry();
    }

    calcStation(event: MapBrowserEvent) {
        this.feat_neu.set('isset', true);
        let daten = this.part_get_station(event);
        if (daten['pos'] == null) return null;

        (this.feat_neu.getGeometry() as Point).setCoordinates(daten['pos'].neuerPkt);

        this.abschnitt = daten['achse'];
        this.station = daten['pos'].station;
        this.abstand = daten['pos'].abstand;
        this.seite = daten['pos'].seite
        if (this.seite == 'M') this.abstand = 0;
        if (this.seite == 'L') this.abstand = -this.abstand;
        return daten;
    }

    private createOverlayGeometry() {
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
        this.feat_station = new Feature({ geometry: new Point([0, 0]) });
        this.feat_station.setStyle(new Style({
            image: new Circle({
                radius: 3,
                fill: new Fill({ color: [0, 0, 200], }),
                stroke: new Stroke({
                    color: [0, 0, 200], width: 2
                })
            }),
        }));
        this.v_overlay.addFeature(this.feat_station);
        this.feat_neu = new Feature({ geometry: new Point([0, 0]) });
        this.feat_neu.setStyle(new Style({
            image: new Circle({
                radius: 3,
                fill: new Fill({ color: 'black' }),
                stroke: new Stroke({
                    color: 'rgba(50,50,250,0.9)', width: 3
                })
            })

        }));
        this.v_overlay.addFeature(this.feat_neu);
        this.feat_station_line = new Feature({ geometry: new LineString([[0, 0], [0, 0]]) });
        this.feat_station_line.setStyle(new Style({
            stroke: new Stroke({
                color: 'rgba(0, 0, 255, 0.5)',
                width: 2
            }),
        }));
        this.v_overlay.addFeature(this.feat_station_line);
    }

    private createAchsSelect() {
        this.select = new SelectInteraction({
            layers: [this.layerAchse],
            style: new Style({
                stroke: new Stroke({
                    color: 'rgba(0, 50, 255, 0.5)',
                    width: 5
                })
            })
        });
    }

    part_get_station(event: MapBrowserEvent): { achse: Abschnitt, pos: StationObj } {
        let achse: Abschnitt = null;
        if (this.select.getFeatures().getArray().length > 0) {
            achse = this.select.getFeatures().item(0) as Abschnitt;
        } else {
            achse = this.layerAchse.getSource().getClosestFeatureToCoordinate(event.coordinate) as Abschnitt;
        }

        if (achse == null) {
            (this.feat_station.getGeometry() as Point).setCoordinates([0, 0]);
            (this.feat_station_line.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
            return null;
        }

        return { achse: achse, pos: achse.getStationierung(event.coordinate) };
    }

    protected part_click(event: MapBrowserEvent) {
        let daten = this.calcStation(event);
        if (daten == null) return
        this.refreshStationierung(daten);
        this.promise.then(() => {
            $(this.form).find("input[type='submit']").prop("disabled", false);
        })

    }

    private refreshStationierung(daten: { achse: Abschnitt; pos: StationObj; }) {
        $(this.form).find("#vnk").val(daten.achse.getVnk());
        $(this.form).find("#nnk").val(daten.achse.getNnk());
        $(this.form).find("#station").val(String(daten.pos.station));
        $(this.form).find("#abstand").val(daten.pos.seite + ' ' + daten.pos.abstand);
    }

    protected part_move(event: MapBrowserEvent) {
        let daten = this.part_get_station(event);

        if (daten == null || daten.pos == null) return;

        (this.feat_station.getGeometry() as Point).setCoordinates(daten.pos.neuerPkt);
        (this.feat_station_line.getGeometry() as LineString).setCoordinates([daten.pos.neuerPkt, daten.pos.fusspkt]);

        if (this.abschnitt == null) {
            this.refreshStationierung(daten)
        }
    }

    protected async getInsertResults(xml: XMLDocument): Promise<PunktObjekt[]> {
        this.abschnitt = null;
        this.station = null;
        this.seite = null;
        (this.feat_neu.getGeometry() as Point).setCoordinates([0, 0]);
        let filter = '<Filter>';
        let childs = xml.getElementsByTagName('InsertResult')[0].childNodes;
        for (let i = 0; i < childs.length; i++) {
            filter += '<FeatureId fid="' + (childs[i] as Element).getAttribute('fid') + '"/>';
        }
        filter += '</Filter>';
        const xml2 = await PublicWFS.doQuery(this.getObjektklasse(), filter);
        return this.loadERCallback(xml2);
    }

    protected abstract loadERCallback(xml: XMLDocument): Promise<PunktObjekt[]>;
    public abstract getObjektklasse(): string;

    start() {
        if (this.form == null) this.promise = this.createForm();
        $(this.form).show("fast");
        this.map.addInteraction(this.select);
        this.map.on("pointermove", this.part_move.bind(this));
        this.map.on("singleclick", this.part_click.bind(this));
        this.map.addLayer(this.l_overlay);
    }

    stop() {
        $(this.form).hide("fast");
        this.map.removeInteraction(this.select);
        this.map.un("pointermove", this.part_move);
        this.map.un("singleclick", this.part_click);
        this.map.removeLayer(this.l_overlay);
    }
}