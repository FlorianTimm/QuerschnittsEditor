import { platformModifierKeyOnly } from "ol/events/condition";
import { Style, Stroke } from "ol/style";
import HTML from "../HTML";
import Abschnitt from "../Objekte/Abschnitt";
import Klartext from "../Objekte/Klartext";
import { SelectInteraction } from "../openLayers/Interaction";
import Map from "../openLayers/Map";
import PublicWFS from "../PublicWFS";
import Tool from "./prototypes/Tool";
import "../../css/linienEdit.css"
import Daten from "../Daten";
import { EINTR } from "constants";


export default class LinienEditor extends Tool {
    private select: SelectInteraction;
    private sidebar: HTMLDivElement;
    selectBox: HTMLFormElement;
    objektKlasseSelect: HTMLSelectElement;
    chosen: JQuery<HTMLElement>;

    private ueberspringen = ['enr',
        'projekt',
        'vtkNummer',
        'vnkLfd',
        'vzusatz',
        'ntkNummer',
        'nnkLfd',
        'nzusatz',
        'gisreferenz',
        'abschnittId',
        'objektId',
        'vst',
        'bst',
        'rabstbaVst',
        'rlageVst',
        'labstbaVst',
        'llageVst',
        'rabstbaBst',
        'rlageBst',
        'labstbaBst',
        'llageBst',
        'baujahrGew',
        'abnahmeGew',
        'dauerGew',
        'ablaufGew',
        'geometry',
        'hasSekObj']


