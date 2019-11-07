import { Point, LineString } from 'ol/geom';
import PublicWFS from '../../PublicWFS';
import StrassenAusPunkt from '../../Objekte/StrassenAusPunkt';
import AddTool from '../prototypes/AddTool';
import { Map, MapBrowserEvent } from 'ol';
import Daten from '../../Daten';
import Abschnitt from '../../Objekte/Abschnitt';

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
    }

    protected createForm() {
        this.form = StrassenAusPunkt.createForm(undefined, true, false);
        let input = document.createElement("input");
        input.type = "submit"
        input.value = "Hinzufügen"
        this.form.appendChild(input);
        $(this.form).on("submit", this.addSAPButton.bind(this));
    }

    protected part_click(event: MapBrowserEvent) {
        let daten = this.calcStation(event);
        this.refreshStationierung(daten);
        $(this.form).find("input[type='button']").prop("disabled", false);
    }

    private addSAPButton(event: Event) {
        event.preventDefault();
        // im ER?
        if (!(this.abschnitt.isOKinER("Otstrauspkt"))) {
            PublicWFS.addInER(this.abschnitt, "Otstrauspkt", Daten.getInstanz().ereignisraum_nr, this.addInER_Callback.bind(this));
        } else {
            this.wfsAddStrausPkt()
        }
    }

    protected part_move(event: MapBrowserEvent) {
        let daten = this.part_get_station(event);

        if (daten == null || daten['pos'] == null) return;

        (this.feat_station.getGeometry() as Point).setCoordinates(daten['pos'][6] as number[]);
        (this.feat_station_line.getGeometry() as LineString).setCoordinates([daten['pos'][6] as number[], daten['pos'][5] as number[]]);

        if (this.abschnitt == null) {
            this.refreshStationierung(daten);
        }
    }

    private refreshStationierung(daten: { achse: any; pos: any; }) {
        $(this.form).find('#vnk').val((daten['achse'] as Abschnitt).getVnk());
        $(this.form).find('#nnk').val((daten['achse'] as Abschnitt).getNnk());
        $(this.form).find('#station').val(String(this.station));
        $(this.form).find('#abstand').val(daten['pos'][3] + ' ' + (daten['pos'][4] as number).toFixed(1));
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
            '<rlageVst xlink:href="#S' + $(this.form).find('#lage').val() + '" typeName="Itallglage" />\n' +
            '<art xlink:href="#S' + $(this.form).find('#art').val() + '" typeName="Itstrauspktart" />\n' +
            '<quelle xlink:href="#S' + $(this.form).find('#quelle').val() + '" typeName="Itquelle" />\n' +
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