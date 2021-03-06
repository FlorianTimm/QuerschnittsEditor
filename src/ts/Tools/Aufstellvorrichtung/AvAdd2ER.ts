// SPDX-License-Identifier: GPL-3.0-or-later

import { Abschnitt } from '../../Objekte/Abschnitt';
import { Aufstellvorrichtung } from '../../Objekte/Aufstellvorrichtung';
import { Map } from "../../openLayers/Map";
import { PublicWFS } from '../../PublicWFS';
import { Add2ER } from '../prototypes/Add2ER';

/**
 * Funktion zum Hinzufügen von Aufstellvorrichtungen zum Ereignisraum
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.10.29
 * @license GPL-3.0-or-later
*/
export class AvAdd2ER extends Add2ER {
    constructor(map: Map) {
        super(map, "Otaufstvor");
    }

    loadAbschnitt(abschnitt: Abschnitt) {
        Aufstellvorrichtung.loadAbschnittER(abschnitt)
            .then(() => { PublicWFS.showMessage("Erfolgreich in ER kopiert") })
            .catch(() => { PublicWFS.showMessage("Fehler", true) });;
    }
}