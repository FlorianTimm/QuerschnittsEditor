// SPDX-License-Identifier: GPL-3.0-or-later

import PublicWFS from '../../PublicWFS';
import Querschnittsdaten from '../../Objekte/Querschnittsdaten';
import Map from "../../openLayers/Map";
import Abschnitt from '../../Objekte/Abschnitt';
import Add2ER from '../prototypes/Add2ER';

/**
 * Querschnittsflächen zu Ereignisraum hinzufügen
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.11.04
 * @license GPL-3.0-or-later
*/
export default class QuerAdd2ER extends Add2ER {

    constructor(map: Map) {
        super(map, "Querschnitt");
    }

    loadAbschnitt(abschnitt: Abschnitt) {
        Querschnittsdaten.loadAbschnittER(abschnitt)
            .then(() => { PublicWFS.showMessage("Erfolgreich in ER kopiert") })
            .catch(() => { PublicWFS.showMessage("Fehler", true) });;
    }
}