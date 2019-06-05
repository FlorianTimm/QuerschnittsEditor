import { Modify, Select } from 'ol/interaction';
import Geometry from 'ol/geom/Geometry';
import ModifyTool from '../QuerTools/ModifyTool';
import InfoTool from '../QuerTools/InfoTool';
import AvMove from '../SchilderTools/AvMove';


export class ModifyInteraction extends Modify {
    geo_vorher?: Geometry = null;
    modify?: ModifyTool | AvMove = null;
}

export class SelectInteraction extends Select {
    info?: InfoTool = null;
}