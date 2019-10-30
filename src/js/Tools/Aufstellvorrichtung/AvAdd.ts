import { Point, LineString } from 'ol/geom';
import PublicWFS from '../../PublicWFS';
import Aufstellvorrichtung from '../../Objekte/Aufstellvorrichtung';
import AddTool from '../prototypes/AddTool';
import { Map, MapBrowserEvent } from 'ol';
import Daten from '../../Daten';
var CONFIG = require('../../config.json');

/**
 * Funktion zum Hinzufügen von Aufstellvorrichtungen
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */
export default class AvAdd extends AddTool {
    constructor(map: Map) {
        super(map);
        this.form = Aufstellvorrichtung.createForm('avadd', undefined, true);
        document.getElementById('avadd_button').addEventListener('click', this.addAufstellButton.bind(this));
    }

    getObjektklasse(): string {
        return 'Otaufstvor';
    }

    protected part_click(event: MapBrowserEvent) {
        let daten = this.calcStation(event);
        (document.getElementById("avadd_vnk") as HTMLInputElement).value = daten['achse'].vnk;
        (document.getElementById("avadd_nnk") as HTMLInputElement).value = daten['achse'].nnk;
        (document.getElementById("avadd_station") as HTMLInputElement).value = String(this.station);
        (document.getElementById("avadd_abstand") as HTMLInputElement).value = daten['pos'][3] + ' ' + daten['pos'][4].toFixed(1);
        (document.getElementById("avadd_button") as HTMLInputElement).disabled = false;
    }

    protected part_move(event: MapBrowserEvent) {
        let daten = this.part_get_station(event);

        if (daten == null || daten['pos'] == null) return;

        (this.feat_station.getGeometry() as Point).setCoordinates(daten['pos'][6]);
        (this.feat_station_line.getGeometry() as LineString).setCoordinates([daten['pos'][6], daten['pos'][5]]);

        if (this.abschnitt == null) {
            (document.getElementById("avadd_vnk") as HTMLInputElement).value = daten['achse'].vnk;
            (document.getElementById("avadd_nnk") as HTMLInputElement).value = daten['achse'].nnk;
            (document.getElementById("avadd_station") as HTMLInputElement).value = String(Math.round(daten['pos'][2] * daten['achse'].getFaktor()));
            (document.getElementById("avadd_abstand") as HTMLInputElement).value = daten['pos'][3] + ' ' + daten['pos'][4].toFixed(1)
        }
    }

    private addAufstellButton() {
        // im ER?
        if (!(this.abschnitt.isOKinER("Otaufstvor"))) {
            PublicWFS.addInER(this.abschnitt, "Otaufstvor", Daten.getInstanz().ereignisraum_nr, this.addInER_Callback.bind(this));
        } else {
            this.wfsAddAufstell()
        }
    }

    private addInER_Callback(xml: XMLDocument) {
        Aufstellvorrichtung.loadAbschnittER(this.abschnitt, this.wfsAddAufstell.bind(this))
    }

    private wfsAddAufstell() {
        let soap = '<wfs:Insert>\n' +
            '<Otaufstvor>\n' +
            '<projekt xlink:href="#' + Daten.getInstanz().ereignisraum + '" typeName="Projekt" />\n' +
            '<abschnittId>' + this.abschnitt.getAbschnittid() + '</abschnittId>\n' +
            '<vst>' + this.station + '</vst>\n' +
            '<bst>' + this.station + '</bst>\n' +
            '<rabstbaVst>' + this.abstand + '</rabstbaVst>\n' +
            '<vabstVst>' + this.abstand + '</vabstVst>\n' +
            '<vabstBst>' + this.abstand + '</vabstBst>\n' +
            '<objektnr>' + document.forms.namedItem("avadd").avadd_extid.value + '</objektnr>\n' +
            '<bemerkung>mit QuerschnittsEditor erfasst</bemerkung>\n' +
            '<detailgrad xlink:href="' + CONFIG.DETAIL_HOCH + '" typeName="Itobjdetailgrad" />\n' +
            '<erfart xlink:href="' + CONFIG.ERFASSUNG + '" typeName="Iterfart" />\n' +
            '<ADatum>' + (new Date()).toISOString().substring(0, 10) + '</ADatum>\n' +
            '<rlageVst xlink:href="#S' + document.forms.namedItem("avadd").avadd_lage.value + '" typeName="Itallglage" />\n' +
            '<art xlink:href="#S' + document.forms.namedItem("avadd").avadd_art.value + '" typeName="Itaufstvorart" />\n' +
            '<quelle xlink:href="#S' + document.forms.namedItem("avadd").avadd_quelle.value + '" typeName="Itquelle" />\n' +
            '</Otaufstvor> </wfs:Insert>';
        //console.log(soap)
        PublicWFS.doTransaction(soap, this.getInsertResults.bind(this));
    }

    protected loadERCallback(xml: XMLDocument, ...args: any[]): void {
        Aufstellvorrichtung.loadERCallback(xml, ...args)

    }
}