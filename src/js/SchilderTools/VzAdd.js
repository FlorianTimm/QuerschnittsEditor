import { Select as SelectInteraction } from 'ol/interaction';
import '../../css/vzadd.css';
import "../import_jquery";
import 'chosen-js';
import 'chosen-js/chosen.css';
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css'

class VzAdd {
    constructor(map, daten) {
        this._map = map;
        this._daten = daten;
        this._ausblenden = null;
        this._liste = null;

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

        this._liste = document.createElement("div");
        $(this._liste).sortable({
            placeholder: "ui-state-highlight"
        });
        $(this._liste).disableSelection();
        this._liste.classList.add("schilderListe")
        this._popup.appendChild(this._liste);


        let stvoNrNeu = document.createElement("select");
        stvoNrNeu.id = "schilder";
        stvoNrNeu.appendChild(document.createElement("option"));
        for (let stvoznr of this._daten.klartexte.getAllSorted("Itvzstvoznr")) {
            let ele = document.createElement("option");
            ele.value = stvoznr['objektId'];
            ele.innerHTML = stvoznr['beschreib'];
            stvoNrNeu.appendChild(ele);
        }
        this._popup.appendChild(stvoNrNeu);

        $(stvoNrNeu).on("change", this.newSchild.bind(this));

        $(stvoNrNeu).chosen({
            search_contains: true,
            placeholder_text_single: "Schild hinzufügen...",
            no_results_text: "Nichts gefunden!"
        });

        this._popup.appendChild(document.createElement("br"));



        let buttonSpeichern = document.createElement('button');
        buttonSpeichern.addEventListener("click", this._closePopup.bind(this));
        buttonSpeichern.innerHTML = "Speichern";
        this._popup.appendChild(buttonSpeichern);

        let buttonAbbrechen = document.createElement('button');
        buttonAbbrechen.addEventListener("click", this._closePopup.bind(this));
        buttonAbbrechen.innerHTML = "Abbrechen";
        this._popup.appendChild(buttonAbbrechen);

        auswahl.getZeichen(VzAdd._zeichenGeladen, this)
    }

    newSchild(event) {
        let schild = {};
        schild.stvoznr = event.target.value;
        this._createSchildForm(schild);
    }

    static _zeichenGeladen(zeichen, _this) {
        console.log(_this);
        zeichen.sort(function (a, b) {
            if (a.sort != null && b.sort != null) {
                return Number(a.sort) - Number(b.sort);
            }
        });
        for (let eintrag of zeichen) {
            _this._createSchildForm(eintrag);
        }
    }

