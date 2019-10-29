import { Circle, Style, Stroke, Fill } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import Vektor from '../../Vektor';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Point, LineString } from 'ol/geom';
import Feature from 'ol/Feature';
import Tool from '../prototypes/Tool';
import { Map, MapBrowserEvent } from 'ol';
import Abschnitt from '../../Objekte/Abschnitt';
import Daten from '../../Daten';

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

    constructor(map: Map) {
        super();
        this.map = map;

        this.createAchsSelect();
        this.createOverlayGeometry();
    }

    calcStation(event: MapBrowserEvent) {
        this.feat_neu.set('isset', true);
        let daten = this.part_get_station(event);
        if (daten['pos'] == null) return;

        (this.feat_neu.getGeometry() as Point).setCoordinates(daten['pos'][6]);

        this.abschnitt = daten['achse'];
        this.station = Math.round(daten['pos'][2] * this.abschnitt.getFaktor());
        this.abstand = Math.round(daten['pos'][4] * 10) / 10;
        this.seite = daten['pos'][3]
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
        this.feat_neu.setStyle(function (feature, zoom) {
            return new Style({
                image: new Circle({
                    radius: 3,
                    fill: new Fill({ color: 'black' }),
                    stroke: new Stroke({
                        color: 'rgba(50,50,250,0.9)', width: 3
                    })
                })
            });
        });
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
            layers: [Daten.getInstanz().layerAchse],
            style: new Style({
                stroke: new Stroke({
                    color: 'rgba(0, 50, 255, 0.5)',
                    width: 5
                })
            })
        });
    }

    part_get_station(event: MapBrowserEvent) {
        let achse = null;
        if (this.select.getFeatures().getArray().length > 0) {
            achse = this.select.getFeatures().item(0);
        } else {
            achse = Daten.getInstanz().vectorAchse.getClosestFeatureToCoordinate(event.coordinate);
        }

        if (achse == null) {
            (this.feat_station.getGeometry() as Point).setCoordinates([0, 0]);
            (this.feat_station_line.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
            return null;
        }

        return { achse: achse, pos: Vektor.get_pos(achse.getGeometry().getCoordinates(), event.coordinate) };
    }

    protected abstract part_move(event: MapBrowserEvent): void;
    protected abstract part_click(event: MapBrowserEvent): void;

    start() {
        this.map.addInteraction(this.select);
        this.map.on("pointermove", this.part_move.bind(this));
        this.map.on("singleclick", this.part_click.bind(this));
        this.map.addLayer(this.l_overlay);
    }

    stop() {
        this.map.removeInteraction(this.select);
        this.map.un("pointermove", this.part_move);
        this.map.un("singleclick", this.part_click);
        this.map.removeLayer(this.l_overlay);
    }
}