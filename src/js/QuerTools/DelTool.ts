import { Map } from "ol";
import Daten from '../Daten';
import InfoTool from "./InfoTool";
import Tool from '../Tool';

class DelTool implements Tool {
    map: Map;
    daten: Daten;
    info: any;
    constructor(map: Map, daten: Daten, info: InfoTool) {
        this.map = map;
        this.daten = daten;
        this.info = info;

    }

    start() {

    }

    stop() {

    }
}

export default DelTool;