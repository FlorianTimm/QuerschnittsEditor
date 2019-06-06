import { Map } from "ol";
import Daten from '../../Daten';
import QuerInfoTool from "./QuerInfoTool";
import Tool from '../Tool';

/**
 * Funktion zum Löschen von Querschnitten
 * @author Florian Timm, LGV HH 
 * @version 2019.05.20
 * @copyright MIT
 */
class QuerDelTool implements Tool {
    map: Map;
    daten: Daten;
    info: any;
    constructor(map: Map, daten: Daten, info: QuerInfoTool) {
        this.map = map;
        this.daten = daten;
        this.info = info;

    }

    start() {

    }

    stop() {

    }
}

export default QuerDelTool;