    _createSchildForm(eintrag) {
        let div = document.createElement("form");
        this._liste.appendChild(div);
        if (eintrag.objektId == null)
            div.dataset.oid = eintrag.objektId;
        div.classList.add('ui-state-default');
        div.classList.add('schild');
        let img = document.createElement("img");
        img.classList.add('schildBild');
        img.style.width = "50px";
        img.src = "http://gv-srv-w00118:8080/schilder/" + this._daten.klartexte.get("Itvzstvoznr", eintrag.stvoznr)['kt'] + ".svg";
        img.title = this._daten.klartexte.get("Itvzstvoznr", eintrag.stvoznr)['beschreib'] + (eintrag.vztext != null) ? ("\n" + eintrag.vztext) : ('');
        div.appendChild(img);
        let text = document.createElement("div");
        div.appendChild(text);
        text.classList.add('schildText');


        // StVONR
        text.innerHTML += '<label>Verkehrszeichen</label><label style="margin-left: 230px;">Text</label><br />';
        let stvonr = document.createElement("select");
        stvonr.classList.add("big");
        stvonr.id = "stvonr[" + eintrag.objektId + "]";
        stvonr.addEventListener("click", function (event) {console.log(event)});
        for (let stvoznr of this._daten.klartexte.getAllSorted("Itvzstvoznr")) {
            let ele = document.createElement("option");
            ele.value = stvoznr['objektId'];
            ele.innerHTML = stvoznr['beschreib'];
            if (eintrag.stvoznr != null && eintrag.stvoznr.substr(-32) == stvoznr['objektId']) {
                ele.setAttribute("selected", "selected");
            }
            stvonr.appendChild(ele);
        }
        text.appendChild(stvonr);

        // Text
        text.innerHTML += '&nbsp;<input type="text" style="width: 120px;" value="' + ((eintrag.vztext != null) ? (eintrag.vztext) : ('')) + '" />';
        // Lage FB
        text.innerHTML += '<br /><label>Lage</label><br />';
        let lage = document.createElement("select");
        lage.classList.add("big");
        lage.id = "lage[" + eintrag.objektId + "]";
        for (let lageKt of this._daten.klartexte.getAllSorted("Itvzlagefb")) {
            let ele = document.createElement("option");
            ele.value = lageKt['objektId'];
            ele.innerHTML = lageKt['beschreib'];
            if (eintrag.lageFb != null && eintrag.lageFb.substr(-32) == lageKt['objektId']) {
                ele.setAttribute("selected", "selected");
            }
            lage.appendChild(ele);
        }
        text.appendChild(lage);
        // Lesbarkeit
        text.innerHTML += '<br /><label>Lesbarkeit</label><br />';
        let lesbar = document.createElement("select");
        lesbar.classList.add("big");
        lesbar.id = "lesbar[" + eintrag.objektId + "]";
        for (let lesbarKt of this._daten.klartexte.getAllSorted("Itvzlesbarkeit")) {
            let ele = document.createElement("option");
            ele.value = lesbarKt['objektId'];
            ele.innerHTML = lesbarKt['beschreib'];
            if (eintrag.lesbarkeit != null && eintrag.lesbarkeit.substr(-32) == lesbarKt['objektId']) {
                ele.setAttribute("selected", "selected");
            }
            lesbar.appendChild(ele);
        }
        text.appendChild(lesbar);
        text.innerHTML += '<br /><label>Sonstiges</label><br />';
        // Beleuchtet
        //text.innerHTML += '<br /><label>Einzelschild</label><br />';
        let beleucht = document.createElement("select");
        beleucht.classList.add("small");
        beleucht.id = "art[" + eintrag.objektId + "]";
        for (let beleuchtKt of this._daten.klartexte.getAllSorted("Itvzbeleucht")) {
            let ele = document.createElement("option");
            ele.value = beleuchtKt['objektId'];
            ele.innerHTML = beleuchtKt['beschreib'];
            if (eintrag.beleucht != null && eintrag.beleucht.substr(-32) == beleuchtKt['objektId']) {
                ele.setAttribute("selected", "selected");
            }
            beleucht.appendChild(ele);
        }
        text.appendChild(beleucht);
        // Einzelschild
        //text.innerHTML += '<br /><label>Einzelschild</label><br />';
        let art = document.createElement("select");
        art.classList.add("small");
        art.id = "art[" + eintrag.objektId + "]";
        for (let artKt of this._daten.klartexte.getAllSorted("Itvzart")) {
            let ele = document.createElement("option");
            ele.value = artKt['objektId'];
            ele.innerHTML = artKt['beschreib'];
            if (eintrag.art != null && eintrag.art.substr(-32) == artKt['objektId']) {
                ele.setAttribute("selected", "selected");
            }
            art.appendChild(ele);
        }
        text.appendChild(art);

        // Löschen
        let buttonLoeschen = document.createElement('button');
        buttonLoeschen.addEventListener("click", function (event) {
            event.preventDefault();
            $("#dialog-confirm").dialog({
                resizable: false,
                height: "auto",
                width: 400,
                modal: true,
                buttons: {
                    "Schild löschen": function () {
                        $(event.target.parentElement.parentElement).remove();
                        $(this).dialog("close");
                    },
                    Cancel: function () {
                        $(this).dialog("close");
                    }
                }
            });

        });
        buttonLoeschen.innerHTML = "Löschen";
        buttonLoeschen.style.backgroundColor = "#f99";
        $(buttonLoeschen).button()
        text.appendChild(buttonLoeschen);

        $(function () {
            $(text).children("select.big").chosen({
                width: "300px",
                search_contains: true,
            });

            $(text).children("select.small").chosen({
                //width: "150px",
                search_contains: true,
            });

            $(text).children("input[type=checkbox]").checkboxradio({
                //icon: false
            })
        });
    }

    static loadKlartexte(daten) {
        daten.klartexte.load('Itvzstvoznr');
        daten.klartexte.load('Itquelle');
        daten.klartexte.load('Itvzlagefb');
        daten.klartexte.load('Itvzlesbarkeit');
        daten.klartexte.load("Itvzart");
        daten.klartexte.load("Itvzbeleucht");
    }

    _closePopup(event) {
        //this._ausblenden.remove();
        document.body.removeChild(this._ausblenden);
        this._select.getFeatures().clear();
    }

    start() {
        this._map.addInteraction(this._select);
    }

    stop() {
        this._map.removeInteraction(this._select);
    }
}

module.exports = VzAdd;
