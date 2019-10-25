import { Point, LineString } from 'ol/geom';
import PublicWFS from '../../PublicWFS';
import StrassenAusPunkt from '../../Objekte/StrassenAusPunkt';
import AddTool from '../prototypes/AddTool';
import { Map, MapBrowserEvent } from 'ol';
import Daten from '../../Daten';
import HTML from '../../HTML';

var CONFIG = require('../../config.json');

/**
 * Funktion zum Hinzufügen von Straßenausstattung (punktuell)
 * @author Florian Timm, LGV HH 
 * @version 2019.09.20
 * @copyright MIT
 */

export default class SAPAdd extends AddTool {
    form: HTMLFormElement;
    constructor(map: Map) {
        super(map);
        this.form = StrassenAusPunkt.createForm("sapadd");
        document.getElementById('sapadd_button').addEventListener('click', this.addAufstellButton.bind(this));
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
            (document.getElementById("sapadd_vnk") as HTMLInputElement).value = daten['achse'].vnk;
            (document.getElementById("sapadd_nnk") as HTMLInputElement).value = daten['achse'].nnk;
            (document.getElementById("sapadd_station") as HTMLInputElement).value = String(Math.round(daten['pos'][2] * daten['achse'].getFaktor()));
            (document.getElementById("sapadd_abstand") as HTMLInputElement).value = daten['pos'][3] + ' ' + daten['pos'][4].toFixed(1)
        }
    }

    private addAufstellButton() {
        // im ER?
        if (!("Otstrauspkt" in this.abschnitt.inER)) {
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
        PublicWFS.doTransaction(soap, this.getInsertResults.bind(this));
    }

    private getInsertResults(xml: XMLDocument) {
        PublicWFS.showMessage("erfolgreich");
        this.abschnitt = null;
        this.station = null;
        this.seite = null;
        (this.feat_neu.getGeometry() as Point).setCoordinates([0, 0]);
        let filter = '<Filter>';
        let childs = xml.getElementsByTagName('InsertResult')[0].childNodes;
        for (let i = 0; i < childs.length; i++) {
            filter += '<FeatureId fid="' + (childs[i] as Element).getAttribute('fid') + '"/>';
        };
        filter += '</Filter>';
        PublicWFS.doQuery('Otstrauspkt', filter, StrassenAusPunkt.loadER_Callback);
    }

    public start() {
        document.forms.namedItem("sapadd").style.display = 'block';
        super.start();
    }

    public stop() {
        document.forms.namedItem("sapadd").style.display = 'none';
        super.stop();
    }
}