    constructor(map: Map, sidebar: HTMLDivElement) {
        super(map)

        this.sidebar = sidebar;

        this.select = new SelectInteraction({
            layers: [Abschnitt.getLayer()],
            multi: true,
            toggleCondition: platformModifierKeyOnly,
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

    private onSelect() {
        console.log("Auswahl");
        if (this.select.getFeatures().getArray().length == 0) return;

        let abschnitt = this.select.getFeatures().getArray()[0] as Abschnitt;
    }

    start(): void {
        if (!this.selectBox) this.createObjektKlassenSelect();

        this.map.addInteraction(this.select);
    }
    stop(): void {
        if (!this.selectBox) $(this.selectBox).hide();
        this.map.removeInteraction(this.select);
    }

    private async createObjektKlassenSelect() {
        this.selectBox = HTML.createToolForm(this.sidebar);
        this.objektKlasseSelect = HTML.createSelectForm(this.selectBox, "Objektklasse", "select_objektklasse");
        this.chosen = $(this.objektKlasseSelect).chosen({ width: "99%", search_contains: true, no_results_text: "Keine Übereinstimmung gefunden für ", placeholder_text_single: "Lädt..." });
        let capabilities = await PublicWFS.getCapabilities();
        let objektklassen = capabilities.getElementsByTagName("FeatureType")

        for (let i = 0; i < objektklassen.length; i++) {
            let objektklasse = objektklassen.item(i);

            if (objektklasse.getElementsByTagName("LatLongBoundingBox").length == 0)
                continue;
            let name = "";
            if (objektklasse.getElementsByTagName("Name").length > 0)
                name = objektklasse.getElementsByTagName("Name").item(0).textContent

            if (name != "Otstrausstr" &&
                name != "Otbahnigkeit" &&
                name != "Otwassereinlstr" &&
                name != "Otlaermschutz" &&
                name != "Otpolzrev" &&
                name != "Otraschutz" &&
                name != "Othindernis" &&
                name != "Otunterhalt" &&
                name != "Otparkstand" &&
                name != "Otschutzein" &&
                name != "Otschutzpl" &&
                name != "Otbflaechen" &&
                name != "Otstadium" &&
                name != "Otgestattung" &&
                name != "Otrechtlausbau" &&
                name != "Otstrecke" &&
                name != "Otgeschwind" &&
                name != "Otfussrueck" &&
                name != "Otfktast" &&
                name != "Otvfreigabe" &&
                name != "Otbauwerke" &&
                name != "Otstrausser" &&
                name != "Otamt" &&
                name != "Otfahrstr" &&
                name != "Otueberlag" &&
                name != "Otwegeart" &&
                name != "Otbaulast" &&
                name != "Otwidmung" &&
                name != "Otbusstreifen" &&
                name != "Otnetzabsart" &&
                name != "Otbegleitgr" &&
                name != "Otkreisverkehr" &&
                name != "Otbauklasse" &&
                name != "Otzone" &&
                name != "Otschutzwand" &&
                name != "Otabsebene" &&
                name != "Otvstaerke" &&
                name != "Otbusbucht" &&
                name != "Otleitung" &&
                name != "Otumstufung" &&
                name != "Otrastanlage" &&
                name != "Otjoker" &&
                name != "Otteilnetz" &&
                name != "Otmassnahmen" &&
                name != "Otschumwelt" &&
                name != "Otuebernahme")
                continue

            let titel = "";
            if (objektklasse.getElementsByTagName("Title").length > 0)
                titel = objektklasse.getElementsByTagName("Title").item(0).textContent
            HTML.createSelectNode(this.objektKlasseSelect, titel, name);
        }
        this.objektKlasseSelect.value = null;
        this.chosen.chosen('destroy');
        this.chosen.chosen({ width: "99%", search_contains: true, no_results_text: "Keine Übereinstimmung gefunden für ", placeholder_text_single: "Auswahl..." });

        this.chosen.on("change", this.okSelected.bind(this))
    }

    private async okSelected() {
        let objKlasse = this.objektKlasseSelect.value;
        let desc = await PublicWFS.describeFeatureType(objKlasse)
        let liste = desc.getElementsByTagNameNS("http://www.w3.org/2001/XMLSchema", "element")
        let popup = document.createElement("div");
        popup.id = "linienEdit"

        let form = document.createElement("form");
        popup.appendChild(form)

        let inputFields: { [index: string]: HTMLInputElement | HTMLSelectElement } = {};
        let fieldType: { [index: string]: 'Klartext' | 'integer' | 'date' | 'string' | 'float' } = {}
        let klartextType: { [index: string]: string } = {};

        for (let index = 0; index < liste.length; index++) {
            let element = liste.item(index);
            let name = element.getAttribute("name")

            if (this.ueberspringen.indexOf(name) >= 0) continue;

            let title = element.getElementsByTagNameNS("http://xml.novasib.de", "title")
            let readOnly = element.getElementsByTagNameNS("http://xml.novasib.de", "readOnly")
            let typeName = element.getElementsByTagNameNS("http://xml.novasib.de", "typeName")
            let virtual = element.getElementsByTagNameNS("http://xml.novasib.de", "virtual")

            if (readOnly.length > 0 ||
                title.length == 0 ||
                virtual.length > 0)
                continue

            let pflichtAttr = element.getElementsByTagNameNS("http://xml.novasib.de", "pflicht")
            let datentyp = element.getElementsByTagNameNS("http://www.w3.org/2001/XMLSchema", "restriction")
            let laenge = element.getElementsByTagNameNS("http://www.w3.org/2001/XMLSchema", "maxLength")




            let pflicht = false;
            if (pflichtAttr.length > 0) pflicht = true;


            inputFields[name] = null;
            if (typeName.length > 0) {
                inputFields[name] = Klartext.createKlartextSelectForm(typeName.item(0).innerHTML, form, title.item(0).innerHTML, name, undefined, (pflicht ? undefined : 'Auswahl...')).select
                fieldType[name] = 'Klartext';
                klartextType[name] = typeName.item(0).innerHTML;
                continue
            }

            if (datentyp.length > 0) {
                //console.log(datentyp.item(0).getAttribute("base"))
                switch (datentyp.item(0).getAttribute("base")) {
                    case "xsd:date":
                        inputFields[name] = HTML.createDateInput(form, title.item(0).innerHTML, element.getAttribute("name"))
                        fieldType[name] = 'date';
                        break
                    case "xsd:integer":
                        inputFields[name] = HTML.createTextInput(form, title.item(0).innerHTML, element.getAttribute("name"))
                        inputFields[name].setAttribute("type", "number")
                        inputFields[name].setAttribute("step", "1");
                        fieldType[name] = 'integer';
                        break
                    case "xsd:float":
                        inputFields[name] = HTML.createTextInput(form, title.item(0).innerHTML, element.getAttribute("name"))
                        inputFields[name].setAttribute("type", "number")
                        inputFields[name].setAttribute("step", "0.01")
                        fieldType[name] = 'float';
                        break
                    case "xsd:string":
                        inputFields[name] = HTML.createTextInput(form, title.item(0).innerHTML, element.getAttribute("name"))
                        if (laenge.length > 0) inputFields[name].setAttribute("length", laenge.item(0).getAttribute("value"))
                        fieldType[name] = 'string';
                        break
                }
            }

            if (inputFields[name] && pflicht) inputFields[name].setAttribute("required", "required")


        }
        let checkbox = HTML.createFormGroup(form)
        inputFields['vorher_loeschen'] = HTML.createCheckbox(checkbox, "Bisherige Einträge löschen", "loeschen", "Bisherige Einträge löschen")


        $(popup).dialog({
            width: 700,
            modal: true,
            buttons: {
                'bisherige Einträge': () => {
                    this.bisherigeEintraege(objKlasse)
                },
                'Speichern': () => {
                    this.absenden(objKlasse, inputFields, fieldType, klartextType);
                    $(popup).dialog('close');
                }
            }
        });

        this.objektKlasseSelect.value = null;
        this.chosen.trigger("chosen:updated");
    }

    private absenden(objKlasse: string,
        inputFields: { [index: string]: HTMLInputElement | HTMLSelectElement },
        fieldType: { [index: string]: 'Klartext' | 'integer' | 'date' | 'string' | 'float' },
        klartextType: { [index: string]: string }) {
        console.log(objKlasse, inputFields);

        let xml = '<wfs:Insert>\n';
        let promise: Promise<any>[] = [];
        this.select.getFeatures().forEach((feature) => {
            xml += '<' + objKlasse + '>';
            let abschnitt = <Abschnitt>feature;
            xml += this.xmlCreate('projekt', 'Klartext', Daten.getInstanz().ereignisraum, 'Projekt');
            xml += this.xmlCreate('abschnittId', 'string', abschnitt.getAbschnittid());
            xml += this.xmlCreate('vst', 'integer', 0);
            xml += this.xmlCreate('bst', 'integer', abschnitt.getLen());

            for (let attribut in inputFields) {
                if (attribut == 'vorher_loeschen' || !inputFields[attribut].value) continue;
                xml += this.xmlCreate(attribut, fieldType[attribut], inputFields[attribut].value, klartextType[attribut]);
            }
            xml += '</' + objKlasse + '>';
            promise.push(PublicWFS.addInER(abschnitt, objKlasse, Daten.getInstanz().ereignisraum_nr));
        });
        xml += '</wfs:Insert>\n';
        console.log(xml);
        Promise.all(promise).then(() => { return PublicWFS.doTransaction(xml) }).then(() => PublicWFS.showMessage('erfolgreich'));
    }

    private xmlCreate(attribut: string, fieldType: 'Klartext' | 'integer' | 'date' | 'string' | 'float', wert: any, klartextType?: string): string {
        if (fieldType != 'Klartext') {
            // Kein Klartext
            return '<' + attribut + '>' + wert + '</' + attribut + '>\n';
        } else {
            // Klartext
            return '<' + attribut + ' xlink:href="' + wert + '" typeName="' + klartextType + '" />\n';
        }
    }


    private bisherigeEintraege(objKlasse: string) {
        let promise: Promise<any>[] = [];
        let filter = '<Filter><And>'
            + '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + Daten.getInstanz().ereignisraum + '</Literal></PropertyIsEqualTo><Or>';
        this.select.getFeatures().forEach((feature) => {
            filter += '<PropertyIsEqualTo><PropertyName>abschnittId</PropertyName>' +
                '<Literal>' + (<Abschnitt>feature).getAbschnittid() + '</Literal></PropertyIsEqualTo>'
            promise.push(PublicWFS.addInER(<Abschnitt>feature, objKlasse, Daten.getInstanz().ereignisraum_nr));
        });
        filter += '</Or></And></Filter>'
        Promise.all(promise).then(() => {
            return PublicWFS.doQuery(objKlasse, filter);
        }).then((doc: Document) => {
            let objekte = doc.getElementsByTagName('Objekt')
            let daten: { [tag: string]: HTMLTableCellElement }[] = [];
            let spalten: string[] = [];
            let table = document.createElement("table")
            for (let i = 0; i < objekte.length; i++) {
                let eintrag: { [tag: string]: HTMLTableCellElement } = {};

                if (objekte.item(i).children.length < 1) continue
                let zeile = objekte.item(i).children.item(0).children;
                console.log(zeile)
                let last = null;
                for (let j = 0; j < zeile.length; j++) {
                    let tag = zeile.item(j).tagName;

                    if (this.ueberspringen.indexOf(tag) > 0) continue;

                    if (spalten.indexOf(tag) < 0) {
                        let index = spalten.indexOf(last);
                        spalten.splice(index + 1, 0, tag);
                    }

                    eintrag[tag] = document.createElement('td')

                    if (zeile.item(j).hasAttribute("luk")) {
                        eintrag[tag].innerHTML = zeile.item(j).getAttribute('luk')
                    } else {
                        eintrag[tag].innerHTML = zeile.item(j).innerHTML
                    }
                    last = tag;
                }
                daten.push(eintrag)
            }
            let tr = document.createElement("tr")
            for (let i = 0; i < spalten.length; i++) {
                let th = document.createElement("th");
                th.innerHTML = spalten[i];
                tr.appendChild(th)
            }
            table.appendChild(tr);
            for (let i = 0; i < daten.length; i++) {
                let tr = document.createElement("tr")
                for (let j = 0; j < spalten.length; j++) {
                    if (spalten[j] in daten[i]) {
                        tr.appendChild(daten[i][spalten[j]]);
                    }
                }
                table.appendChild(tr);
            }
            let div = document.createElement("div");
            div.appendChild(table);
            $(div).dialog({
                width: 900,
                modal: true
            });
        })

    }
}