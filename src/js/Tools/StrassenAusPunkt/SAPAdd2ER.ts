import PublicWFS from '../../PublicWFS';
import { Map } from 'ol';
import Abschnitt from '../../Objekte/Abschnitt';
import Add2ER from '../prototypes/Add2ER';
import StrassenAusPunkt from '../../Objekte/StrassenAusPunkt';

/**
 * Querschnittsflächen zu Ereignisraum hinzufügen
 * @author Florian Timm, LGV HH 
 * @version 2019.11.04
 * @copyright MIT
 */
export default class SAPAdd2ER extends Add2ER {

    constructor(map: Map) {
        super(map, "Otstrauspkt");
    }

    loadAbschnitt(abschnitt: Abschnitt) {
        StrassenAusPunkt.loadAbschnittER(abschnitt, PublicWFS.showMessage, "Erfolgreich in ER kopiert");
    }
}


