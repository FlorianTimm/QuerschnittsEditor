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
 * @version 2019.08.14
 * @copyright MIT
 */

export default class SAPAdd extends AddTool {
    form: HTMLFormElement;
    constructor(map: Map) {
        super(map);
        this.createForm();
        document.getElementById('sapadd_button').addEventListener('click', this.addAufstellButton.bind(this));
    }

    part_click(event: MapBrowserEvent) {
        let daten = this.calcStation(event);
        (document.getElementById("sapadd_vnk") as HTMLInputElement).value = daten['achse'].vnk;
        (document.getElementById("sapadd_nnk") as HTMLInputElement).value = daten['achse'].nnk;
        (document.getElementById("sapadd_station") as HTMLInputElement).value = String(this.station);
        (document.getElementById("sapadd_abstand") as HTMLInputElement).value = daten['pos'][3] + ' ' + daten['pos'][4].toFixed(1);
        (document.getElementById("sapadd_button") as HTMLInputElement).disabled = false;
    }

    part_move(event: MapBrowserEvent) {
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
            PublicWFS.addInER(this.abschnitt, "Otstrauspkt", Daten.getInstanz().ereignisraum_nr, this._addInER_Callback.bind(this));
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
        PublicWFS.doTransaction(soap, this._getInsertResults.bind(this));
    }

    _getInsertResults(xml: XMLDocument) {
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
        PublicWFS.doQuery('Otstrauspkt', filter, StrassenAusPunkt._loadER_Callback);
    }

    start() {
        document.forms.namedItem("sapadd").style.display = 'block';
        super.start();
    }

    stop() {
        document.forms.namedItem("sapadd").style.display = 'none';
        super.stop();
    }


    createForm() {
        let sidebar = document.getElementById("sidebar");
        this.form = document.createElement("form");
        this.form.id = "sapadd";
        sidebar.appendChild(this.form);

        // Art
        HTML.createSelectForm(this.form, "Art", "sapadd_art");
        this.form.appendChild(document.createElement("br"));

        // Lage
        HTML.createSelectForm(this.form, "Lage", "sapadd_lage");
        this.form.appendChild(document.createElement("br"));

        // Quelle
        HTML.createSelectForm(this.form, "Quelle", "sapadd_quelle");
        this.form.appendChild(document.createElement("br"));

        // VNK
        HTML.createTextInput(this.form, "VNK", "sapadd_vnk").disabled = true;
        this.form.appendChild(document.createElement("br"));

        // NNK
        HTML.createTextInput(this.form, "NNK", "sapadd_nnk").disabled = true;
        this.form.appendChild(document.createElement("br"));

        // Station
        HTML.createTextInput(this.form, "Station", "sapadd_station").disabled = true;
        this.form.appendChild(document.createElement("br"));

        // Station
        HTML.createTextInput(this.form, "Abstand", "sapadd_abstand").disabled = true;
        this.form.appendChild(document.createElement("br"));


        // Button
        let input = document.createElement("input");
        input.id = "sapadd_button";
        input.type = "button"
        input.value = "Ausstattung hinzu."
        input.disabled = true;
        this.form.appendChild(input);
    }
}