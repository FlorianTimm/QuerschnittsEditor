// SPDX-License-Identifier: GPL-3.0-or-later

import Feature, { FeatureLike } from 'ol/Feature';
import { LineString } from 'ol/geom';
import { Select as SelectInteraction } from 'ol/interaction';
import { Vector as VectorLayer } from 'ol/layer';
import { unByKey } from 'ol/Observable';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
import { HTML } from '../../HTML';
import { Abschnitt, StationObj } from '../../Objekte/Abschnitt';
import { Map } from "../../openLayers/Map";
import { PublicWFS } from '../../PublicWFS';
import { Vektor } from '../../Vektor';
import { Tool } from '../prototypes/Tool';
import { QuerInfoTool } from './QuerInfoTool';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { EventsKey } from 'ol/events';

/**
 * Funktion zum Teilen von Querschnittsflächen
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.04.03
 * @license GPL-3.0-or-later
*/
export class QuerPartTool extends Tool {
    private info: QuerInfoTool;
    private select: SelectInteraction;
    private l_overlay: VectorLayer<VectorSource<LineString>>;
    private feat_teilung: Feature<LineString>;
    private feat_station_line: Feature<LineString>;
    private abschnitt: Abschnitt | undefined;
    private station: number;
    private init: boolean = false;
    private form: HTMLFormElement;
    private sidebar: HTMLDivElement;
    private form_vnk: HTMLInputElement;
    private form_nnk: HTMLInputElement;
    private form_station: HTMLInputElement;
    private form_button: HTMLInputElement;
    private layerAchse: VectorLayer<VectorSource<LineString>>;
    private singleclick: EventsKey;
    private pointermove: EventsKey;

    constructor(map: Map, info: QuerInfoTool, sidebar: HTMLDivElement, layerAchse: VectorLayer<VectorSource<LineString>>) {
        super(map);
        this.info = info;
        this.sidebar = sidebar;
        this.layerAchse = layerAchse;
    }

    private initialize() {
        if (this.init) return;

        this.select = new SelectInteraction({
            layers: [this.layerAchse]
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
        this.form_button.addEventListener('click', this.querschnittButton.bind(this))
    }

    private createOverlayVectorLayer() {
        let v_overlay = new VectorSource<LineString>();
        this.l_overlay = new VectorLayer<VectorSource<LineString>>({
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
        this.feat_teilung = new Feature<LineString>({
            geometry: new LineString([[0, 0], [0, 0]]),
            color: 'rgba(255, 0, 0, 1)'
        });
        v_overlay.addFeature(this.feat_teilung);
        this.feat_station_line = new Feature<LineString>({
            geometry: new LineString([[0, 0], [0, 0]]),
            color: 'rgba(0, 0, 255, 0.5)'
        });
        v_overlay.addFeature(this.feat_station_line);
    }

    private getStation(event: MapBrowserEvent<UIEvent>): { achse: Abschnitt, pos: StationObj } {
        let achse: Abschnitt;
        if (this.select.getFeatures().getArray().length == 1) {
            achse = this.select.getFeatures().item(0) as Abschnitt;
        } else {
            achse = this.layerAchse.getSource().getClosestFeatureToCoordinate(event.coordinate) as Abschnitt;
        }

        if (achse == null) {
            (this.feat_station_line.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
            throw new Error("Keine Achsen geladen");
        }
        return { achse: achse, pos: achse.getStationierung(event.coordinate, 2) };
    }

    private partClick(event: MapBrowserEvent<UIEvent>) {
        this.feat_teilung.set('isset', true);
        let daten = this.getStation(event);
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

    private move(event: MapBrowserEvent<UIEvent>) {
        let daten = this.getStation(event);
        let vektor = Vektor.multi(Vektor.einheit(Vektor.diff(daten['pos'].neuerPkt, daten['pos'].fusspkt)), daten.pos.abstand > 50 ? daten.pos.abstand : 50);
        let coord = [Vektor.diff(daten['pos'].fusspkt, vektor), Vektor.sum(daten['pos'].fusspkt, vektor)];

        if (daten.pos == null) return;
        (this.feat_station_line.getGeometry() as LineString).setCoordinates(coord);

        this.form_vnk.value = daten.achse.getVnk();
        this.form_nnk.value = daten.achse.getNnk();
        this.form_station.value = String(daten.pos.station);
    }

    private querschnittButton() {
        if (!this.abschnitt) return;
        let sta = this.abschnitt.getStationByStation(this.station);
        sta.teilen(this.station)
            .then(() => { PublicWFS.showMessage("erfolgreich", false) })
            .catch(() => { PublicWFS.showMessage("Fehler", true) });;
        this.restartSelection();
    }

    public start() {
        this.initialize()
        this.map.addInteraction(this.select);
        $(this.form).show("fast")
        this.pointermove = this.map.on("pointermove", this.move.bind(this));
        this.singleclick = this.map.on("singleclick", this.partClick.bind(this));
        this.map.addLayer(this.l_overlay);
        this.restartSelection()
    }

    public stop() {
        if (!this.init) return;
        $(this.form).hide("fast")
        this.map.removeInteraction(this.select);
        unByKey(this.pointermove);
        unByKey(this.singleclick);
        (this.feat_teilung.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
        this.info.hideInfoBox();
        this.map.removeLayer(this.l_overlay);
    }
}