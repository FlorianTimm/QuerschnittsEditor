import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill, Circle } from 'ol/style';
import Abschnitt from './Objekte/Abschnitt.js';
import PublicWFS from './PublicWFS.js';
import Querschnitt from './Objekte/Querschnittsdaten.js';
import Klartext from './Objekte/Klartext.js';
import Aufstellvorrichtung from './Objekte/Aufstellvorrichtung.js';
import { isNullOrUndefined } from 'util';

var daten = null;

class Daten {
    constructor(map, ereignisraum) {
        daten = this;
        this.map = map;
        this.ereignisraum = ereignisraum;

        this.kt_art = new Klartext('Itquerart', 'art', this._showArt, this);
        this.kt_artober = new Klartext('Itquerober', 'artober', this._showArtOber, this);

        this._createLayerFlaechen();
        this._createLayerTrennLinien();
        this._createLayerStationen();
        this._createLayerAchsen();

        this.abschnitte = {};
        this.loadER();

        this.l_aufstell = Aufstellvorrichtung.createLayer(this.map);
        Aufstellvorrichtung.loadAbschnittER(this.ereignisraum, this.l_aufstell);
    }

    static get() {
        return daten;
    }

    _showArt(art, _this) {
        let arten = art.getAllSorted();
        for (let a of arten) {
            let option = document.createElement('option');
            let t = document.createTextNode(a.beschreib);
            option.appendChild(t);
            let v = document.createAttribute('value');
            v.value = a.objektId;
            option.setAttributeNode(v);
            document.forms.info.info_art.appendChild(option);
        }
    }

    _showArtOber(artober, _this) {
        let arten = artober.getAllSorted();
        for (let a of arten) {
            let option = document.createElement('option');
            let t = document.createTextNode(a.beschreib);
            option.appendChild(t);
            let v = document.createAttribute('value');
            v.value = a.objektId;
            option.setAttributeNode(v);
            document.forms.info.info_ober.appendChild(option);
        }
    }

    loadER() {
        PublicWFS.doQuery('Dotquer', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + this.ereignisraum + '</Literal></PropertyIsEqualTo></Filter>', this._loadER_Callback, undefined, this);
    }

    _loadER_Callback(xml, _this) {
        let dotquer = xml.getElementsByTagName("Dotquer");
        for (let quer of dotquer) {
            Querschnitt.fromXML(_this, quer);
        }
    }

    getAbschnitt(absId) {
        if (!(absId in this.abschnitte)) {
            this.abschnitte[absId] = Abschnitt.loadFromPublicWFS(absId);
            this.v_achse.addFeature(this.abschnitte[absId].getFeature());
        }
        //console.log(this.abschnitte[absId]);
        return this.abschnitte[absId];
    }


    _createLayerAchsen() {
        this.v_achse = new VectorSource({
            features: []
        });
        this.l_achse = new VectorLayer({
            source: this.v_achse,
            opacity: 0.6,
            style: new Style({
                stroke: new Stroke({
                    color: '#dd0000',
                    width: 3
                })
            })
        });
        this.map.addLayer(this.l_achse);
    }

    _createLayerStationen() {
        this.v_station = new VectorSource({
            features: []
        });
        this.l_station = new VectorLayer({
            source: this.v_station,
            opacity: 0.6,
            style: new Style({
                stroke: new Stroke({
                    color: '#000000',
                    width: 1
                }),
            })
        });
        this.map.addLayer(this.l_station);
    }

    _createLayerTrennLinien() {
        this.v_trenn = new VectorSource({
            features: []
        });
        this.l_trenn = new VectorLayer({
            source: this.v_trenn,
            opacity: 0.6,
            style: new Style({
                stroke: new Stroke({
                    color: '#00dd00',
                    width: 2
                })
            })
        });
        this.map.addLayer(this.l_trenn);
    }

    _createLayerFlaechen() {
        // Layer mit Querschnittsflächen
        this.v_quer = new VectorSource({
            features: []
        });

        function fill_style(color) {
            return new Style({
                fill: new Fill({
                    color: color
                })
            })
        }

        this.l_quer = new VectorLayer({
            source: this.v_quer,
            opacity: 0.36,
            style: function (feature, resolution) {
                let kt = feature.get('objekt').daten.kt_art.get(feature.get('objekt').art)
                let art = 0
                if (!isNullOrUndefined(kt))
                    art = Number(kt.kt);
                //console.log(art);
                if ((art >= 100 && art <= 119) || (art >= 122 && art <= 161) || (art >= 163 && art <= 179) || art == 312) return fill_style('#444444');	// Fahrstreifen
                else if (art >= 180 && art <= 183) return fill_style('#333366');	// Parkstreifen
                else if (art >= 940 && art <= 942) return fill_style('#F914B8'); // Busanlagen
                else if (art == 210) return fill_style('#2222ff');	// Gehweg
                else if ((art >= 240 && art <= 243) || art == 162) return fill_style('#333366');	// Radweg
                else if (art == 250 || art == 251) return fill_style('#cc22cc');	// Fuß-Rad-Weg
                else if (art == 220) return fill_style('#ffdd00');	// paralleler Wirtschaftsweg
                else if (art == 420 || art == 430 || art == 900) return fill_style('#ffffff');	// Markierungen
                else if (art == 310 || art == 311 || art == 313 || art == 320 || art == 330 || (art >= 910 && art <= 916)) return fill_style('#eeeeee');	// Trenn-, Schutzstreifen und Schwellen
                else if (art == 120 || art == 121) return fill_style('#1F2297');	// Rinne
                else if (art == 301) return fill_style('#759F1E');	// Banket
                else if (art == 510 || art == 511 || art == 520) return fill_style('#120a8f');	// Gräben und Mulden
                else if (art == 700 || art == 710) return fill_style('#004400');	// Böschungen
                else if (art == 314 || art == 315) return fill_style('#8A60D8');	// Inseln
                else if (art == 400 || art == 410 || art == 715) return fill_style('#8A60D8');	// Randstreifen und Sichtflächen
                else if (art == 600 || art == 610 || art == 620 || art == 630 || art == 640) return fill_style('#C1BAC8');	// Borde und Kantsteine
                else if (art == 340) return fill_style('#000000');	// Gleiskörper
                else if (art == 999) return fill_style('#888888');	// Bestandsachse
                else if (art == 990 || art == 720) return fill_style('#FC8A57');	// sonstige Streifenart
                else return fill_style('#ffffff');
            }
        });
        this.map.addLayer(this.l_quer);
    }

}

module.exports = Daten;