import { Select as SelectInteraction } from 'ol/interaction';
import Klartext from '../Objekte/Klartext.js';
import '../../css/vzadd.css';

class VzAdd {
    constructor(map, daten) {
        this._map = map;
        this._daten = daten;

        this._select = new SelectInteraction({
            layers: [this._daten.l_aufstell],
            hitTolerance: 10
        });

        this._select.on("select", this._selected.bind(this));
    }

    _selected (event) {
        if (event.selected.length == 0) {
            this._infoField.style.display = "none";
            return;
        }
        let auswahl = event.selected[0];

        let ausblenden = document.createElement("div");
        ausblenden.id = "vzadd_ausblenden";
        document.body.appendChild(ausblenden);
        let popup = document.createElement("div");
        popup.id = "vz_popup";
        ausblenden.appendChild(popup);

        let tab = document.createElement("table");
        let th = document.createElement("tr");

        for (let bez of ["", "STVOZNr", "Lage", "Lesbarkeit", "Bauart", "Größe", "Beleuchtung", "sichtbar", "Ausführung"]) {
            let td = document.createElement("th");
            td.innerHTML = bez;
            th.appendChild(td);
        }


        tab.appendChild(th)
        popup.appendChild(tab);
    }

    static loadKlartexte() {
        if (this.daten.kt_stvoznr == null) {
            this.daten.kt_stvoznr = new Klartext('Itvzstvoznr', 'stvoznr');
        }
        if (this.daten.kt_quelle == null) {
            this.daten.kt_quelle = new Klartext('Itquelle', 'quelle');
        }
    }

    start() {
        this._map.addInteraction(this._select);
    }

    stop() {
        this._map.removeInteraction(this._select);
    }
}

module.exports = VzAdd;