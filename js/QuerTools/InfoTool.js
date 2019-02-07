import {Style, Stroke, Fill} from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';

class InfoTool {
    constructor(map, daten) {
        this.map = map;
        this.daten = daten;

        this.select = new SelectInteraction({
            layers: [this.daten.l_trenn],
            style: new Style({
                stroke: new Stroke({
                    color: 'rgba(255, 0, 0, 0.5)',
                    width: 3
                })
            })
        });

        this.select.info = this;
        
        this.select.on('select', function (e) {
            e.target.info.logAuswahl(e.target);
        });
        
        
        
        this.select_fl = new SelectInteraction({
            layers: [this.daten.l_quer],
            style: new Style({
                fill: new Fill({
                    color: 'rgba(255, 0, 0, 0.3)'
                })
            })
        });

        this.select_fl.on('select', function (e) {
            this.select.getFeatures().clear()
            if (e.selected.length > 0) {
                let auswahl = e.selected[0];
                let a = auswahl.get('objekt').trenn;
                this.select.getFeatures().push(a);
            }
            this.logAuswahl(this.select);
        }.bind(this));
    }

    logAuswahl(selectBefehl) {
        var selection = selectBefehl.getFeatures();
        if (selection.getLength() <= 0) {
            document.forms.info.style.display = "none";
            return;
        }
        document.forms.info.style.display = "block";
        var querschnitt = selection.item(0).get('objekt');
    
        document.getElementById("info_vnk").innerHTML = querschnitt.station.abschnitt.vnk;
        document.getElementById("info_nnk").innerHTML = querschnitt.station.abschnitt.nnk;
        document.getElementById("info_station").innerHTML = querschnitt.vst + " - " + querschnitt.bst;
        document.getElementById("info_streifen").innerHTML = querschnitt.streifen + " " + querschnitt.streifennr;
    
        document.getElementById("info_art").value = querschnitt.art.substr(-32);
        document.getElementById("info_ober").value = querschnitt.artober.substr(-32);
    
        document.getElementById("info_breite").value = querschnitt.breite;
        document.getElementById("info_bisbreite").value = querschnitt.bisBreite;
    }

            
    start() {
        this.map.addInteraction(this.select);
        this.map.addInteraction(this.select_fl);
    }
    
    stop() {
        this.map.removeInteraction(this.select);
        this.map.removeInteraction(this.select_fl);
        document.forms.info.style.display = "none";
    }
    
}

module.exports = InfoTool;