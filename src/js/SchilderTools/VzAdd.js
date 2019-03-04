import { Select as SelectInteraction } from 'ol/interaction';
import '../../css/vzadd.css';
import $ from "jquery";
import 'chosen-js';

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

    _selected(event) {
        if (event.selected.length == 0) {
            return;
        }
        let auswahl = event.selected[0];

        this._ausblenden = document.createElement("div");
        this._ausblenden.id = "vzadd_ausblenden";
        document.body.appendChild(this._ausblenden);
        this._popup = document.createElement("div");
        this._popup.id = "vz_popup";
        this._popup.style.textAlign = "right";

        let closeButton = document.createElement("button");
        closeButton.innerHTML = "x";
        closeButton.style.backgroundColor = "#d00";
        closeButton.style.color = "#fff";
        closeButton.style.fontFamily = "sans-serif";
        closeButton.style.fontWeight = "700";
        closeButton.style.marginBottom = "5px";
        closeButton.addEventListener("click", this._closePopup.bind(this));
        this._popup.appendChild(closeButton);

        this._ausblenden.appendChild(this._popup);

        this._table = document.createElement("table");
        this._table.style.textAlign = 'left';
        let th = document.createElement("tr");

        for (let bez of ["", "STVOZNr", "Lage", "Lesbarkeit", "Bauart", "Größe", "Beleuchtung", "sichtbar", "Ausführung"]) {
            let td = document.createElement("th");
            td.innerHTML = bez;
            th.appendChild(td);
        }

        this._table.appendChild(th)
        this._popup.appendChild(this._table);
        let button = document.createElement('button');
        button.addEventListener("click", this._closePopup.bind(this));
        button.innerHTML = "Abbrechen";
        this._popup.appendChild(button);
        auswahl.getZeichen(VzAdd._zeichenGeladen, this)
    }

    static _zeichenGeladen(zeichen, _this) {
        for (let eintrag of zeichen) {
            let tr = document.createElement("tr");

            let vzimg = document.createElement("td");
            let img = document.createElement("img");
            img.style.width = "50px";
            img.src = "http://gv-srv-w00118:8080/schilder/" + _this._daten.klartexte.get("Itvzstvoznr", eintrag.stvoznr)['kt'] + ".svg";
            img.title = _this._daten.klartexte.get("Itvzstvoznr", eintrag.stvoznr)['beschreib'] + (eintrag.vztext != null) ? ("\n" + eintrag.vztext) : ('')
            vzimg.appendChild(img);
            tr.appendChild(vzimg);

            let stvonr = document.createElement("td");
            stvonr.innerHTML = _this._daten.klartexte.get("Itvzstvoznr", eintrag.stvoznr)['beschreib'];
            tr.appendChild(stvonr);

            let lage = document.createElement("td");
            lage.innerHTML = _this._daten.klartexte.get("Itvzlagefb", eintrag.lageFb)['beschreib'];

            _this._table.appendChild(tr);
        }

        let tr_neu = document.createElement("tr");
        let td_neu = document.createElement("td");

        /*
        let liste = document.createElement("datalist");
        liste.id = "schilder";
        for (let stvoznr of  _this._daten.klartexte.getAllSorted("Itvzstvoznr")) {
            let ele = document.createElement("option");
            ele.value = stvoznr['beschreib'];
            liste.appendChild(ele);
        }
        td_neu.appendChild(liste);
        let input_neu = document.createElement("input");

        input_neu.type = "text";
        input_neu.setAttribute("list", "schilder")
        td_neu.appendChild(input_neu);
        */



        let liste = document.createElement("select");
        liste.id = "schilder";
        for (let stvoznr of  _this._daten.klartexte.getAllSorted("Itvzstvoznr")) {
            let ele = document.createElement("option");
            ele.value = stvoznr['kt'];
            ele.innerHTML = stvoznr['beschreib'];
            liste.appendChild(ele);
        }
        td_neu.appendChild(liste);



        tr_neu.appendChild(td_neu);
        _this._table.appendChild(tr_neu)
    }

    static loadKlartexte(daten) {
        daten.klartexte.load('Itvzstvoznr');
        daten.klartexte.load('Itquelle');
        daten.klartexte.load('Itvzlagefb');
    }

    _closePopup(event) {
        //this._ausblenden.remove();
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