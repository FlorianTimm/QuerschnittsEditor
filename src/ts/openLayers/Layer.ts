// SPDX-License-Identifier: GPL-3.0-or-later

import { Image, Tile, Vector } from "ol/layer";
import { Vector as VectorSource, Image as ImageSource } from "ol/source";
import { Options as ImageOptionsOl } from "ol/layer/BaseImage";
import { Options as TileOptionsOl } from "ol/layer/BaseTile";
import { Options as VectorOptionsOl } from "ol/layer/BaseVector";
import { Daten } from "../Daten";
import TileSource from "ol/source/Tile";
import { Geometry } from "ol/geom";

/**
 * OpenLayers: Interface TileOptions
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019-06-05
 * @license GPL-3.0-or-later
*/
export interface TileOptions<TileSourceType extends TileSource> extends TileOptionsOl<TileSourceType> {
    name?: string;
    switchable?: boolean;
}

/**
 * OpenLayers: TileLayer
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019-06-05
 * @license GPL-3.0-or-later
*/
export class TileLayer<TileSourceType extends TileSource> extends Tile<TileSourceType> {
    name: string = "";
    switchable: boolean = true;


    constructor(option: TileOptions<TileSourceType>) {
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
export interface ImageOptions<ImageSourceType extends ImageSource> extends ImageOptionsOl<ImageSourceType> {
    name?: string;
    switchable?: boolean;
}

/**
 * OpenLayers: ImageLayer
 * @author Florian Timm, LGV HH 
 * @version 2019.06.05
 * @copyright MIT
 */
export class ImageLayer<ImageSourceType extends ImageSource> extends Image<ImageSourceType> {
    name: string = "";
    switchable: boolean = true;

    constructor(option: ImageOptions<ImageSourceType>) {
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
export interface VectorOptions<VectorSourceType extends VectorSource<Geometry>> extends VectorOptionsOl<VectorSourceType> {
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
export class VectorLayer<VectorSourceType extends VectorSource<Geometry>> extends Vector<VectorSourceType> {
    daten?: Daten;
    name: string = "";
    switchable: boolean = false;

    constructor(option: VectorOptions<VectorSourceType>) {
        super(option);
        if (option.daten != undefined)
            this.daten = option.daten;
        if (option.name != undefined)
            this.name = option.name;
        if (option.switchable != undefined)
            this.switchable = option.switchable;
    }
}