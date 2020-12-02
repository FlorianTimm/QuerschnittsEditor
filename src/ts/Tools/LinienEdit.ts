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


export default class LinienEditor extends Tool {
    private select: SelectInteraction;
    private sidebar: HTMLDivElement;
    selectBox: HTMLFormElement;
    objektKlasseSelect: HTMLSelectElement;
    chosen: JQuery<HTMLElement>;

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

    private async okSelected(e: Event) {
        let desc = await PublicWFS.describeFeatureType(this.objektKlasseSelect.value)
        let liste = desc.getElementsByTagNameNS("http://www.w3.org/2001/XMLSchema", "element")
        let popup = document.createElement("div");
        popup.id = "linienEdit"

        let form = document.createElement("form");
        popup.appendChild(form)

        let inputs: { [index: string]: HTMLInputElement | HTMLSelectElement } = {};

        for (let index = 0; index < liste.length; index++) {
            let element = liste.item(index);
            let name = element.getAttribute("name")

            // Nicht notwendig, meist wegen Vorgabewerten
            if (name == "" ||
                name == "enr" ||
                name == "projekt" ||
                name == "vtkNummer" ||
                name == "vnkLfd" ||
                name == "vzusatz" ||
                name == "ntkNummer" ||
                name == "nnkLfd" ||
                name == "nzusatz" ||
                name == "gisreferenz" ||
                name == "abschnittId" ||
                name == "objektId" ||
                name == "vst" ||
                name == "bst")
                continue

            // bei manchen sinnvoll
            if (name == "rabstbaVst" ||
                name == "rlageVst" ||
                name == "labstbaVst" ||
                name == "llageVst" ||
                name == "rabstbaBst" ||
                name == "rlageBst" ||
                name == "labstbaBst" ||
                name == "llageBst")
                continue
            if (name == "baujahrGew" ||
                name == "abnahmeGew" ||
                name == "dauerGew" ||
                name == "ablaufGew")
                continue

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


            inputs[name] = null;
            if (typeName.length > 0) {
                if (typeName.item(0).innerHTML == "Projekt") continue
                //console.log(name)
                inputs[name] = Klartext.createKlartextSelectForm(typeName.item(0).innerHTML, form, title.item(0).innerHTML, name, undefined, (pflicht ? undefined : 'Auswahl...')).select
                continue
            }

            if (datentyp.length > 0) {
                //console.log(datentyp.item(0).getAttribute("base"))
                switch (datentyp.item(0).getAttribute("base")) {
                    case "xsd:date":
                        inputs[name] = HTML.createDateInput(form, title.item(0).innerHTML, element.getAttribute("name"))
                        break
                    case "xsd:integer":
                        inputs[name] = HTML.createTextInput(form, title.item(0).innerHTML, element.getAttribute("name"))
                        inputs[name].setAttribute("type", "number")
                        inputs[name].setAttribute("step", "1");
                        break
                    case "xsd:float":
                        inputs[name] = HTML.createTextInput(form, title.item(0).innerHTML, element.getAttribute("name"))
                        inputs[name].setAttribute("type", "number")
                        inputs[name].setAttribute("step", "0.01")
                        break
                    case "xsd:string":
                        inputs[name] = HTML.createTextInput(form, title.item(0).innerHTML, element.getAttribute("name"))
                        if (laenge.length > 0) inputs[name].setAttribute("length", laenge.item(0).getAttribute("value"))
                        break
                }
            }

            if (inputs[name] && pflicht) inputs[name].setAttribute("required", "required")


        }
        let checkbox = HTML.createFormGroup(form)
        inputs['vorher_loeschen'] = HTML.createCheckbox(checkbox, "Bisherige Einträge löschen", "loeschen", "Bisherige Einträge löschen")
        let submit = HTML.createButton(form, "Hinzufügen", "hinzu");
        submit.style.clear = 'both';



        $(popup).dialog({
            width: 700
        });

        submit.addEventListener('click', () => {
            this.absenden(this.objektKlasseSelect.value, inputs);
            $(popup).dialog('close');
        })

        this.objektKlasseSelect.value = null;
        this.chosen.trigger("chosen:updated");
    }

    private absenden(objKlasse: string, inputs: { [index: string]: HTMLInputElement | HTMLSelectElement }) {
        console.log(objKlasse, inputs);
        PublicWFS
    }
}