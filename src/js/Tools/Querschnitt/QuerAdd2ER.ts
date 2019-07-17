import { Style, Stroke } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import PublicWFS from '../../PublicWFS';
import Querschnittsdaten from '../../Objekte/Querschnittsdaten';
import { Map } from 'ol';
import Daten from '../../Daten';
import { SelectEventType } from 'ol/interaction/Select';
import Abschnitt from '../../Objekte/Abschnitt';
import Tool from '../Tool';

/**
 * Querschnittsflächen zu Ereignisraum hinzufügen
 * @author Florian Timm, LGV HH 
 * @version 2019.06.06
 * @copyright MIT
 */
class QuerAdd2ER implements Tool {
    daten: Daten;
    map: Map;
    select: SelectInteraction;

    constructor(map: Map, daten: Daten) {
        this.daten = daten;
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

    /**
     * 
     * @param {*} event 
     */
    onSelect(event: SelectEventType) {
        //console.log("Auswahl");
        if (this.select.getFeatures().getArray().length == 0) return;

        let abschnitt = this.select.getFeatures().getArray()[0] as Abschnitt;
        if ("Querschnitt" in abschnitt.inER && abschnitt.inER["Querschnitt"]) return;
        document.body.style.cursor = 'wait'
        PublicWFS.addInER(abschnitt as Abschnitt, "Querschnitt", this.daten.ereignisraum_nr, this._onSelect_Callback.bind(this), undefined, abschnitt);
    }

    _onSelect_Callback(xml: Document, abschnitt: Abschnitt) {
        abschnitt.inER["Querschnitt"] = true;
        Querschnittsdaten.loadAbschnittER(this.daten, abschnitt, PublicWFS.showMessage, "Erfolgreich in ER kopiert");
        this.select.getFeatures().clear();
        this.daten.l_achse.changed();
    }

    start() {
        this.map.addInteraction(this.select);
    }

    stop() {
        this.map.removeInteraction(this.select);
    }
}

export default QuerAdd2ER