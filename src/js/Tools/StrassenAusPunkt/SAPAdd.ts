import { Circle, Style, Stroke, Fill } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import Vektor from '../../Vektor';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Point, LineString } from 'ol/geom';
import Feature from 'ol/Feature';
import PublicWFS from '../../PublicWFS';
import StrassenAusPunkt from '../../Objekte/StrassenAusPunkt';
import Tool from '../Tool';
import { Map } from 'ol';
import Daten from '../../Daten';
import Abschnitt from '../../Objekte/Abschnitt';
var CONFIG = require('../../config.json');

/**
 * Funktion zum Hinzufügen von Straßenausstattung (punktuell)
 * @author Florian Timm, LGV HH 
 * @version 2019.08.14
 * @copyright MIT
 */

export default class SAPAdd implements Tool {
    map: Map;
    daten: Daten;

    abschnitt: Abschnitt = null;
    station: number = null;
    abstand: number = null;
    seite: string = null;

    select: SelectInteraction;
    v_overlay: VectorSource;
    l_overlay: VectorLayer;
    feat_station: Feature;
    feat_neu: Feature;
    feat_station_line: Feature;

    constructor(map: Map) {
        this.map = map;
        this.daten = Daten.getInstanz();

        console.log(Daten.getInstanz())
        this.select = new SelectInteraction({
            layers: [this.daten.l_achse],
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
        this.feat_station_line.setStyle(
            new Style({
                stroke: new Stroke({
                    color: 'rgba(0, 0, 255, 0.5)',
                    width: 2
                }),
            })
        );
        this.v_overlay.addFeature(this.feat_station_line);

        document.getElementById('sapadd_button').addEventListener('click', this.addAufstellButton.bind(this));
    }

    part_get_station(event) {
        let achse = null;
        if (this.select.getFeatures().getArray().length > 0) {
            achse = this.select.getFeatures().item(0);
        } else {
            achse = this.daten.v_achse.getClosestFeatureToCoordinate(event.coordinate);
        }

        if (achse == null) {
            (this.feat_station.getGeometry() as Point).setCoordinates([0, 0]);
            (this.feat_station_line.getGeometry() as LineString).setCoordinates([[0, 0], [0, 0]]);
            return null;
        }

        return { achse: achse, pos: Vektor.get_pos(achse.getGeometry().getCoordinates(), event.coordinate) };
    }


    part_click(event) {
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

        (document.getElementById("sapadd_vnk") as HTMLInputElement).value = daten['achse'].vnk;
        (document.getElementById("sapadd_nnk") as HTMLInputElement).value = daten['achse'].nnk;
        (document.getElementById("sapadd_station") as HTMLInputElement).value = String(this.station);
        (document.getElementById("sapadd_abstand") as HTMLInputElement).value = daten['pos'][3] + ' ' + daten['pos'][4].toFixed(1);

        (document.getElementById("sapadd_button") as HTMLInputElement).disabled = false;

    }

    part_move(event) {
        let daten = this.part_get_station(event);

        if (daten == null || daten['pos'] == null) return;

        (this.feat_station.getGeometry() as Point).setCoordinates(daten['pos'][6]);
        (this.feat_station_line.getGeometry() as LineString).setCoordinates([daten['pos'][6], daten['pos'][5]]);

        if (this.abschnitt == null) {
            (document.getElementById("sapadd_vnk") as HTMLInputElement).value = daten['achse'].vnk;
            (document.getElementById("sapadd_nnk") as HTMLInputElement).value = daten['achse'].nnk;
            (document.getElementById("sapadd_station") as HTMLInputElement).value = String(Math.round(daten['pos'][2] * daten['achse'].getFaktor()));
            (document.getElementById("sapadd_abstand") as HTMLInputElement).value = daten['pos'][3] + ' ' + daten['pos'][4].toFixed(1)
        }
    }

    addAufstellButton() {
        // im ER?
        if (!("Otstrauspkt" in this.abschnitt.inER)) {
            PublicWFS.addInER(this.abschnitt, "Otstrauspkt", this.daten.ereignisraum_nr, this._addInER_Callback, undefined, this);
        } else {
            this._wfsAddStrausPkt()
        }
    }

    _addInER_Callback(xml: XMLDocument) {
        StrassenAusPunkt.loadAbschnittER(this.abschnitt, this._wfsAddStrausPkt.bind(this))
    }

    _wfsAddStrausPkt() {
        let soap = '<wfs:Insert>\n' +
            '<Otstrauspkt>\n' +
            '<projekt xlink:href="#' + this.daten.ereignisraum + '" typeName="Projekt" />\n' +
            '<abschnittId>' + this.abschnitt.abschnittid + '</abschnittId>\n' +
            '<vst>' + this.station + '</vst>\n' +
            '<bst>' + this.station + '</bst>\n' +
            '<rabstbaVst>' + this.abstand + '</rabstbaVst>\n' +
            '<vabstVst>' + this.abstand + '</vabstVst>\n' +
            '<vabstBst>' + this.abstand + '</vabstBst>\n' +
            '<bemerkung>mit QuerschnittsEditor erfasst</bemerkung>\n' +
            '<detailgrad xlink:href="' + CONFIG.DETAIL_HOCH + '" typeName="Itobjdetailgrad" />\n' +
            '<erfart xlink:href="' + CONFIG.ERFASSUNG + '" typeName="Iterfart" />\n' +
            '<ADatum>' + (new Date()).toISOString().substring(0, 10) + '</ADatum>\n' +
            '<rlageVst xlink:href="#S' + document.forms.namedItem("sapadd").sapadd_lage.value + '" typeName="Itallglage" />\n' +
            '<art xlink:href="#S' + document.forms.namedItem("sapadd").sapadd_art.value + '" typeName="Itstrauspktart" />\n' +
            '<quelle xlink:href="#S' + document.forms.namedItem("sapadd").sapadd_quelle.value + '" typeName="Itquelle" />\n' +
            '</Otstrauspkt> </wfs:Insert>';
        //console.log(soap)
        PublicWFS.doTransaction(soap, this._getInsertResults.bind(this));
    }

    _getInsertResults(xml: XMLDocument) {
        PublicWFS.showMessage("erfolgreich");
        this.abschnitt = null;
        this.station = null;
        this.seite = null;
        (this.feat_neu.getGeometry() as Point).setCoordinates([0, 0]);
        let filter = '<Filter>';
        xml.getElementsByTagName('InsertResult')[0].childNodes.forEach(
            function (f: ChildNode) {
                filter += '<FeatureId fid="' + (f as Element).getAttribute('fid') + '"/>';
            });
        filter += '</Filter>';
        PublicWFS.doQuery('Otstrauspkt', filter, StrassenAusPunkt._loadER_Callback);
    }

    start() {
        this.map.addInteraction(this.select);
        document.forms.namedItem("sapadd").style.display = 'block';
        this.map.on("pointermove", this.part_move.bind(this));
        this.map.on("singleclick", this.part_click.bind(this));
        this.map.addLayer(this.l_overlay);
    }

    stop() {
        this.map.removeInteraction(this.select);
        document.forms.namedItem("sapadd").style.display = 'none';
        this.map.un("pointermove", this.part_move);
        this.map.un("singleclick", this.part_click);
        this.map.removeLayer(this.l_overlay);
    }
}