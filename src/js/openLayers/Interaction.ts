import { Modify, Select } from 'ol/interaction';
import Geometry from 'ol/geom/Geometry';
import QuerModifyTool from '../Tools/Querschnitt/QuerModifyTool';
import QuerInfoTool from '../Tools/Querschnitt/QuerInfoTool';
import AvMove from '../Tools/Aufstellvorrichtung/AvMove';
import SAPMove from '../Tools/StrassenAusPunkt/SAPMove';

/**
 * OpenLayers-ModifyInteraktion
 * @author Florian Timm, LGV HH 
 * @version 2019.06.06
 * @copyright MIT
 */
export class ModifyInteraction extends Modify {
    geo_vorher?: Geometry = null;
    modify?: QuerModifyTool | AvMove | SAPMove = null;
}

/**
 * OpenLayers-SelectInteraktion
 * @author Florian Timm, LGV HH 
 * @version 2019.06.06
 * @copyright MIT
 */
export class SelectInteraction extends Select {
    info?: QuerInfoTool = null;
}