var CONFIG = require('../config.json');
import { Circle, Style, Stroke, Fill } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import Vektor from '../Vektor.js';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Point, LineString } from 'ol/geom';
import Feature from 'ol/Feature.js';
import PublicWFS from '../PublicWFS.js';
import Aufstellvorrichtung from '../Objekte/Aufstellvorrichtung.js';

class AvAdd {
    constructor(map, daten) {
        this.map = map;
        this.daten = daten;


        this.absid = null;
        this.station = null;
        this.abstand = null;
        this.seite = null;

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
                        color: 'rgba(250,0,0,0.9)', width: 3
                    })
                })
            });
        });
        this.v_overlay.addFeature(this.feat_neu);

        this.feat_station_line = new Feature({ geometry: new LineString([[0, 0][0, 0]]) });
        this.feat_station_line.setStyle(
            new Style({
                stroke: new Stroke({
                    color: 'rgba(0, 0, 255, 0.5)',
                    width: 2
                }),
            })
        );
        this.v_overlay.addFeature(this.feat_station_line);

        document.getElementById('avadd_button').addEventListener('click', this.partQuerschnittButton.bind(this))
    }

    part_get_station(event) {
        let achse = null;
        if (this.select.getFeatures().getArray().length > 0) {
            achse = this.select.getFeatures().item(0);
        } else {
            achse = this.daten.v_achse.getClosestFeatureToCoordinate(event.coordinate);
        }

        if (achse == null) {
            this.feat_station.getGeometry().setCoordinates([0, 0]);
            this.feat_station_line.getGeometry().setCoordinates([[0, 0], [0, 0]]);
            return null;
        }

        return { achse: achse, pos: Vektor.get_pos(achse.getGeometry().getCoordinates(), event.coordinate) };
    }


    part_click(event) {
        this.feat_neu.set('isset', true);
        let daten = this.part_get_station(event);
        if (daten['pos'] == null) return;

        this.feat_neu.getGeometry().setCoordinates(daten['pos'][6]);

        this.absid = daten['achse'].abschnittid;
        this.station = Math.round(daten['pos'][2]);
        this.abstand = Math.round(daten['pos'][4] * 10) / 10;
        this.seite = daten['pos'][3]
        if (this.seite == 'M') this.abstand = 0;
        if (this.seite == 'L') this.abstand = -this.abstand;

        document.getElementById("avadd_vnk").innerHTML = daten['achse'].vnk;
        document.getElementById("avadd_nnk").innerHTML = daten['achse'].nnk;
        document.getElementById("avadd_station").innerHTML = Math.round(daten['pos'][2])
        document.getElementById("avadd_abstand").innerHTML = daten['pos'][3] + ' ' + daten['pos'][4].toFixed(1)

        document.getElementById("avadd_button").disabled = "";

    }

    part_move(event) {
        let daten = this.part_get_station(event);

        if (daten['pos'] == null) return;

        this.feat_station.getGeometry().setCoordinates(daten['pos'][6]);
        this.feat_station_line.getGeometry().setCoordinates([daten['pos'][6], daten['pos'][5]]);

        if (this.absid == null) {
            document.getElementById("avadd_vnk").innerHTML = daten['achse'].vnk;
            document.getElementById("avadd_nnk").innerHTML = daten['achse'].nnk;
            document.getElementById("avadd_station").innerHTML = Math.round(daten['pos'][2])
            document.getElementById("avadd_abstand").innerHTML = daten['pos'][3] + ' ' + daten['pos'][4].toFixed(1)
        }
    }

    partQuerschnittButton() {
        let soap = '<wfs:Insert>\n' +
            '<Otaufstvor>\n' +
            '<projekt xlink:href="#' + this.daten.ereignisraum + '" typeName="Projekt" />\n' +
            '<abschnittId>' + this.absid + '</abschnittId>\n' +
            '<vst>' + this.station + '</vst>\n' +
            '<bst>' + this.station + '</bst>\n' +
            '<rabstbaVst>' + this.abstand + '</rabstbaVst>\n' +
            '<vabstVst>' + this.abstand + '</vabstVst>\n' +
            '<vabstBst>' + this.abstand + '</vabstBst>\n' +
            '<bemerkung>mit QuerschnittsEditor erfasst</bemerkung>\n' + 
            '<detailgrad xlink:href="'+ CONFIG.DETAIL_HOCH + '" typeName="Itobjdetailgrad" />\n' +
            '<erfart xlink:href="' + CONFIG.ERFASSUNG + '" typeName="Iterfart" />\n' +
            '<ADatum>' + (new Date()).toISOString().substring(0, 10) + '</ADatum>\n' +
            '<rlageVst xlink:href="#S' + document.forms.avadd.avadd_lage.value + '" typeName="Itallglage" />\n' +
            '<art xlink:href="#S' + document.forms.avadd.avadd_art.value + '" typeName="Itaufstvorart" />\n' +
            '<quelle xlink:href="#S' + document.forms.avadd.avadd_quelle.value + '" typeName="Itquelle" />\n' +
            '</Otaufstvor> </wfs:Insert>';
        console.log(soap)
        PublicWFS.doTransaction(soap, this._getInsertResults, undefined, this);
    }

    _getInsertResults(xml, _this) {
        PublicWFS.showMessage("erfolgreich");
        _this.absid = null;
        _this.station = null;
        _this.seite = null;
        _this.feat_neu.getGeometry().setCoordinates([0,0]);
        console.log(_this);
        let filter = '<Filter>';
        for (let f of xml.getElementsByTagName('InsertResult')[0].childNodes) {
            filter += '<ogc:FeatureId fid="' + f.getAttribute('fid') + '"/>';
        }
        filter += '</Filter>';
        PublicWFS.doQuery('Otaufstvor', filter, Aufstellvorrichtung._loadER_Callback, undefined, _this.daten.l_aufstell, _this.daten);
    }

    start() {
        this.map.addInteraction(this.select);
        document.forms.avadd.style.display = 'block';
        this.map.on("pointermove", this.part_move.bind(this));
        this.map.on("singleclick", this.part_click.bind(this));
        this.map.addLayer(this.l_overlay);
    }

    stop() {
        this.map.removeInteraction(this.select);
        document.forms.avadd.style.display = 'none';
        this.map.un("pointermove", this.part_move);
        this.map.un("singleclick", this.part_click);
        this.map.removeLayer(this.l_overlay);
    }
}

module.exports = AvAdd;