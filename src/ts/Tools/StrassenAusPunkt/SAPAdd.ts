// SPDX-License-Identifier: GPL-3.0-or-later

import VectorLayer from 'ol/layer/Vector';
import { Daten } from '../../Daten';
import { PunktObjekt } from '../../Objekte/prototypes/PunktObjekt';
import { StrassenAusPunkt } from '../../Objekte/StrassenAusPunkt';
import { Map } from "../../openLayers/Map";
import { PublicWFS } from '../../PublicWFS';
import { AddTool } from '../prototypes/AddTool';

import { LineString } from 'ol/geom';
import VectorSource from 'ol/source/Vector';
import { ConfigLoader } from '../../ConfigLoader';
import { Feature } from 'ol';

/**
 * Funktion zum Hinzufügen von Straßenausstattung (punktuell)
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.10.29
 * @license GPL-3.0-or-later
*/
export class SAPAdd extends AddTool {
    constructor(map: Map, sidebar: HTMLDivElement, layerAchse: VectorLayer<VectorSource<Feature<LineString>>>) {
        super(map, sidebar, layerAchse);
    }

    protected createForm(): Promise<void[]> {
        let form = StrassenAusPunkt.createForm(this.sidebar, undefined, true, false);
        this.form = form.form;
        let input = document.createElement("input");
        input.type = "submit"
        input.value = "Hinzufügen"
        input.disabled = true;
        this.form.appendChild(input);
        $(this.form).on("submit", this.addSAPButton.bind(this));
        return form.promise;
    }

    private async addSAPButton(event: Event) {
        event.preventDefault();
        // im ER?
        if (!(this.abschnitt.isOKinER("Otstrauspkt"))) {
            await PublicWFS.addInER(this.abschnitt, "Otstrauspkt", Daten.getInstanz().ereignisraum_nr)
                .then(() => { return StrassenAusPunkt.loadAbschnittER(this.abschnitt) })
        }
        return this.wfsAddStrausPkt().then(() => {
            PublicWFS.showMessage("erfolgreich");
        })
    }

    private async wfsAddStrausPkt(): Promise<StrassenAusPunkt[]> {
        const config = await ConfigLoader.get().getConfig();
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
            '<detailgrad xlink:href="' + config.DETAIL_HOCH + '" typeName="Itobjdetailgrad" />\n' +
            '<erfart xlink:href="' + config.ERFASSUNG + '" typeName="Iterfart" />\n' +
            '<ADatum>' + (new Date()).toISOString().substring(0, 10) + '</ADatum>\n' +
            '<rlageVst xlink:href="#S' + $(this.form).find('#lage').val() + '" typeName="Itallglage" />\n' +
            '<art xlink:href="#S' + $(this.form).find('#art').val() + '" typeName="Itstrauspktart" />\n' +
            '<quelle xlink:href="#S' + $(this.form).find('#quelle').val() + '" typeName="Itquelle" />\n' +
            '</Otstrauspkt> </wfs:Insert>';
        const xml = await PublicWFS.doTransaction(soap);
        return this.getInsertResults(xml) as Promise<StrassenAusPunkt[]>;
    }

    public getObjektklasse() {
        return 'Otstrauspkt';
    }

    protected loadERCallback(xml: XMLDocument): Promise<PunktObjekt[]> {
        return StrassenAusPunkt.loadErCallback(xml);
    }
}