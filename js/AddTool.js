import {Style, Stroke} from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';
import PublicWFS from './PublicWFS.js';
import Querschnitt from './Querschnitt.js';

class AddTool {
    constructor(map, daten, info) {
        this.map = map;
        this.daten = daten;
        this.info = info;
        this.select = new SelectInteraction({
            layers: [this.daten.l_trenn],
            style: new Style({
                stroke: new Stroke({
                    color: 'rgba(255, 0, 0, 0.5)',
                    width: 5
                })
            })
        });
        
        this.select.on('select', function (e) {
            if (e.selected.length == 0) {
                document.forms.hinzu.getElementsByTagName("input")[0].style.backgroundColor = "";
                document.forms.hinzu.getElementsByTagName("input")[0].disabled = true;
                return
            }
            
            this.info.logAuswahl(this.select);
            document.forms.hinzu.getElementsByTagName("input")[0].style.backgroundColor = "#ffcc00";
            document.forms.hinzu.getElementsByTagName("input")[0].disabled = false;
        }.bind(this));
        
        document.getElementById("addQuerschnittButton").addEventListener('click', this.addQuerschnitt.bind(this));
    }

    start() {
        document.forms.hinzu.style.display = 'block';
        this.map.addInteraction(this.select);
    }

    stop() {
        document.forms.hinzu.style.display = 'none';
        this.map.removeInteraction(this.select);
        document.forms.info.style.display = "none";
    }


    addQuerschnitt() {
        let selection = this.select.getFeatures();
        if (this.select.getFeatures().getLength() <= 0) return;
        let querschnitt = selection.item(0).get('objekt');
        let gesStreifen = querschnitt.station.getStreifen(querschnitt.streifen);
        let soap = "";

        let querschnittNeu = new Querschnitt(this.daten);
        querschnittNeu.breite = 2.75;
        querschnittNeu.bisBreite = 2.75;

        let strArray = []
        for (let nnr in gesStreifen) {
            if (nnr <= querschnitt.streifennr) continue;
            strArray.push(gesStreifen[nnr]);
        }
        console.log(strArray);

        for (let quer of strArray) {
            gesStreifen[quer.streifennr + 1] = quer;
            quer.streifennr = quer.streifennr + 1;
            if (quer.streifen == 'L') {
                quer.XBstR -= querschnittNeu.bisBreite;
                quer.XVstR -= querschnittNeu.breite;
                quer.XBstL -= querschnittNeu.bisBreite;
                quer.XVstL -= querschnittNeu.breite;
            } else if (quer.streifen == 'R') {
                quer.XBstL += querschnittNeu.bisBreite;
                quer.XVstL += querschnittNeu.breite;
                quer.XBstR += querschnittNeu.bisBreite;
                quer.XVstR += querschnittNeu.breite;
            }
            quer.createGeom();
            soap += quer.createUpdateStreifenXML();
        }

        
        if (querschnitt.streifen == 'L') {
            querschnittNeu.XBstR = querschnitt.XBstL;
            querschnittNeu.XVstR = querschnitt.XVstL;
            querschnittNeu.XBstL = querschnittNeu.XBstR - querschnittNeu.bisBreite;
            querschnittNeu.XVstL = querschnittNeu.XVstR - querschnittNeu.breite;
        } else if (querschnitt.streifen == 'R') {
            querschnittNeu.XBstL = querschnitt.XBstR;
            querschnittNeu.XVstL = querschnitt.XVstR;
            querschnittNeu.XBstR = querschnittNeu.XBstL + querschnittNeu.bisBreite;
            querschnittNeu.XVstR = querschnittNeu.XVstL + querschnittNeu.breite;
        }

        querschnittNeu.streifen = querschnitt.streifen;
        querschnittNeu.streifennr = querschnitt.streifennr + 1;
        querschnittNeu.art = querschnitt.art;
        querschnittNeu.artober = querschnitt.artober;
        querschnittNeu.station = querschnitt.station;
        querschnittNeu.vst = querschnitt.vst;
        querschnittNeu.bst = querschnitt.bst;
        querschnittNeu.abschnittId = querschnitt.abschnittId;
        gesStreifen[querschnittNeu.streifennr] = querschnittNeu;
        querschnittNeu.createGeom();
        
        soap += querschnittNeu.createInsertXML();

        console.log(soap);
        PublicWFS.showMessage("Noch nicht möglich", true);
    }
    
    
    insertQuerschnittDb(abschnittid,station) {
        
       
    }
}

module.exports = AddTool;