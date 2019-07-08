import { Select as SelectInteraction } from 'ol/interaction';
import PublicWFS from '../../PublicWFS';
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css'
import Tool from '../Tool';
import { Map, MapBrowserEvent } from 'ol';
import Daten from '../../Daten';
import { Layer } from 'ol/layer';
import Aufstellvorrichtung from '../../Objekte/Aufstellvorrichtung';
import { SelectEvent } from 'ol/interaction/Select';
import VectorSource from 'ol/source/Vector';

/**
 * Funktion zum Löschen von Aufstellvorrichtungen
 * @author Florian Timm, LGV HH 
 * @version 2019.05.20
 * @copyright MIT
 */
class AvDelete implements Tool {
    private _map: Map;
    private _daten: Daten;
    private _layer: Layer;
    private _sidebar: HTMLElement;
    private _delField: HTMLFormElement;
    private _infoField: HTMLDivElement;
    private _select: SelectInteraction;

    constructor(map: Map, daten: Daten, layer: Layer, sidebar: string) {
        this._map = map;
        this._daten = daten;
        this._layer = layer;
        this._sidebar = document.getElementById(sidebar);

        this._delField = document.createElement("form");
        this._infoField = document.createElement("div");
        this._delField.appendChild(this._infoField);
        this._sidebar.appendChild(this._delField);
        this._delField.style.display = "none";


        let button = document.createElement("button");
        button.addEventListener("click", function (evt: { preventDefault: () => void; }) {
            evt.preventDefault();
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
        let auswahl = <Aufstellvorrichtung>event.selected[0];

        this._delField;
        auswahl.getHTMLInfo(this._infoField);
    }

    _featureDelete() {
        let feature = this._select.getFeatures().getArray()[0] as Aufstellvorrichtung;
        console.log(feature);
        let update = '<wfs:Delete typeName="Otaufstvor">\n' +
            '	<ogc:Filter>\n' +
            '		<ogc:And>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>objektId</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + feature.objektId + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this._daten.ereignisraum + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '		</ogc:And>\n' +
            '	</ogc:Filter>\n' +
            '</wfs:Delete>';
        PublicWFS.doTransaction(update, this._deleteCallback, undefined, this);
    }

    _deleteCallback(_xml: any, _this: AvDelete) {
        let feature = _this._select.getFeatures().getArray()[0];
        (<VectorSource>_this._layer.getSource()).removeFeature(feature);
        _this._select.getFeatures().clear();
        PublicWFS.showMessage("Aufstellvorichtung gelöscht!")
    }

    start() {
        this._map.addInteraction(this._select);
    }

    stop() {
        this._map.removeInteraction(this._select);
        this._delField.style.display = "none";
    }

}

export default AvDelete;