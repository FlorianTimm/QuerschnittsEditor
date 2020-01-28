// SPDX-License-Identifier: GPL-3.0-or-later

import Map from "../../openLayers/Map";

/**
 * Interface für alle Bearbeitungs-Tools
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.06.05
 * @license GPL-3.0-or-later
*/
export default abstract class Tool {
    protected map: Map;

    constructor(map: Map) {
        this.map = map;
    }

    abstract start(): void;
    abstract stop(): void;
}