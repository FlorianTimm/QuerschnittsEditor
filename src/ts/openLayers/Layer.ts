// SPDX-License-Identifier: GPL-3.0-or-later

import { Image, Tile, Vector } from "ol/layer";
import { Options as ImageOptionsOl } from "ol/layer/BaseImage";
import { Options as TileOptionsOl } from "ol/layer/BaseTile";
import { Options as VectorOptionsOl } from "ol/layer/BaseVector";
import Daten from "../Daten";

/**
 * OpenLayers: Interface TileOptions
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019-06-05
 * @license GPL-3.0-or-later
*/
export interface TileOptions extends TileOptionsOl {
    name?: string;
    switchable?: boolean;
}

/**
 * OpenLayers: TileLayer
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019-06-05
 * @license GPL-3.0-or-later
*/
export class TileLayer extends Tile {
    name: string = "";
    switchable: boolean = true;


    constructor(option: TileOptions) {
        super(option);
        if (option.name != undefined)
            this.name = option.name;
        if (option.switchable != undefined)
            this.switchable = option.switchable;
    }
}

/**
 * OpenLayers: Interface ImageOptions
 * @author Florian Timm, LGV HH 
 * @version 2019.06.05
 * @copyright MIT
 */
export interface ImageOptions extends ImageOptionsOl {
    name?: string;
    switchable?: boolean;
}

/**
 * OpenLayers: ImageLayer
 * @author Florian Timm, LGV HH 
 * @version 2019.06.05
 * @copyright MIT
 */
export class ImageLayer extends Image {
    name: string = "";
    switchable: boolean = true;

    constructor(option: ImageOptions) {
        super(option);
        if (option.name != undefined)
            this.name = option.name;
        if (option.switchable != undefined)
            this.switchable = option.switchable;
    }
}

/**
 * OpenLayers: Interface VectorOptions
 * @author Florian Timm, LGV HH 
 * @version 2019.06.05
 * @copyright MIT
 */
export interface VectorOptions extends VectorOptionsOl {
    daten?: Daten;
    name?: string;
    switchable?: boolean;
}

/**
 * OpenLayers: VectorLayer
 * @author Florian Timm, LGV HH 
 * @version 2019.06.05
 * @copyright MIT
 */
export class VectorLayer extends Vector {
    daten?: Daten;
    name: string = "";
    switchable: boolean = false;

    constructor(option: VectorOptions) {
        super(option);
        if (option.daten != undefined)
            this.daten = option.daten;
        if (option.name != undefined)
            this.name = option.name;
        if (option.switchable != undefined)
            this.switchable = option.switchable;
    }
}