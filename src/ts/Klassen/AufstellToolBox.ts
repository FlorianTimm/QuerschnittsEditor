import ToolBox from "./ToolBox";
import Map from "../openLayers/Map";
import InfoTool from "../Tools/InfoTool";
import AvAdd from "../Tools/Aufstellvorrichtung/AvAdd";
import AvVzAdd from "../Tools/Aufstellvorrichtung/AvVzAdd";
import MoveTool from "../Tools/MoveTool";
import AvAdd2ER from "../Tools/Aufstellvorrichtung/AvAdd2ER";
import DeleteTool from "../Tools/DeleteTool";
import Aufstellvorrichtung from "../Objekte/Aufstellvorrichtung";
import Abschnitt from "../Objekte/Abschnitt";

export default class AufstellToolBox extends ToolBox {
    private infoTool: InfoTool;
    private addTool: AvAdd;
    private vzAddTool: AvVzAdd;
    private moveTool: MoveTool;
    private add2ErTool: AvAdd2ER;
    private delTool: DeleteTool;

    constructor(map: Map, sidebar: HTMLDivElement) {
        super(map, sidebar, "tab_Otaufstvor")

        let layerAufstell = Aufstellvorrichtung.getLayer()
        let layerAchse = Abschnitt.getLayer();

        this.infoTool = new InfoTool(this.map, layerAufstell, this.sidebar);
        this.addTool = new AvAdd(this.map, sidebar, layerAchse);
        this.vzAddTool = new AvVzAdd(this.map);
        this.moveTool = new MoveTool(this.map, this.infoTool, layerAufstell);
        this.add2ErTool = new AvAdd2ER(this.map);
        this.delTool = new DeleteTool(this.map, layerAufstell, this.sidebar, "Otaufstvor");
        this.createToolBox();
    }

    protected createToolBox() {
        this.createRadio("Info", this.infoTool)
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
