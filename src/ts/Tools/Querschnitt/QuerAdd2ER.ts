import PublicWFS from '../../PublicWFS';
import Querschnittsdaten from '../../Objekte/Querschnittsdaten';
import Map from "../../openLayers/Map";
import Abschnitt from '../../Objekte/Abschnitt';
import Add2ER from '../prototypes/Add2ER';

/**
 * Querschnittsflächen zu Ereignisraum hinzufügen
 * @author Florian Timm, LGV HH 
 * @version 2019.11.04
 * @copyright MIT
 */
export default class QuerAdd2ER extends Add2ER {

    constructor(map: Map) {
        super(map, "Querschnitt");
    }

    loadAbschnitt(abschnitt: Abschnitt) {
        Querschnittsdaten.loadAbschnittER(abschnitt)
            .then(() => { PublicWFS.showMessage("Erfolgreich in ER kopiert") });
    }
}