import PublicWFS from '../../PublicWFS';
import Aufstellvorrichtung from '../../Objekte/Aufstellvorrichtung';
import AddTool from '../prototypes/AddTool';
import Map from "../../openLayers/Map";
import Daten from '../../Daten';
import VectorLayer from 'ol/layer/Vector';
import PunktObjekt from '../../Objekte/prototypes/PunktObjekt';
var CONFIG = require('../../config.json');

/**
 * Funktion zum Hinzufügen von Aufstellvorrichtungen
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */
export default class AvAdd extends AddTool {
    constructor(map: Map, sidebar: HTMLDivElement, layerAchse: VectorLayer) {
        super(map, sidebar, layerAchse);
    }

    getObjektklasse(): string {
        return 'Otaufstvor';
    }

    createForm() {
        this.form = Aufstellvorrichtung.createForm(this.sidebar, 'avadd', undefined, true, false);
        let input = document.createElement("input");
        input.type = "submit"
        input.value = "Hinzufügen"
        input.disabled = true;
        this.form.appendChild(input);
        $(this.form).on("submit", (event: Event) => {
            event.preventDefault();
            this.addAufstellButton();
        });
    }

    private addAufstellButton() {
        // im ER?
        if (!(this.abschnitt.isOKinER("Otaufstvor"))) {
            PublicWFS.addInER(this.abschnitt, "Otaufstvor", Daten.getInstanz().ereignisraum_nr)
                .then(() => { return Aufstellvorrichtung.loadAbschnittER(this.abschnitt) })
                .then(() => { this.wfsAddAufstell() });
        } else {
            this.wfsAddAufstell()
        }
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
            '<objektnr>' + $(this.form).find("#extid").val() + '</objektnr>\n' +
            '<bemerkung>mit QuerschnittsEditor erfasst</bemerkung>\n' +
            '<detailgrad xlink:href="' + CONFIG.DETAIL_HOCH + '" typeName="Itobjdetailgrad" />\n' +
            '<erfart xlink:href="' + CONFIG.ERFASSUNG + '" typeName="Iterfart" />\n' +
            '<ADatum>' + (new Date()).toISOString().substring(0, 10) + '</ADatum>\n' +
            '<rlageVst xlink:href="#S' + $(this.form).find("#lage").val() + '" typeName="Itallglage" />\n' +
            '<art xlink:href="#S' + $(this.form).find("#art").val() + '" typeName="Itaufstvorart" />\n' +
            '<quelle xlink:href="#S' + $(this.form).find("#quelle").val() + '" typeName="Itquelle" />\n' +
            '</Otaufstvor> </wfs:Insert>';
        //console.log(soap)
        PublicWFS.doTransaction(soap)
            .then((xml) => { this.getInsertResults(xml) });
    }

    protected loadERCallback(xml: XMLDocument): Promise<PunktObjekt[]> {
        return Aufstellvorrichtung.loadErCallback(xml);
    }
}