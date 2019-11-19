import Map from "../../openLayers/Map";

/**
 * Interface für alle Bearbeitungs-Tools
 * @author Florian Timm, LGV HH 
 * @version 2019.06.05
 * @copyright MIT
 */

export default abstract class Tool {
    protected map: Map;

    constructor(map: Map) {
        this.map = map;
    }

    abstract start(): void;
    abstract stop(): void;
}