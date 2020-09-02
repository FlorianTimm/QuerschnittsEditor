// SPDX-License-Identifier: GPL-3.0-or-later

import Abschnitt from '../../Objekte/Abschnitt';
import StrassenAusPunkt from '../../Objekte/StrassenAusPunkt';
import Map from "../../openLayers/Map";
import PublicWFS from '../../PublicWFS';
import Add2ER from '../prototypes/Add2ER';

/**
 * Querschnittsflächen zu Ereignisraum hinzufügen
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.11.04
 * @license GPL-3.0-or-later
*/
export default class SAPAdd2ER extends Add2ER {

    constructor(map: Map) {
        super(map, "Otstrauspkt");
    }

    loadAbschnitt(abschnitt: Abschnitt) {
        StrassenAusPunkt.loadAbschnittER(abschnitt)
            .then(() => { PublicWFS.showMessage("Erfolgreich in ER kopiert") })
            .catch(() => { PublicWFS.showMessage("Fehler", true) });;
    }
}


