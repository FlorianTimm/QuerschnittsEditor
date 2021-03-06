// SPDX-License-Identifier: GPL-3.0-or-later

import { Map } from "../openLayers/Map";
import { Measure } from "../Tools/Measure";
import { ToolBox } from "./ToolBox";

/**
 * Klasse zum Erzeugen eines Werkzeugkasten
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.11.20
 * @license GPL-3.0-or-later
*/
export class SonstigesToolBox extends ToolBox {
    private measureTool: Measure;

    /**
    * @param map Karte
    * @param sidebar DIV-Element, in den die Tools geladen werden sollen
    */
    constructor(map: Map, sidebar: HTMLDivElement) {
        super(map, sidebar, "steuerung_sonstige")
        this.measureTool = new Measure(map);
        this.form.style.height = "auto";
        this.createToolBox();
    }

    /**
     * Erzeugt das Menu zur Auswahl des Werkzeuges
     */
    protected createToolBox(): void {
        this.createRadio("Messen", this.measureTool)
    }
}