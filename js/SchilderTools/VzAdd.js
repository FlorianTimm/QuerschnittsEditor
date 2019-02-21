import { Select as SelectInteraction } from 'ol/interaction';
import Klartext from '../Objekte/Klartext.js';
import '../../css/vzadd.css';

class VzAdd {
    constructor(map, daten) {
        this._map = map;
        this._daten = daten;
        this._ausblenden = null;
        this._table = null;

        this._select = new SelectInteraction({
            layers: [this._daten.l_aufstell],
            hitTolerance: 10
        });

        this._select.on("select", this._selected.bind(this));
        VzAdd.loadKlartexte(this._daten);
    }

    _selected (event) {
        let auswahl = event.selected[0];
        auswahl.getZeichen(VzAdd._zeichenGeladen, this)

        this._ausblenden = document.createElement("div");
        this._ausblenden.id = "vzadd_ausblenden";
        document.body.appendChild(this._ausblenden);
        this._popup = document.createElement("div");
        this._popup.id = "vz_popup";
        this._ausblenden.appendChild(this._popup);

        this._table = document.createElement("table");
        let th = document.createElement("tr");

        for (let bez of ["", "STVOZNr", "Lage", "Lesbarkeit", "Bauart", "Größe", "Beleuchtung", "sichtbar", "Ausführung"]) {
            let td = document.createElement("th");
            td.innerHTML = bez;
            th.appendChild(td);
        }


        this._ausblenden.addEventListener("click", this._closePopup.bind(this));
        this._table.appendChild(th)
        this._popup.appendChild(this._table);
        let button = document.createElement('button');
        button.addEventListener("click", this._closePopup.bind(this));
        button.innerHTML = "Abbrechen";
        this._popup.appendChild(button);
    }

    static _zeichenGeladen(zeichen, _this) {
        for (let eintrag of zeichen) {
            let tr = document.createElement("tr");
            
            let vzimg = document.createElement("td");
            let img = document.createElement("img");
            img.style.width = "50px";
            img.src = "http://gv-srv-w00118:8080/schilder/" + _this._daten.kt_stvoznr.get(eintrag.stvoznr)['kt'] + ".svg";
            img.title = _this._daten.kt_stvoznr.get(eintrag.stvoznr)['beschreib'] + (eintrag.vztext != null)?("\n" + eintrag.vztext):('')
            vzimg.appendChild(img);
            tr.appendChild(vzimg);

            let stvonr = document.createElement("td");
            stvonr.innerHTML = _this._daten.kt_stvoznr.get(eintrag.stvoznr)['beschreib'];
            tr.appendChild(stvonr);

            _this._table.appendChild(tr);
        }
    }

    static loadKlartexte(daten) {
        if (daten.kt_stvoznr == null) {
            daten.kt_stvoznr = new Klartext('Itvzstvoznr', 'stvoznr');
        }
        if (daten.kt_quelle == null) {
            daten.kt_quelle = new Klartext('Itquelle', 'quelle');
        }
    }

    _closePopup (event) {
        document.body.removeChild(this._ausblenden);
    }

    start() {
        this._map.addInteraction(this._select);
    }

    stop() {
        this._map.removeInteraction(this._select);
    }
}

module.exports = VzAdd;