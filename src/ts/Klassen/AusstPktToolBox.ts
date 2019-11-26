import ToolBox from "./ToolBox";
import Map from "../openLayers/Map";
import InfoTool from "../Tools/InfoTool";
import MoveTool from "../Tools/MoveTool";
import DeleteTool from "../Tools/DeleteTool";
import SAPAdd2ER from "../Tools/StrassenAusPunkt/SAPAdd2ER";
import SAPAdd from "../Tools/StrassenAusPunkt/SAPAdd";
import Abschnitt from "../Objekte/Abschnitt";
import StrassenAusPunkt from "../Objekte/StrassenAusPunkt";

/**
 * Klasse zum Erzeugen eines Werkzeugkasten zur Bearbeitung von 
 * Straßenausstattung punktuell
 * @author Florian Timm
 * @version 2019-11-20
 * @license MIT
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
        super(map, sidebar, "tab_Otstrauspkt")

        let layerStraus = StrassenAusPunkt.getLayer(this.map)
        let layerAchse = Abschnitt.getLayer();
        this.layer.push(layerStraus)

        this.infoTool = new InfoTool(map, layerStraus, sidebar);
        this.addTool = new SAPAdd(map, sidebar, layerAchse);
        this.moveTool = new MoveTool(map, this.infoTool, layerStraus);
        this.add2ErTool = new SAPAdd2ER(map);
        this.delTool = new DeleteTool(map, layerStraus, sidebar, "Otstrauspkt");
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
