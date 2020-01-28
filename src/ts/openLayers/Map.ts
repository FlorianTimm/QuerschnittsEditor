// SPDX-License-Identifier: GPL-3.0-or-later

import { Map as olMap } from "ol";

/**
 * Erweiterung der Openlayers-Map
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019-06-05
 * @license GPL-3.0-or-later
*/
export default class Map extends olMap {
    firstHash: boolean;
}