import { Style, Stroke } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import Vektor from '../../Vektor';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { LineString } from 'ol/geom';
import Feature, { FeatureLike } from 'ol/Feature';
import Tool from '../prototypes/Tool';
import QuerInfoTool from './QuerInfoTool';
import Daten from '../../Daten';
import { Map, MapBrowserPointerEvent } from 'ol';
import Abschnitt, { StationObj } from '../../Objekte/Abschnitt';
import HTML from '../../HTML';

/**
 * Funktion zum Teilen von Querschnittsflächen
 * @author Florian Timm, LGV HH 
 * @version 2019.05.20
 * @copyright MIT
 */
class QuerPartTool extends Tool {
    private map: Map;
    private daten: Daten;
    private info: QuerInfoTool;
    private select: SelectInteraction;
    private l_overlay: VectorLayer;
    private feat_teilung: Feature;
    private feat_station_line: Feature;
    private abschnitt: Abschnitt | undefined;
    private station: number;
    private init: boolean = false;
    private form: HTMLFormElement;
    private sidebar: HTMLDivElement;
    private form_vnk: HTMLInputElement;
    private form_nnk: HTMLInputElement;
    private form_station: HTMLInputElement;
    private form_button: HTMLInputElement;

    constructor(map: Map, info: QuerInfoTool, sidebar: HTMLDivElement) {
        super();
        this.map = map;
        this.daten = Daten.getInstanz();
        this.info = info;
        this.sidebar = sidebar;
    }

    private initialize() {
        if (this.init) return;

        this.select = new SelectInteraction({
            layers: [this.daten.layerAchse]
        });

        this.createOverlayVectorLayer();
        this.createForm();

        this.init = true;
    }

    private createForm() {
        this.form = HTML.createToolForm(this.sidebar, false, "teilen");
        this.form_vnk = HTML.createTextInput(this.form, "Von Netzknoten", "vnk");
        this.form_vnk.disabled = true;
        this.form_nnk = HTML.createTextInput(this.form, "Nach Netzknoten", "nnk");
        this.form_nnk.disabled = true;
        this.form_station = HTML.createTextInput(this.form, "Station", "vst");
        this.form_station.disabled = true;
        this.form_button = HTML.createButton(this.form, "Teilen", "button");
        this.form_button.disabled = true;
        this.form_button.addEventListener('click', this.partQuerschnittButton.bind(this))
    }

    private createOverlayVectorLayer() {
        let v_overlay = new VectorSource();
        this.l_overlay = new VectorLayer({
            source: v_overlay,
            style: function (feat: FeatureLike) {
                return new Style({
                    stroke: new Stroke({
                        color: feat.get("color") ?? "#ccc",
                        width: 2
                    })
                });
            }
        });
        this.feat_teilung = new Feature({
            geometry: new LineString([[0, 0], [0, 0]]),
            color: 'rgba(255, 0, 0, 1)'
        });
        v_overlay.addFeature(this.feat_teilung);
        this.feat_station_line = new Feature({
            geometry: new LineString([[0, 0], [0, 0]]),
            color: 'rgba(0, 0, 255, 0.5)'
        });
        v_overlay.addFeature(this.feat_station_line);
    }

    part_get_station(event: MapBrowserPointerEvent): { achse: Abschnitt, pos: StationObj } {
        let achse: Abschnitt;
        if (this.select.getFeatures().getArray().length == 1) {
            achse = this.select.getFeatures().item(0) as Abschnitt;
        } else {
            achse = this.daten.vectorAchse.getClosestFeatureToCoordinate(event.coordinate) as Abschnitt;
        }

        if (achse == null) {
            (this.feat_station_line.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
            throw new Error("Keine Achsen geladen");
        }

        return { achse: achse, pos: achse.getStationierung(event.coordinate, 2) };
    }


    part_click(event: MapBrowserPointerEvent) {
        this.feat_teilung.set('isset', true);
        let daten = this.part_get_station(event);
        if (daten['pos'] == null) return;

        let vektor = Vektor.multi(Vektor.einheit(Vektor.diff(daten['pos'].neuerPkt, daten['pos'].fusspkt)), daten.pos.abstand > 50 ? daten.pos.abstand : 50);
        let coord = [Vektor.diff(daten['pos'].fusspkt, vektor), Vektor.sum(daten['pos'].fusspkt, vektor)];

        (this.feat_teilung.getGeometry() as LineString).setCoordinates(coord);
        this.abschnitt = daten['achse'];
        this.station = daten['pos'].station;

        this.form_vnk.value = this.abschnitt.getVnk();
        this.form_nnk.value = this.abschnitt.getNnk();
        this.form_station.value = String(this.station);

        this.form_button.disabled = false;
    }

    private restartSelection() {
        this.abschnitt = undefined;
        this.station = 0;
        (this.feat_teilung.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
        this.form_button.disabled = true;
    }

    part_move(event: MapBrowserPointerEvent) {
        let daten = this.part_get_station(event);
        let vektor = Vektor.multi(Vektor.einheit(Vektor.diff(daten['pos'].neuerPkt, daten['pos'].fusspkt)), daten.pos.abstand > 50 ? daten.pos.abstand : 50);
        let coord = [Vektor.diff(daten['pos'].fusspkt, vektor), Vektor.sum(daten['pos'].fusspkt, vektor)];

        if (daten.pos == null) return;
        (this.feat_station_line.getGeometry() as LineString).setCoordinates(coord);

        this.form_vnk.value = daten.achse.getVnk();
        this.form_nnk.value = daten.achse.getNnk();
        this.form_station.value = String(daten.pos.station);
    }

    partQuerschnittButton() {
        if (!this.abschnitt) return;
        let sta = this.abschnitt.getStationByStation(this.station);
        sta.teilen(this.station);
        this.restartSelection();
    }

    start() {
        this.initialize()
        this.map.addInteraction(this.select);
        $(this.form).show("fast")
        this.map.on("pointermove", this.part_move.bind(this));
        this.map.on("singleclick", this.part_click.bind(this));
        this.map.addLayer(this.l_overlay);
        this.restartSelection()
    }

    stop() {
        if (!this.init) return;
        $(this.form).hide("fast")
        this.map.removeInteraction(this.select);
        this.map.un("pointermove", this.part_move);
        this.map.un("singleclick", this.part_click);
        (this.feat_teilung.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
        this.info.hideInfoBox();
        this.map.removeLayer(this.l_overlay);
    }
}

export default QuerPartTool;