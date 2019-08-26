import { Style, Stroke } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import PublicWFS from '../../PublicWFS';
import StrassenAusPunkt from '../../Objekte/StrassenAusPunkt';
import Tool from '../prototypes/Tool'
import Daten from '../../Daten';
import { Map } from 'ol';
import { SelectEventType } from 'ol/interaction/Select';
import Abschnitt from '../../Objekte/Abschnitt';

/**
 * Funktion zum Hinzufügen von Aufstellvorrichtungen zum Ereignisraum
 * @author Florian Timm, LGV HH 
 * @version 2019.05.20
 * @copyright MIT
 */
export default class SAPAdd2ER extends Tool {
    private daten: Daten;
    private map: Map;
    private select: SelectInteraction;

    constructor(map: Map) {
        super();
        this.daten = Daten.getInstanz();;
        this.map = map;

        this.select = new SelectInteraction({
            layers: [this.daten.l_achse],
            hitTolerance: 10,
            style: new Style({
                stroke: new Stroke({
                    color: 'rgba(0, 50, 255, 0.5)',
                    width: 5
                })
            })
        });
        this.select.on('select', this.onSelect.bind(this))
    }

    onSelect(event: SelectEventType) {
        console.log("Auswahl");
        if (this.select.getFeatures().getArray().length == 0) return;

        let abschnitt = this.select.getFeatures().getArray()[0] as Abschnitt;
        if ("Otstrauspkt" in abschnitt.inER && abschnitt.inER["Otstrauspkt"]) return;
        document.body.style.cursor = 'wait'
        PublicWFS.addInER(abschnitt, "Otstrauspkt", this.daten.ereignisraum_nr, this._onSelect_Callback.bind(this), undefined, abschnitt);
    }

    _onSelect_Callback(xml: XMLDocument,  abschnitt: Abschnitt) {
        abschnitt.inER["Otstrauspkt"] = true;
        StrassenAusPunkt.loadAbschnittER(abschnitt, PublicWFS.showMessage, "Erfolgreich in ER kopiert");
        this.select.getFeatures().clear();
        Daten.getInstanz().l_achse.changed();
    }

    start() {
        this.map.addInteraction(this.select);
    }

    stop() {
        this.map.removeInteraction(this.select);
    }
}