// SPDX-License-Identifier: GPL-3.0-or-later

import PublicWFS from '../../PublicWFS';
import Map from "../../openLayers/Map";
import Abschnitt from '../../Objekte/Abschnitt';
import Add2ER from '../prototypes/Add2ER';
import StrassenAusPunkt from '../../Objekte/StrassenAusPunkt';

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


