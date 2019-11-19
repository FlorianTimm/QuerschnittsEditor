import PublicWFS from '../../PublicWFS';
import Aufstellvorrichtung from '../../Objekte/Aufstellvorrichtung';
import AddTool from '../prototypes/AddTool';
import Map from "../../openLayers/Map";
import Daten from '../../Daten';
import VectorLayer from 'ol/layer/Vector';
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
        $(this.form).on("submit", function (this: AvAdd, event: Event) {
            event.preventDefault();
            this.addAufstellButton();
        }.bind(this));
    }

    private addAufstellButton() {
        // im ER?
        if (!(this.abschnitt.isOKinER("Otaufstvor"))) {
            PublicWFS.addInER(this.abschnitt, "Otaufstvor", Daten.getInstanz().ereignisraum_nr, this.addInER_Callback.bind(this));
        } else {
            this.wfsAddAufstell()
        }
    }

    private addInER_Callback(__: XMLDocument) {
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
        PublicWFS.doTransaction(soap, this.getInsertResults.bind(this));
    }

    protected loadERCallback(xml: XMLDocument, ...args: any[]): void {
        Aufstellvorrichtung.loadErCallback(xml, ...args)
    }
}