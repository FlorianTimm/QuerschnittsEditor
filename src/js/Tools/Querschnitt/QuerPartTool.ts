import { Circle, Style, Stroke, Fill } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import Vektor from '../../Vektor';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Point, LineString } from 'ol/geom';
import Feature from 'ol/Feature';
import Tool from '../prototypes/Tool';
import QuerInfoTool from './QuerInfoTool';
import Daten from '../../Daten';
import { Map, MapBrowserPointerEvent } from 'ol';
import Abschnitt, { StationObj } from 'src/js/Objekte/Abschnitt';

/**
 * Funktion zum Teilen von Querschnittsflächen
 * @author Florian Timm, LGV HH 
 * @version 2019.05.20
 * @copyright MIT
 */
class QuerPartTool extends Tool {
    map: Map;
    daten: Daten;
    info: QuerInfoTool;
    select: SelectInteraction;
    v_overlay: VectorSource;
    l_overlay: VectorLayer;
    feat_station: Feature;
    feat_teilung: Feature;
    feat_station_line: Feature;

    constructor(map: Map, daten: Daten, info: QuerInfoTool) {
        super();
        this.map = map;
        this.daten = daten;
        this.info = info;

        this.select = new SelectInteraction({
            layers: [this.daten.layerAchse],
            style: new Style({
                stroke: new Stroke({
                    color: 'rgba(0, 50, 255, 0.5)',
                    width: 5
                })
            })
        });


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
        this.feat_station.setStyle(
            new Style({
                image: new Circle({
                    radius: 3,
                    fill: new Fill({ color: [0, 0, 200], }),
                    stroke: new Stroke({
                        color: [0, 0, 200], width: 2
                    })
                }),
            })
        )
        this.v_overlay.addFeature(this.feat_station);

        this.feat_teilung = new Feature({
            geometry: new LineString([[0, 0], [0, 0]]),
            isset: false,
            abschnittid: null,
            station: 0,
        });
        this.feat_teilung.setStyle(
            new Style({
                stroke: new Stroke({
                    color: 'rgba(255, 0, 0, 1)',
                    width: 2
                }),
            })
        );
        this.v_overlay.addFeature(this.feat_teilung);

        this.feat_station_line = new Feature({ geometry: new LineString([[0, 0], [0, 0]]) });
        this.feat_station_line.setStyle(
            new Style({
                stroke: new Stroke({
                    color: 'rgba(0, 0, 255, 0.5)',
                    width: 2
                }),
            })
        );
        this.v_overlay.addFeature(this.feat_station_line);

        document.getElementById('teilen_button').addEventListener('click', this.partQuerschnittButton.bind(this))
    }

    part_get_station(event: MapBrowserPointerEvent): { achse: Abschnitt, pos: StationObj } {
        let achse: Abschnitt = null;
        if (this.select.getFeatures().getArray().length > 0) {
            achse = this.select.getFeatures().item(0) as Abschnitt;
        } else {
            achse = this.daten.vectorAchse.getClosestFeatureToCoordinate(event.coordinate) as Abschnitt;
        }

        if (achse == null) {
            (this.feat_station.getGeometry() as LineString).setCoordinates([0, 0]);
            (this.feat_station_line.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
            return null;
        }

        return { achse: achse, pos: achse.calcStationierung(event.coordinate) };
    }


    part_click(event: MapBrowserPointerEvent) {
        if (!this.feat_teilung.get('isset')) {
            this.feat_teilung.set('isset', true);
            let daten = this.part_get_station(event);
            if (daten['pos'] == null) return;

            let vektor = Vektor.multi(Vektor.einheit(Vektor.diff(daten['pos'].neuerPkt, daten['pos'].fusspkt)), 50);
            let coord = [Vektor.diff(daten['pos'].fusspkt, vektor), Vektor.sum(daten['pos'].fusspkt, vektor)];

            (this.feat_teilung.getGeometry() as LineString).setCoordinates(coord);
            this.feat_teilung.set("abschnittid", daten['achse'].getAbschnittid());
            this.feat_teilung.set("station", Math.round(daten['pos'].station));

            document.getElementById("teilen_vnk").innerHTML = daten['achse'].getVnk();
            document.getElementById("teilen_nnk").innerHTML = daten['achse'].getNnk();
            document.getElementById("teilen_station").innerHTML = String(Math.round(daten['pos'].station));

            (document.getElementById("teilen_button") as HTMLInputElement).disabled = false;
        } else {
            this.restartSelection();
        }
    }

    private restartSelection() {
        this.feat_teilung.set('isset', false);
        (this.feat_teilung.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
        (document.getElementById("teilen_button") as HTMLInputElement).disabled = true;
    }

    part_move(event: MapBrowserPointerEvent) {

        let daten = this.part_get_station(event);
        //console.log(daten)
        if (daten.pos == null) return;

        (this.feat_station.getGeometry() as LineString).setCoordinates(daten.pos.neuerPkt);
        (this.feat_station_line.getGeometry() as LineString).setCoordinates([daten.pos.neuerPkt, daten.pos.fusspkt]);

        if (!this.feat_teilung.get('isset')) {
            document.getElementById("teilen_vnk").innerHTML = daten.achse.getVnk();
            document.getElementById("teilen_nnk").innerHTML = daten.achse.getNnk();
            document.getElementById("teilen_station").innerHTML = String(Math.round(daten.pos.station))
        }
    }

    partQuerschnittButton() {
        let absid = this.feat_teilung.get("abschnittid");
        let station = this.feat_teilung.get("station");

        //console.log(this.daten.getAbschnitt(absid));

        let sta = this.daten.getAbschnitt(absid).getStationByStation(station);
        sta.teilen(station);
        this.feat_teilung.set('isset', false);
        (this.feat_teilung.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
        (document.getElementById("teilen_button") as HTMLInputElement).disabled = true;
    }

    start() {
        this.map.addInteraction(this.select);
        document.forms.namedItem("teilen").style.display = 'block';
        this.map.on("pointermove", this.part_move.bind(this));
        this.map.on("singleclick", this.part_click.bind(this));
        this.map.addLayer(this.l_overlay);
        this.restartSelection();
    }

    stop() {
        this.map.removeInteraction(this.select);
        document.forms.namedItem("teilen").style.display = 'none';
        this.map.un("pointermove", this.part_move);
        this.map.un("singleclick", this.part_click);
        (this.feat_station.getGeometry() as LineString).setCoordinates([0, 0]);
        (this.feat_teilung.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
        this.info.hideInfoBox();
        this.map.removeLayer(this.l_overlay);
    }
}

export default QuerPartTool;