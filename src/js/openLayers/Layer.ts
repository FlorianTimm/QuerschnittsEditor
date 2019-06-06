import { Tile, Image, Vector } from "ol/layer";
import { Options as TileOptionsOl } from "ol/layer/Tile";
import { Options as ImageOptionsOl } from "ol/layer/Image";
import { Options as VectorOptionsOl } from "ol/layer/Vector";
import Daten from "../Daten";


/**
 * OpenLayers: Interface TileOptions
 * @author Florian Timm, LGV HH 
 * @version 2019.06.05
 * @copyright MIT
 */
export interface TileOptions extends TileOptionsOl {
    name?: string;
    switchable?: boolean;
}

/**
 * OpenLayers: TileLayer
 * @author Florian Timm, LGV HH 
 * @version 2019.06.05
 * @copyright MIT
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
}

/**
 * OpenLayers: VectorLayer
 * @author Florian Timm, LGV HH 
 * @version 2019.06.05
 * @copyright MIT
 */
export class VectorLayer extends Vector {
    daten?: Daten;

    constructor(option: VectorOptions) {
        super(option);
        if (option.daten != undefined)
            this.daten = option.daten;
    }
}