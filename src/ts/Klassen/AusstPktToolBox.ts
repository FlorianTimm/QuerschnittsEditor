import ToolBox from "./ToolBox";
import Map from "../openLayers/Map";
import InfoTool from "../Tools/InfoTool";
import MoveTool from "../Tools/MoveTool";
import DeleteTool from "../Tools/DeleteTool";
import SAPAdd2ER from "../Tools/StrassenAusPunkt/SAPAdd2ER";
import SAPAdd from "../Tools/StrassenAusPunkt/SAPAdd";
import Abschnitt from "../Objekte/Abschnitt";
import StrassenAusPunkt from "../Objekte/StrassenAusPunkt";

export default class AusstPktToolBox extends ToolBox {
    private infoTool: InfoTool;
    private addTool: SAPAdd;
    private moveTool: MoveTool;
    private add2ErTool: SAPAdd2ER;
    private delTool: DeleteTool;

    constructor(map: Map, sidebar: HTMLDivElement) {
        super(map, sidebar, "tab_Otstrauspkt")

        let layerStraus = StrassenAusPunkt.getLayer()
        let layerAchse = Abschnitt.getLayer();

        this.infoTool = new InfoTool(map, layerStraus, sidebar);
        this.addTool = new SAPAdd(map, sidebar, layerAchse);
        this.moveTool = new MoveTool(map, this.infoTool, layerStraus);
        this.add2ErTool = new SAPAdd2ER(map);
        this.delTool = new DeleteTool(map, layerStraus, sidebar, "Otstrauspkt");
        this.createToolBox();
    }

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
