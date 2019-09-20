import { Point, LineString } from 'ol/geom';
import PublicWFS from '../../PublicWFS';
import Aufstellvorrichtung from '../../Objekte/Aufstellvorrichtung';
import AddTool from '../prototypes/AddTool';
import { Map, MapBrowserEvent } from 'ol';
import Daten from '../../Daten';
import HTML from '../../HTML';
var CONFIG = require('../../config.json');

/**
 * Funktion zum Hinzufügen von Aufstellvorrichtungen
 * @author Florian Timm, LGV HH 
 * @version 2019.05.20
 * @copyright MIT
 */
class AvAdd extends AddTool {
    form: HTMLFormElement;
    constructor(map: Map) {
        super(map);
        this.createForm();
        document.getElementById('avadd_button').addEventListener('click', this.addAufstellButton.bind(this));
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
        if (!("Otaufstvor" in this.abschnitt.inER)) {
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
            '<abschnittId>' + this.abschnitt.abschnittid + '</abschnittId>\n' +
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
        }
        filter += '</Filter>';
        PublicWFS.doQuery('Otaufstvor', filter, Aufstellvorrichtung.loadER_Callback);
    }

    start() {
        document.forms.namedItem("avadd").style.display = 'block';
        super.start();
    }

    stop() {
        document.forms.namedItem("avadd").style.display = 'none';
        super.stop();
    }

    private createForm() {
        let sidebar = document.getElementById("sidebar");
        this.form = document.createElement("form");
        this.form.id = "avadd";
        sidebar.appendChild(this.form);

        // Art
        HTML.createSelectForm(this.form, "Art", "avadd_art");
        this.form.appendChild(document.createElement("br"));

        // Lage
        HTML.createSelectForm(this.form, "Lage", "avadd_lage");
        this.form.appendChild(document.createElement("br"));

        // Quelle
        HTML.createSelectForm(this.form, "Quelle", "avadd_quelle");
        this.form.appendChild(document.createElement("br"));

        // ext: Objektid
        HTML.createTextInput(this.form, "ext. Objektnummer", "avadd_extid");
        this.form.appendChild(document.createElement("br"));


        // VNK
        HTML.createTextInput(this.form, "VNK", "avadd_vnk").disabled = true;
        this.form.appendChild(document.createElement("br"));

        // NNK
        HTML.createTextInput(this.form, "NNK", "avadd_nnk").disabled = true;
        this.form.appendChild(document.createElement("br"));

        // Station
        HTML.createTextInput(this.form, "Station", "avadd_station").disabled = true;
        this.form.appendChild(document.createElement("br"));

        // Station
        HTML.createTextInput(this.form, "Abstand", "avadd_abstand").disabled = true;
        this.form.appendChild(document.createElement("br"));


        // Button
        let input = document.createElement("input");
        input.id = "avadd_button";
        input.type = "button"
        input.value = "Ausstattung hinzu."
        input.disabled = true;
        this.form.appendChild(input);
    }
}

export default AvAdd;