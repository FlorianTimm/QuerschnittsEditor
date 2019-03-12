import { Select as SelectInteraction } from 'ol/interaction';
import '../../css/vzadd.css';
import "../import_jquery";
import 'chosen-js';
import 'chosen-js/chosen.css';
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css'
import PublicWFS from '../PublicWFS.js';

class VzAdd {
    constructor(map, daten) {
        this._map = map;
        this._daten = daten;
        this._ausblenden = null;
        this._liste = null;
        this._auswahl = null;

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
        this._auswahl = event.selected[0];

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
        this._popup.innerHTML += '<div style="color: #f00; width: 100%; text-align: center;">ACHTUNG: Änderungen im aktuellen ER werden nicht angezeigt!<br/>Der Fehler wurde bereits an NOVASIB gemeldet.</div>'

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
        buttonSpeichern.addEventListener("click", this._save.bind(this));
        buttonSpeichern.innerHTML = "Speichern";
        this._popup.appendChild(buttonSpeichern);

        let buttonAbbrechen = document.createElement('button');
        buttonAbbrechen.addEventListener("click", this._closePopup.bind(this));
        buttonAbbrechen.innerHTML = "Abbrechen";
        this._popup.appendChild(buttonAbbrechen);

        this._auswahl.getZeichen(VzAdd._zeichenGeladen, this)
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
        div.dataset.oid = eintrag.objektId;
        div.classList.add('ui-state-default');
        div.classList.add('schild');
        let img = document.createElement("img");
        img.classList.add('schildBild');
        img.style.height = "50px";
        img.src = "http://gv-srv-w00118:8080/schilder/" + this._daten.klartexte.get("Itvzstvoznr", eintrag.stvoznr)['kt'] + ".svg";
        img.title = this._daten.klartexte.get("Itvzstvoznr", eintrag.stvoznr)['beschreib'] + (eintrag.vztext != null) ? ("\n" + eintrag.vztext) : ('');
        div.appendChild(img);
        let text = document.createElement("div");
        div.appendChild(text);
        text.classList.add('schildText');


        // StVONR
        text.innerHTML += '<label>Verkehrszeichen</label><label style="margin-left: 230px;">Text</label><br />';
        let stvonr = document.createElement("select");
        stvonr.classList.add("big")
        stvonr.classList.add("stvonr");
        stvonr.name = "stvonr";
        stvonr.id = "stvonr[" + eintrag.objektId + "]";

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
        text.innerHTML += '&nbsp;<input type="text" name="text" style="width: 120px;" value="' + ((eintrag.vztext != null) ? (eintrag.vztext) : ('')) + '" />';
        // Lage FB
        text.innerHTML += '<br /><label>Lage</label><br />';
        let lage = document.createElement("select");
        lage.classList.add("big");
        lage.name = "lage";
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
        lesbar.name = "lesbar";
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
        beleucht.name = "beleucht";
        text.appendChild(beleucht);
        // Einzelschild
        //text.innerHTML += '<br /><label>Einzelschild</label><br />';
        let art = document.createElement("select");
        art.classList.add("small");
        art.id = "art[" + eintrag.objektId + "]";
        art.name = "art"
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
            $("#dialog-confirm")[0].title = "Schild wirklich löschen?";
            $("#dialog-confirm #text")[0].innerHTML = "M&ouml;chten Sie dieses Schild wirklich löschen?";
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
            $(text).children("select.stvonr").chosen({
                width: "250px",
                search_contains: true,
            }).change(function (event, data) {
                img.src = "http://gv-srv-w00118:8080/schilder/" + this._daten.klartexte.get("Itvzstvoznr", data.selected)['kt'] + ".svg";
            }.bind(this));

            $(text).children("select.big").chosen({
                width: "350px",
                search_contains: true,
            })

            $(text).children("select.small").chosen({
                //width: "150px",
                search_contains: true,
            });

            $(text).children("input[type=checkbox]").checkboxradio({
                //icon: false
            })
        }.bind(this));

    }

    static loadKlartexte(daten) {
        daten.klartexte.load('Itvzstvoznr');
        daten.klartexte.load('Itquelle');
        daten.klartexte.load('Itvzlagefb');
        daten.klartexte.load('Itvzlesbarkeit');
        daten.klartexte.load("Itvzart");
        daten.klartexte.load("Itvzbeleucht");
    }

    _save(event) {
        let neu = [];
        let alt = {};
        let forms = this._popup.getElementsByTagName("form");
        for (let i = 0; i < forms.length; i++) {
            //form of this._popup.getElementsByTagName("form")) {
            let eintraege = $(forms[i]).children(".schildText");
            if (eintraege.length == 0) break;
            let eintrag = eintraege[0];
            let schild = {}
            schild.oid = forms[i].dataset.oid;
            schild.sort = i + 1;
            schild.stvonr = $(eintrag).children("select[name='stvonr']")[0].value;
            schild.text = $(eintrag).children("input[name='text']")[0].value;
            if (schild.text == "") schild.text = null;
            schild.lage = $(eintrag).children("select[name='lage']")[0].value;
            schild.lesbar = $(eintrag).children("select[name='lesbar']")[0].value;
            schild.beleucht = $(eintrag).children("select[name='beleucht']")[0].value;
            schild.art = $(eintrag).children("select[name='art']")[0].value;

            if (schild.oid.length < 10) { // undefined
                neu.push(schild);
            } else {
                alt[schild.oid] = schild;
            }
        }
        console.log(this._auswahl.getZeichen());
        console.log(neu);
        console.log(alt);

        let update = ""
        let anzDelete = 0, anzUpdate = 0;

        for (let oldZeichen of this._auswahl.getZeichen()) {
            if (oldZeichen.objektId in alt) {
                let modiZeichen = alt[oldZeichen.objektId];
                let upd = "";
                if (oldZeichen.sort != modiZeichen.sort) {
                    upd += '<wfs:Property>\n<wfs:Name>sort</wfs:Name>\n<wfs:Value>' + modiZeichen.sort + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update sort");
                }
                if (oldZeichen.stvoznr != "#" + modiZeichen.stvonr) {
                    upd += '<wfs:Property>\n<wfs:Name>stvoznr/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.stvonr + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update stvoznr");
                }
                if (oldZeichen.vztext != modiZeichen.text) {
                    upd += '<wfs:Property>\n<wfs:Name>vztext</wfs:Name>\n<wfs:Value>' + modiZeichen.text + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update text");
                }
                if (oldZeichen.lageFb != "#S" + modiZeichen.lage) {
                    upd += '<wfs:Property>\n<wfs:Name>lageFb/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.lage + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update lage");
                }
                if (oldZeichen.lesbarkeit != "#S" + modiZeichen.lesbar) {
                    upd += '<wfs:Property>\n<wfs:Name>lesbarkeit/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.lesbar + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update text");
                }
                if (oldZeichen.beleucht != "#S" + modiZeichen.beleucht) {
                    upd += '<wfs:Property>\n<wfs:Name>beleucht/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.beleucht + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update beleucht");
                }
                if (oldZeichen.art != "#" + modiZeichen.art) {
                    upd += '<wfs:Property>\n<wfs:Name>art/@xlink:href</wfs:Name>\n<wfs:Value>' + modiZeichen.art + '</wfs:Value>\n</wfs:Property>\n';
                    console.log("update art");
                }

                if (upd != "") {
                    anzUpdate += 1
                    update += '<wfs:Update typeName="Otvzeichlp">\n' + upd +
                        '	<ogc:Filter>\n' +
                        '		<ogc:And>\n' +
                        '			<ogc:PropertyIsEqualTo>\n' +
                        '				<ogc:PropertyName>objektId</ogc:PropertyName>\n' +
                        '				<ogc:Literal>' + oldZeichen.objektId + '</ogc:Literal>\n' +
                        '			</ogc:PropertyIsEqualTo>\n' +
                        '			<ogc:PropertyIsEqualTo>\n' +
                        '				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
                        '				<ogc:Literal>' + this._daten.ereignisraum + '</ogc:Literal>\n' +
                        '			</ogc:PropertyIsEqualTo>\n' +
                        '		</ogc:And>\n' +
                        '	</ogc:Filter>\n' +
                        '</wfs:Update>\n';
                }
                //console.log("update");
            } else {
                console.log("delete");
                anzDelete += 1
                update += '<wfs:Delete typeName="Otvzeichlp">\n' +
                    '	<ogc:Filter>\n' +
                    '		<ogc:And>\n' +
                    '			<ogc:PropertyIsEqualTo>\n' +
                    '				<ogc:PropertyName>objektId</ogc:PropertyName>\n' +
                    '				<ogc:Literal>' + oldZeichen.objektId + '</ogc:Literal>\n' +
                    '			</ogc:PropertyIsEqualTo>\n' +
                    '			<ogc:PropertyIsEqualTo>\n' +
                    '				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
                    '				<ogc:Literal>' + this._daten.ereignisraum + '</ogc:Literal>\n' +
                    '			</ogc:PropertyIsEqualTo>\n' +
                    '		</ogc:And>\n' +
                    '	</ogc:Filter>\n' +
                    '</wfs:Delete>\n';
            }
        }
        for (let zeichen of neu) {
            console.log("neu");
            update += '<wfs:Insert>\n<Otvzeichlp>\n' +
                '<projekt typeName="Projekt" xlink:href="#' + this._daten.ereignisraum + '"/>\n' +
                '<sort>' + zeichen.sort + '</sort>\n' +
                '<stvoznr xlink:href="#S' + zeichen.stvonr + '" typeName="Itvzstvoznr" />\n' +
                '<vztext>' + zeichen.text + '</vztext>\n' +
                '<lageFb xlink:href="#S' + zeichen.lage + '" typeName="Itvzlagefb" />\n' +
                '<lesbarkeit xlink:href="#S' + zeichen.lesbar + '" typeName="Itvzlesbarkeit" />\n' +
                '<beleucht xlink:href="#S' + zeichen.beleucht + '" typeName="Itvzbeleucht" />\n' +
                '<art xlink:href="#' + zeichen.art + '" typeName="Itvzart" />\n' +
                '<parent typeName="Otaufstvor" xlink:href="#' + this._auswahl.fid + '"/>\n' +
                //<erfart luk="10" typeName="Iterfart" xlink: href="#S8ac892a124b8e9f20124c3756edc03f5"/>     
                //<quelle luk="61" typeName="Itquelle" xlink: href="#S8ac892a13bab6edb013bad6854560461"/>     
                //<ADatum>2019-02-21</ADatum>
                '</Otvzeichlp>\n</wfs:Insert>';

        }

        if ((anzDelete + anzUpdate + neu.length) > 0) {
            $("#dialog-confirm")[0].title = "Änderungen bestätigen";
            $("#dialog-confirm #text")[0].innerHTML = "Es werden folgende Änderungen durchgeführt:<br /><br />" +
                anzDelete + " Schilder löschen<br />" +
                anzUpdate + " ändern<br />" +
                neu.length + " hinzugefügen<br /><br />" +
                "Wollen Sie fortfahren?";
            $("#dialog-confirm").dialog({
                resizable: false,
                height: "auto",
                width: 400,
                modal: true,
                buttons: {
                    "Daten schreiben": function () {
                        $(event.target.parentElement.parentElement).remove();
                        console.log("bestätigt")
                        console.log(this)
                        PublicWFS.addSekInER(this._auswahl, "Otaufstvor", "Otvzeichlp", this._daten.ereignisraum_nr, this._erCallback, undefined, this, update, this._auswahl);
                        //this._closePopup(event);
                        $("#dialog-confirm").dialog("close");
                    }.bind(this),
                    "Abbrechen": function () {
                        $(this).dialog("close");
                    }
                }
            });
        } else {
            $(event.target.parentElement.parentElement).remove();
        }
    }

    _erCallback(__, _this, update, _auswahl) {
        console.log("Update: " + update)
        PublicWFS.doTransaction(update, _this._updateCallback, undefined, _this, _auswahl);
    }

    _updateCallback(__, _this, _auswahl) {
        console.log("reload");
        _auswahl.reloadZeichen();
    }

    _closePopup(event) {
        //this._ausblenden.remove();
        document.body.removeChild(this._ausblenden);
        this._select.getFeatures().clear();
        this._auswahl = null;
    }

    start() {
        this._map.addInteraction(this._select);
    }

    stop() {
        this._map.removeInteraction(this._select);
    }
}

module.exports = VzAdd;
