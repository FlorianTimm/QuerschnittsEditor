// SPDX-License-Identifier: GPL-3.0-or-later

import VectorLayer from 'ol/layer/Vector';
import { Daten } from '../../Daten';
import { Aufstellvorrichtung } from '../../Objekte/Aufstellvorrichtung';
import { PunktObjekt } from '../../Objekte/prototypes/PunktObjekt';
import { Map } from "../../openLayers/Map";
import { PublicWFS } from '../../PublicWFS';
import { AddTool } from '../prototypes/AddTool';
import VectorSource from 'ol/source/Vector';
import { LineString } from 'ol/geom';
import { ConfigLoader } from '../../ConfigLoader';

/**
 * Funktion zum Hinzufügen von Aufstellvorrichtungen
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.10.29
 * @license GPL-3.0-or-later
*/
export class AvAdd extends AddTool {
    constructor(map: Map, sidebar: HTMLDivElement, layerAchse: VectorLayer<VectorSource<LineString>>) {
        super(map, sidebar, layerAchse);
    }

    getObjektklasse(): string {
        return 'Otaufstvor';
    }

    protected createForm(): Promise<void[]> {
        let form = Aufstellvorrichtung.createForm(this.sidebar, 'avadd', undefined, true, false);
        this.form = form.form;
        let input = document.createElement("input");
        input.type = "submit"
        input.value = "Hinzufügen"
        input.disabled = true;
        this.form.appendChild(input);
        $(this.form).on("submit", (event: Event) => {
            event.preventDefault();
            this.addAufstellButton();
        });
        return form.promise;
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

    private async wfsAddAufstell() {
        const config = await ConfigLoader.get().getConfig();
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
            '<detailgrad xlink:href="' + config.DETAIL_HOCH + '" typeName="Itobjdetailgrad" />\n' +
            '<erfart xlink:href="' + config.ERFASSUNG + '" typeName="Iterfart" />\n' +
            '<ADatum>' + (new Date()).toISOString().substring(0, 10) + '</ADatum>\n' +
            '<rlageVst xlink:href="#S' + $(this.form).find("#lage").val() + '" typeName="Itallglage" />\n' +
            '<art xlink:href="#S' + $(this.form).find("#art").val() + '" typeName="Itaufstvorart" />\n' +
            '<quelle xlink:href="#S' + $(this.form).find("#quelle").val() + '" typeName="Itquelle" />\n' +
            '</Otaufstvor> </wfs:Insert>';
        //console.log(soap)
        let pkt = await PublicWFS.doTransaction(soap)
            .then((xml) => { return this.getInsertResults(xml) });
        Aufstellvorrichtung.getSelect().getFeatures().clear();
        for (let p of pkt)
            Aufstellvorrichtung.getSelect().getFeatures().push(p);
    }

    protected loadERCallback(xml: XMLDocument): Promise<PunktObjekt[]> {
        return Aufstellvorrichtung.loadErCallback(xml);
    }
}