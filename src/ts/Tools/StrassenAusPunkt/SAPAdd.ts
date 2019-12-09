import PublicWFS from '../../PublicWFS';
import StrassenAusPunkt from '../../Objekte/StrassenAusPunkt';
import AddTool from '../prototypes/AddTool';
import Map from "../../openLayers/Map";
import Daten from '../../Daten';
import VectorLayer from 'ol/layer/Vector';
import PunktObjekt from '../../Objekte/prototypes/PunktObjekt';

var CONFIG = require('../../config.json');

/**
 * Funktion zum Hinzufügen von Straßenausstattung (punktuell)
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */

export default class SAPAdd extends AddTool {
    constructor(map: Map, sidebar: HTMLDivElement, layerAchse: VectorLayer) {
        super(map, sidebar, layerAchse);
    }

    protected createForm() {
        this.form = StrassenAusPunkt.createForm(this.sidebar, undefined, true, false);
        let input = document.createElement("input");
        input.type = "submit"
        input.value = "Hinzufügen"
        input.disabled = true;
        this.form.appendChild(input);
        $(this.form).on("submit", this.addSAPButton.bind(this));
    }

    private addSAPButton(event: Event) {
        event.preventDefault();
        // im ER?
        if (!(this.abschnitt.isOKinER("Otstrauspkt"))) {
            PublicWFS.addInER(this.abschnitt, "Otstrauspkt", Daten.getInstanz().ereignisraum_nr)
                .then(() => { return StrassenAusPunkt.loadAbschnittER(this.abschnitt) })
                .then(() => { this.wfsAddStrausPkt() });
        } else {
            this.wfsAddStrausPkt()
        }
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
        PublicWFS.doTransaction(soap)
            .then((xml) => { this.getInsertResults(xml) })
    }

    public getObjektklasse() {
        return 'Otstrauspkt';
    }

    protected loadERCallback(xml: XMLDocument): Promise<PunktObjekt[]> {
        return StrassenAusPunkt.loadErCallback(xml);
    }
}