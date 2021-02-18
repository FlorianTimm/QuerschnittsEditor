import { ToolBox } from "./ToolBox";
import { Map } from "../openLayers/Map";
import { Abschnitt } from "../Objekte/Abschnitt";
import { LinienEditor } from "../Tools/LinienEdit";

export class LinienToolBox extends ToolBox {
    linienEditor: LinienEditor;



    constructor(map: Map, sidebar: HTMLDivElement) {
        super(map, sidebar, "Linien", "Linien", "rgba(234, 202, 255, 0.8)")

        let layerAchse = Abschnitt.getLayer();

        this.linienEditor = new LinienEditor(map, sidebar)

        this.createToolBox();
    }

    protected createToolBox(): void {
        this.createRadio("Auswahl", this.linienEditor)
        $(this.form).append($("<br />"))
    }



}