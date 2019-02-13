import { Style, Stroke } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import PublicWFS from '../PublicWFS.js';
import Aufstellvorrichtung from '../Objekte/Aufstellvorrichtung.js';

class AvAdd2ER {
    constructor(map, daten) {
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

    onSelect(event) {
        console.log("Auswahl");
        if (this.select.getFeatures().getArray().length == 0) return;

        let abschnitt = this.select.getFeatures().getArray()[0];
        if ("Otaufstvor" in abschnitt.inER && abschnitt.inER["Otaufstvor"]) return;
        document.body.style.cursor = 'wait'
        PublicWFS.addInER(abschnitt, "Otaufstvor", this.daten.ereignisraum_nr, AvAdd2ER._onSelect_Callback, undefined, this, abschnitt);
    }

    static _onSelect_Callback(xml, _this, abschnitt) {
        abschnitt.inER["Otaufstvor"] = true;
        Aufstellvorrichtung.loadAbschnittER(_this.daten, abschnitt, PublicWFS.showMessage, "Erfolgreich in ER kopiert");
        _this.select.getFeatures().clear();
        _this.daten.l_achse.changed();
    }

    start() {
        this.map.addInteraction(this.select);
    }

    stop() {
        this.map.removeInteraction(this.select);
    }
}

module.exports = AvAdd2ER