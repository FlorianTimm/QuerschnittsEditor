import QuerAdd2ER from '../Tools/Querschnitt/QuerAdd2ER';
import QuerAddTool from '../Tools/Querschnitt/QuerAddTool';
import QuerDelTool from '../Tools/Querschnitt/QuerDelTool';
import QuerInfoTool from '../Tools/Querschnitt/QuerInfoTool';
import QuerModifyTool from '../Tools/Querschnitt/QuerModifyTool';
import QuerPartTool from '../Tools/Querschnitt/QuerPartTool';
import Map from '../openLayers/Map';
import ToolBox from './ToolBox';
import Querschnitt from '../Objekte/Querschnittsdaten';
import Abschnitt from '../Objekte/Abschnitt';
import QuerStation from '../Objekte/QuerStation';

export default class QuerschnittToolBox extends ToolBox {
    private infoTool: QuerInfoTool;
    private modifyTool: QuerModifyTool;
    private delTool: QuerDelTool;
    private addTool: QuerAddTool;
    private partTool: QuerPartTool;
    private qsAdd2ER: QuerAdd2ER;

    constructor(map: Map, sidebar: HTMLDivElement) {
        super(map, sidebar, "tab_Querschnitt");

        let layerTrenn = Querschnitt.getLayerTrenn();
        let layerQuer = Querschnitt.getLayerFlaechen();
        let layerAchse = Abschnitt.getLayer();
        let layerStation = QuerStation.getLayer();

        this.infoTool = new QuerInfoTool(this.map, layerTrenn, layerQuer, this.sidebar);
        this.modifyTool = new QuerModifyTool(map, this.infoTool, this.sidebar, layerTrenn, layerQuer, layerStation);
        this.delTool = new QuerDelTool(map, this.infoTool, layerTrenn, layerQuer);
        this.addTool = new QuerAddTool(map, this.infoTool, layerTrenn);
        this.partTool = new QuerPartTool(map, this.infoTool, this.sidebar, layerAchse);
        this.qsAdd2ER = new QuerAdd2ER(map);
        this.createToolBox();
    }

    protected createToolBox() {
        this.createRadio("Info", this.infoTool)
        $(this.form).append($("<br />"))
        this.createRadio("zum ER hinzufügen", this.qsAdd2ER)
        $(this.form).append($("<br />"))
        this.createRadio("Fläche ändern", this.modifyTool)
        $(this.form).append($("<br />"))
        this.createRadio("Fläche löschen", this.delTool)
        $(this.form).append($("<br />"))
        this.createRadio("Fläche hinzufügen", this.addTool)
        $(this.form).append($("<br />"))
        this.createRadio("Querschnitt teilen", this.partTool)
    }
}