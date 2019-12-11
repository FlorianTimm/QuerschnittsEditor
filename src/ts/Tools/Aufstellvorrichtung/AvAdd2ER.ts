import PublicWFS from '../../PublicWFS';
import Aufstellvorrichtung from '../../Objekte/Aufstellvorrichtung';
import Map from "../../openLayers/Map";
import Abschnitt from '../../Objekte/Abschnitt';
import Add2ER from '../prototypes/Add2ER';

/**
 * Funktion zum Hinzufügen von Aufstellvorrichtungen zum Ereignisraum
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */
export default class AvAdd2ER extends Add2ER {
    constructor(map: Map) {
        super(map, "Otaufstvor");
    }

    loadAbschnitt(abschnitt: Abschnitt) {
        Aufstellvorrichtung.loadAbschnittER(abschnitt)
            .then(() => { PublicWFS.showMessage("Erfolgreich in ER kopiert") })
            .catch(() => { PublicWFS.showMessage("Fehler", true) });;
    }
}