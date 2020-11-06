import { platformModifierKeyOnly } from "ol/events/condition";
import { Style, Stroke } from "ol/style";
import HTML from "../HTML";
import Abschnitt from "../Objekte/Abschnitt";
import Klartext from "../Objekte/Klartext";
import { SelectInteraction } from "../openLayers/Interaction";
import Map from "../openLayers/Map";
import PublicWFS from "../PublicWFS";
import Tool from "./prototypes/Tool";


export default class LinienEditor extends Tool {
    private select: SelectInteraction;
    private sidebar: HTMLDivElement;
    selectBox: HTMLFormElement;
    objektKlasseSelect: HTMLSelectElement;

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
        let chosen = $(this.objektKlasseSelect).chosen({ width: "99%", search_contains: true, no_results_text: "Keine Übereinstimmung gefunden für ", placeholder_text_single: "Lädt..." });
        let capabilities = await PublicWFS.getCapabilities();
        let objektklassen = capabilities.getElementsByTagName("FeatureType")

        for (let i = 0; i < objektklassen.length; i++) {
            let objektklasse = objektklassen.item(i);

            if (objektklasse.getElementsByTagName("LatLongBoundingBox").length == 0)
                continue;
            let name = "";
            if (objektklasse.getElementsByTagName("Name").length > 0)
                name = objektklasse.getElementsByTagName("Name").item(0).textContent
            let titel = "";
            if (objektklasse.getElementsByTagName("Title").length > 0)
                titel = objektklasse.getElementsByTagName("Title").item(0).textContent
            HTML.createSelectNode(this.objektKlasseSelect, titel, name);
        }
        this.objektKlasseSelect.value = null;
        chosen.chosen('destroy');
        chosen.chosen({ width: "99%", search_contains: true, no_results_text: "Keine Übereinstimmung gefunden für ", placeholder_text_single: "Auswahl..." });

        chosen.on("change", this.okSelected.bind(this))
    }

    private okSelected(e: Event) {
        PublicWFS.describeFeatureType(this.objektKlasseSelect.value)
        this.objektKlasseSelect.value = null;

    }
}