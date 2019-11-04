import { Point, LineString } from 'ol/geom';
import PublicWFS from '../../PublicWFS';
import StrassenAusPunkt from '../../Objekte/StrassenAusPunkt';
import AddTool from '../prototypes/AddTool';
import { Map, MapBrowserEvent } from 'ol';
import Daten from '../../Daten';

var CONFIG = require('../../config.json');

/**
 * Funktion zum Hinzufügen von Straßenausstattung (punktuell)
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */

export default class SAPAdd extends AddTool {
    constructor(map: Map) {
        super(map);
        this.form = StrassenAusPunkt.createForm("sapadd", undefined, true, false);
        document.getElementById('sapadd_button').addEventListener('click', this.addSAPButton.bind(this));
    }

    protected part_click(event: MapBrowserEvent) {
        let daten = this.calcStation(event);
        (document.getElementById("sapadd_vnk") as HTMLInputElement).value = daten['achse'].vnk;
        (document.getElementById("sapadd_nnk") as HTMLInputElement).value = daten['achse'].nnk;
        (document.getElementById("sapadd_station") as HTMLInputElement).value = String(this.station);
        (document.getElementById("sapadd_abstand") as HTMLInputElement).value = daten['pos'][3] + ' ' + daten['pos'][4].toFixed(1);
        (document.getElementById("sapadd_button") as HTMLInputElement).disabled = false;
    }

    protected part_move(event: MapBrowserEvent) {
        let daten = this.part_get_station(event);

        if (daten == null || daten['pos'] == null) return;

        (this.feat_station.getGeometry() as Point).setCoordinates(daten['pos'][6]);
        (this.feat_station_line.getGeometry() as LineString).setCoordinates([daten['pos'][6], daten['pos'][5]]);

        if (this.abschnitt == null) {
            this.refreshStationierung(daten);
        }
    }

    private refreshStationierung(daten: { achse: any; pos: any; }) {
        (document.getElementById("sapadd_vnk") as HTMLInputElement).value = daten['achse'].vnk;
        (document.getElementById("sapadd_nnk") as HTMLInputElement).value = daten['achse'].nnk;
        (document.getElementById("sapadd_station") as HTMLInputElement).value = String(Math.round(daten['pos'][2] * daten['achse'].getFaktor()));
        (document.getElementById("sapadd_abstand") as HTMLInputElement).value = daten['pos'][3] + ' ' + daten['pos'][4].toFixed(1);
    }

    private addSAPButton() {
        // im ER?
        if (!(this.abschnitt.isOKinER("Otstrauspkt"))) {
            PublicWFS.addInER(this.abschnitt, "Otstrauspkt", Daten.getInstanz().ereignisraum_nr, this.addInER_Callback.bind(this));
        } else {
            this.wfsAddStrausPkt()
        }
    }

    private addInER_Callback(xml: XMLDocument) {
        StrassenAusPunkt.loadAbschnittER(this.abschnitt, this.wfsAddStrausPkt.bind(this))
    }

    private wfsAddStrausPkt() {
        let soap = '<wfs:Insert>\n' +
            '<Otstrauspkt>\n' +
            '<projekt xlink:href="#' + Daten.getInstanz().ereignisraum + '" typeName="Projekt" />\n' +
            '<abschnittId>' + this.abschnitt.getAbschnittid() + '</abschnittId>\n' +
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
        PublicWFS.doTransaction(soap, this.getInsertResults.bind(this));
    }

    public getObjektklasse() {
        return 'Otstrauspkt';
    }

    protected loadERCallback(xml: XMLDocument, ...args: any[]) {
        StrassenAusPunkt.loadER_Callback(xml, ...args);
    }
}