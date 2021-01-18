// SPDX-License-Identifier: GPL-3.0-or-later

import Abschnitt from "../Objekte/Abschnitt";
import Aufstellvorrichtung from "../Objekte/Aufstellvorrichtung";
import Map from "../openLayers/Map";
import AvAdd from "../Tools/Aufstellvorrichtung/AvAdd";
import AvAdd2ER from "../Tools/Aufstellvorrichtung/AvAdd2ER";
import AvVzAdd from "../Tools/Aufstellvorrichtung/AvVzAdd";
import DeleteTool from "../Tools/DeleteTool";
import InfoTool from "../Tools/InfoTool";
import MoveTool from "../Tools/MoveTool";
import ToolBox from "./ToolBox";

/**
 * Klasse zum Erzeugen eines Werkzeugkasten zur Bearbeitung von
 * Aufstellvorrichtungen
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.11.20
 * @license GPL-3.0-or-later
*/
export default class AufstellToolBox extends ToolBox {
    private infoTool: InfoTool;
    private addTool: AvAdd;
    private vzAddTool: AvVzAdd;
    private moveTool: MoveTool;
    private add2ErTool: AvAdd2ER;
    private delTool: DeleteTool;

    /**
    * @param map Karte
    * @param sidebar DIV-Element, in den die Tools geladen werden sollen
    */
    constructor(map: Map, sidebar: HTMLDivElement) {
        super(map, sidebar, "Otaufstvor", "Aufstellvorrichtung", 'rgba(250, 182, 182, 0.8)')

        let layerAufstell = Aufstellvorrichtung.getLayer(this.map)
        let layerAchse = Abschnitt.getLayer();
        this.layer.push(layerAufstell)

        this.infoTool = new InfoTool(this.map, this.sidebar, Aufstellvorrichtung.getSelect());
        this.addTool = new AvAdd(this.map, sidebar, layerAchse);
        this.vzAddTool = new AvVzAdd(this.map);
        this.moveTool = new MoveTool(this.map, this.infoTool, Aufstellvorrichtung.getSelect());
        this.add2ErTool = new AvAdd2ER(this.map);
        this.delTool = new DeleteTool(this.map, layerAufstell, this.sidebar, "Otaufstvor", Aufstellvorrichtung.getSelect());
        this.createToolBox();
    }

    /**
     * Erzeugt das Menu zur Auswahl des Werkzeuges
     */
    protected createToolBox(): void {
        this.createRadio("Info", this.infoTool);
        $(this.form).append($("<br />"))
        this.createRadio("zum ER hinzufügen", this.add2ErTool)
        $(this.form).append($("<br />"))
        this.createRadio("Aufstellv. hinzufügen", this.addTool)
        $(this.form).append($("<br />"))
        this.createRadio("Aufstellv. löschen", this.delTool)
        $(this.form).append($("<br />"))
        this.createRadio("Schilder ändern", this.vzAddTool)
        $(this.form).append($("<br />"))
        this.createRadio("Verschieben", this.moveTool)
    }
}
