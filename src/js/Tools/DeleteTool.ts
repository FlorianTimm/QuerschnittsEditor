import { Select as SelectInteraction } from 'ol/interaction';
import Tool from './prototypes/Tool';
import { Map } from 'ol';
import Daten from '../Daten';
import { Layer } from 'ol/layer';
import { SelectEvent } from 'ol/interaction/Select';
import { InfoToolSelectable } from './InfoTool';
import VectorSource from 'ol/source/Vector';
import PublicWFS from '../PublicWFS';
import PunktObjekt from 'src/js/Objekte/prototypes/PunktObjekt';
import HTML from '../HTML';

/**
 * Prototyp des Werkzeuges zum Löschen von Punktobjekten
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */

export default class DeleteTool extends Tool {
    protected _map: Map;
    protected _daten: Daten;
    protected _layer: Layer;
    protected _sidebar: HTMLElement;
    protected _delField: HTMLFormElement;
    protected _infoField: HTMLDivElement;
    protected _select: SelectInteraction;
    private objekt: string;

    constructor(map: Map, layer: Layer, sidebar: string, objekt: string) {
        super();
        this._map = map;
        this._daten = Daten.getInstanz();
        this._layer = layer;
        this._sidebar = document.getElementById(sidebar);
        this.objekt = objekt;

        this._delField = HTML.createToolForm(this._sidebar, false);
        this._infoField = document.createElement("div");
        this._delField.appendChild(this._infoField);

        let button = document.createElement("button");
        button.addEventListener("click", function (event: MouseEvent) {
            event.preventDefault();
            this._featureDelete()
        }.bind(this))
        button.innerHTML = "L&ouml;schen";
        this._delField.appendChild(button);

        this._select = new SelectInteraction({
            layers: [this._layer],
            hitTolerance: 10
        });
        this._select.on('select', this._featureSelected.bind(this))
    }

    _featureSelected(event: SelectEvent) {
        if (event.selected.length == 0) {
            this._delField.style.display = "none";
            return;
        }
        this._delField.style.display = "block";
        let auswahl = <InfoToolSelectable>event.selected[0];

        this._delField;
        auswahl.getInfoForm(this._infoField);
    }

    _featureDelete() {
        let feature = this._select.getFeatures().getArray()[0] as PunktObjekt;
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
            '				<ogc:Literal>' + this._daten.ereignisraum + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '		</ogc:And>\n' +
            '	</ogc:Filter>\n' +
            '</wfs:Delete>';
        PublicWFS.doTransaction(update, this._deleteCallback.bind(this));
    }

    _deleteCallback(_xml: XMLDocument) {
        let feature = this._select.getFeatures().getArray()[0];
        (<VectorSource>this._layer.getSource()).removeFeature(feature);
        this._select.getFeatures().clear();
        PublicWFS.showMessage("Objekt gelöscht!")
        this._delField.style.display = "none";
    }

    start() {
        this._map.addInteraction(this._select);
    }

    stop() {
        this._map.removeInteraction(this._select);
        this._delField.style.display = "none";
    }
}