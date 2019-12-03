import { Select as SelectInteraction } from 'ol/interaction';
import Tool from './prototypes/Tool';
import Map from "../openLayers/Map";
import Daten from '../Daten';
import { Layer } from 'ol/layer';
import { SelectEvent } from 'ol/interaction/Select';
import { InfoToolSelectable } from './InfoTool';
import VectorSource from 'ol/source/Vector';
import PublicWFS from '../PublicWFS';
import PunktObjekt from '../Objekte/prototypes/PunktObjekt';
import HTML from '../HTML';

/**
 * Prototyp des Werkzeuges zum Löschen von Punktobjekten
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */

export default class DeleteTool extends Tool {
    protected layer: Layer;
    protected sidebar: HTMLElement;
    protected delField: HTMLFormElement;
    protected infoField: HTMLDivElement;
    protected select: SelectInteraction;
    private objekt: string;

    constructor(map: Map, layer: Layer, sidebar: HTMLDivElement, objekt: string) {
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
            this._featureDelete()
        })
        button.innerHTML = "L&ouml;schen";
        this.delField.appendChild(button);

        this.select = new SelectInteraction({
            layers: [this.layer],
            hitTolerance: 10
        });
        this.select.on('select', this._featureSelected.bind(this))
    }

    _featureSelected(event: SelectEvent) {
        if (event.selected.length == 0) {
            this.delField.style.display = "none";
            return;
        }
        this.delField.style.display = "block";
        let auswahl = <InfoToolSelectable>event.selected[0];

        this.delField;
        auswahl.getInfoForm(this.infoField);
    }

    _featureDelete() {
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
        PublicWFS.doTransaction(update, this._deleteCallback.bind(this));
    }

    _deleteCallback(_xml: XMLDocument) {
        let feature = this.select.getFeatures().getArray()[0];
        (<VectorSource>this.layer.getSource()).removeFeature(feature);
        this.select.getFeatures().clear();
        PublicWFS.showMessage("Objekt gelöscht!")
        this.delField.style.display = "none";
        this.infoField.innerHTML = "";
    }

    start() {
        this.map.addInteraction(this.select);
    }

    stop() {
        this.map.removeInteraction(this.select);
        this.delField.style.display = "none";
    }
}