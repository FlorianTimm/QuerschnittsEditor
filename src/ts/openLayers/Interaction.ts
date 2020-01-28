// SPDX-License-Identifier: GPL-3.0-or-later

import { Modify, Select } from 'ol/interaction';
import Geometry from 'ol/geom/Geometry';
import QuerModifyTool from '../Tools/Querschnitt/QuerModifyTool';
import QuerInfoTool from '../Tools/Querschnitt/QuerInfoTool';
import MoveTool from '../Tools/MoveTool';

/**
 * OpenLayers-ModifyInteraktion
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.06.06
 * @license GPL-3.0-or-later
*/
export class ModifyInteraction extends Modify {
    geo_vorher?: Geometry = null;
    modify?: QuerModifyTool | MoveTool = null;
}

/**
 * OpenLayers-SelectInteraktion
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.06.06
 * @license GPL-3.0-or-later
*/

export class SelectInteraction extends Select {
    info?: QuerInfoTool = null;
}