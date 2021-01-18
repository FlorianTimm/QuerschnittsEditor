// SPDX-License-Identifier: GPL-3.0-or-later

import Abschnitt from "../Objekte/Abschnitt";
import StrassenAusPunkt from "../Objekte/StrassenAusPunkt";
import Map from "../openLayers/Map";
import DeleteTool from "../Tools/DeleteTool";
import InfoTool from "../Tools/InfoTool";
import MoveTool from "../Tools/MoveTool";
import SAPAdd from "../Tools/StrassenAusPunkt/SAPAdd";
import SAPAdd2ER from "../Tools/StrassenAusPunkt/SAPAdd2ER";
import ToolBox from "./ToolBox";

/**
 * Klasse zum Erzeugen eines Werkzeugkasten zur Bearbeitung von
 * Straßenausstattung punktuell
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.11.20
 * @license GPL-3.0-or-later
*/
export default class AusstPktToolBox extends ToolBox {
    private infoTool: InfoTool;
    private addTool: SAPAdd;
    private moveTool: MoveTool;
    private add2ErTool: SAPAdd2ER;
    private delTool: DeleteTool;

    /**
    * @param map Karte
    * @param sidebar DIV-Element, in den die Tools geladen werden sollen
    */
    constructor(map: Map, sidebar: HTMLDivElement) {
        super(map, sidebar, "Otstrauspkt", "Straßenausstattung", "rgba(212, 255, 214, 0.8)")

        let layerStraus = StrassenAusPunkt.getLayer(this.map)
        let layerAchse = Abschnitt.getLayer();
        this.layer.push(layerStraus)

        this.infoTool = new InfoTool(map, sidebar, StrassenAusPunkt.getSelect());
        this.addTool = new SAPAdd(map, sidebar, layerAchse);
        this.moveTool = new MoveTool(map, this.infoTool, StrassenAusPunkt.getSelect());
        this.add2ErTool = new SAPAdd2ER(map);
        this.delTool = new DeleteTool(map, layerStraus, sidebar, "Otstrauspkt", StrassenAusPunkt.getSelect());
        this.createToolBox();
    }

    /**
    * Erzeugt das Menu zur Auswahl des Werkzeuges
    */
    protected createToolBox() {
        this.createRadio("Info", this.infoTool)
        $(this.form).append($("<br />"))
        this.createRadio("zum ER hinzufügen", this.add2ErTool)
        $(this.form).append($("<br />"))
        this.createRadio("Ausstatt. hinzufügen", this.addTool)
        $(this.form).append($("<br />"))
        this.createRadio("Ausstatt. löschen", this.delTool)
        $(this.form).append($("<br />"))
        this.createRadio("Verschieben", this.moveTool)
    }
}
