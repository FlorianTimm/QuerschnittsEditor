import { Style, Stroke, Fill } from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import { never } from 'ol/events/condition';
import Tool from '../prototypes/Tool';
import { Map } from 'ol';
import Daten from '../../Daten';
import { SelectEvent } from 'ol/interaction/Select';
import Querschnitt from 'src/js/Objekte/Querschnittsdaten';

/**
 * Funktion zum Anzeigen von Informationen über Aufstellvorrichtungen
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */
class QuerInfoTool extends Tool {
    map: Map;
    daten: Daten;
    select: SelectInteraction;
    select_fl: SelectInteraction;

    constructor(map: Map, daten: Daten) {
        super();
        this.map = map;
        this.daten = daten;

        this.select = new SelectInteraction({
            layers: [this.daten.layerTrenn],
            toggleCondition: never,
            style: new Style({
                stroke: new Stroke({
                    color: 'rgba(255, 0, 0, 0.5)',
                    width: 3
                })
            })
        });

        this.select.on('select', function (e) {
            e.target.info.logAuswahl(e.target);
        });



        this.select_fl = new SelectInteraction({
            layers: [this.daten.layerQuer],
            toggleCondition: never,
            style: new Style({
                fill: new Fill({
                    color: 'rgba(255, 0, 0, 0.3)'
                })
            })
        });

        this.select_fl.on('select', function (e: SelectEvent) {
            this.select.getFeatures().clear()
            if (e.selected.length > 0) {
                let auswahl = e.selected[0];
                let a = auswahl.get('objekt').trenn;
                this.select.getFeatures().push(a);
            }
            this.logAuswahl(this.select);
        }.bind(this));
    }

    logAuswahl(selectBefehl: SelectInteraction) {
        var selection = selectBefehl.getFeatures();
        if (selection.getLength() <= 0) {
            document.forms.namedItem("info").style.display = "none";
            return;
        }
        document.forms.namedItem("info").style.display = "block";
        var querschnitt = selection.item(0).get('objekt') as Querschnitt;

        document.getElementById("info_vnk").innerHTML = querschnitt.getStation().getAbschnitt().getVnk();
        document.getElementById("info_nnk").innerHTML = querschnitt.getStation().getAbschnitt().getNnk();
        document.getElementById("info_station").innerHTML = querschnitt.getVst() + " - " + querschnitt.getBst();
        document.getElementById("info_streifen").innerHTML = querschnitt.getStreifen() + " " + querschnitt.getStreifennr();

        (document.getElementById("info_art") as HTMLInputElement).value = (querschnitt.getArt() == null) ? '' : querschnitt.getArt().substr(-32);
        (document.getElementById("info_ober") as HTMLInputElement).value = (querschnitt.getArtober() == null) ? '' : querschnitt.getArtober().substr(-32);

        (document.getElementById("info_breite") as HTMLInputElement).value = querschnitt.getBreite().toString();
        (document.getElementById("info_bisbreite") as HTMLInputElement).value = querschnitt.getBisBreite().toString();
    }


    start() {
        this.map.addInteraction(this.select);
        this.map.addInteraction(this.select_fl);
    }

    stop() {
        this.map.removeInteraction(this.select);
        this.map.removeInteraction(this.select_fl);
        document.forms.namedItem("info").style.display = "none";
    }

}

export default QuerInfoTool;