// SPDX-License-Identifier: GPL-3.0-or-later

import { Select as SelectInteraction } from 'ol/interaction';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source'
import { unByKey } from 'ol/Observable';
import { Daten } from '../Daten';
import { HTML } from '../HTML';
import { PunktObjekt } from '../Objekte/prototypes/PunktObjekt';
import { Map } from "../openLayers/Map";
import { PublicWFS } from '../PublicWFS';
import { InfoToolSelectable } from './InfoTool';
import { Tool } from './prototypes/Tool';
import { Geometry } from 'ol/geom';

/**
 * Prototyp des Werkzeuges zum Löschen von Punktobjekten
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.04.03
 * @license GPL-3.0-or-later
*/
export class DeleteTool extends Tool {
    protected layer: VectorLayer<VectorSource<Geometry>>;
    protected sidebar: HTMLElement;
    protected delField: HTMLFormElement;
    protected infoField: HTMLDivElement;
    protected select: SelectInteraction;
    private objekt: string;
    private selectEventsKey: any;

    constructor(map: Map, layer: VectorLayer<VectorSource<Geometry>>, sidebar: HTMLDivElement, objekt: string, selectInteraction: SelectInteraction) {
        super(map);
        this.layer = layer;
        this.sidebar = sidebar;
        this.objekt = objekt;

        this.delField = HTML.createToolForm(this.sidebar, false);
        this.infoField = document.createElement("div");
        this.delField.appendChild(this.infoField);

        let button = document.createElement("button");
        button.addEventListener("click", (event: MouseEvent) => {
            event.preventDefault();
            this.featureDelete()
        })
        button.innerHTML = "L&ouml;schen";
        this.delField.appendChild(button);

        this.select = selectInteraction;
    }

    protected featureSelected() {
        if (this.select.getFeatures().getLength() == 0) {
            this.delField.style.display = "none";
            return;
        }
        this.delField.style.display = "block";
        let auswahl = <InfoToolSelectable>this.select.getFeatures().item(0);

        auswahl.getInfoForm(this.infoField);
    }

    protected featureDelete() {
        let feature = this.select.getFeatures().getArray()[0] as PunktObjekt;
        console.log(feature);
        let update = '<wfs:Delete typeName="' + this.objekt + '">\n' +
            '	<ogc:Filter>\n' +
            '		<ogc:And>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>objektId</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + feature.getObjektId() + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + Daten.getInstanz().ereignisraum + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '		</ogc:And>\n' +
            '	</ogc:Filter>\n' +
            '</wfs:Delete>';
        PublicWFS.doTransaction(update)
            .then(() => {
                let feature = this.select.getFeatures().getArray()[0];
                this.layer.getSource().removeFeature(feature);
                this.select.getFeatures().clear();
                PublicWFS.showMessage("Objekt gelöscht!")
                this.delField.style.display = "none";
                this.infoField.innerHTML = "";
            })
            .catch(() => { PublicWFS.showMessage("Fehler", true) });
    }

    start() {
        this.selectEventsKey = this.select.on('select', this.featureSelected.bind(this))
        this.map.addInteraction(this.select);
        this.featureSelected();
    }

    stop() {
        unByKey(this.selectEventsKey);
        this.map.removeInteraction(this.select);
        this.delField.style.display = "none";
    }
}