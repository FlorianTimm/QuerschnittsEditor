import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill, Circle } from 'ol/style';
import Abschnitt from './Objekte/Abschnitt.js';
import PublicWFS from './PublicWFS.js';
import AbschnittWFS from './AbschnittWFS.js';
import Querschnitt from './Objekte/Querschnittsdaten.js';
import Klartext from './Objekte/Klartext.js';
import Aufstellvorrichtung from './Objekte/Aufstellvorrichtung.js';
import { isNullOrUndefined } from 'util';
var CONFIG = require('./config.json');

var daten = null;

class Daten {
    constructor(map, ereignisraum, ereignisraum_nr) {
        daten = this;
        this.map = map;
        this.modus = "Otaufstvor";
        this.ereignisraum = ereignisraum;
        this.ereignisraum_nr = ereignisraum_nr;
        this.querschnitteFID = {};

        this.klartexte = new Klartext();
        this.klartexte.load("Itquerart", this._showArt, this);
        this.klartexte.load("Itquerober", this._showArtOber, this);

        this._createLayerFlaechen();
        this._createLayerTrennLinien();
        this._createLayerStationen();
        this._createLayerAchsen();

        this.abschnitte = {};
        Querschnitt.loadER(this);

        this.l_aufstell = Aufstellvorrichtung.createLayer(this.map);
        Aufstellvorrichtung.loadER(this);
    }

    static get() {
        return daten;
    }

    _showArt(art, _this) {
        let arten = _this.klartexte.getAllSorted("Itquerart");
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
        let arten = _this.klartexte.getAllSorted("Itquerober");
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

    getAbschnitt(absId) {
        if (!(absId in this.abschnitte)) {
            this.abschnitte[absId] = Abschnitt.load(this, absId);
            this.v_achse.addFeature(this.abschnitte[absId]);
        }
        //console.log(this.abschnitte[absId]);
        return this.abschnitte[absId];
    }

    loadExtent() {
        document.body.style.cursor = 'wait'
        let extent = this.map.getView().calculateExtent();
        if ("ABSCHNITT_WFS_URL" in CONFIG) {
            AbschnittWFS.getByExtent(extent, this._loadExtent_Callback, undefined, this);
        } else {
            let filter = '<Filter>\n' +
                '	<BBOX>\n' +
                '	<PropertyName>GEOMETRY</PropertyName>\n' +
                '	<gml:Box srsName="' + CONFIG.EPSG_CODE + '">\n' +
                '		<gml:coordinates>' + extent[0] + ',' + extent[1] + ' ' + extent[2] + ',' + extent[3] + ' ' + '</gml:coordinates>\n' +
                '	</gml:Box>\n' +
                '	</BBOX>\n' +
                '</Filter>\n' +
                '<maxFeatures>100</maxFeatures>\n';
            PublicWFS.doQuery('VI_STRASSENNETZ', filter, this._loadExtent_Callback, undefined, this);
        }
    }

    _loadExtent_Callback(xml, _this) {
        let netz = xml.getElementsByTagName("VI_STRASSENNETZ");
        for (let abschnittXML of netz) {
            //console.log(abschnittXML)
            let abschnitt = Abschnitt.fromXML(_this, abschnittXML);
            if (!(abschnitt.abschnittid in _this.abschnitte)) {
                _this.abschnitte[abschnitt.abschnittid] = abschnitt;
                _this.v_achse.addFeature(_this.abschnitte[abschnitt.abschnittid]);
            }
        }
        document.body.style.cursor = '';
    }

    _createLayerAchsen() {
        this.v_achse = new VectorSource({
            features: []
        });
        this.l_achse = new VectorLayer({
            daten: this,
            source: this.v_achse,
            opacity: 0.6,
            style: function (feature, resolution) {
                if (feature.daten.modus in feature.inER) {
                    return new Style({
                        stroke: new Stroke({
                            color: '#dd0000',
                            width: 3
                        })
                    })
                } else {
                    return new Style({
                        stroke: new Stroke({
                            color: '#333',
                            width: 3
                        })
                    })
                }
            }
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
            opacity: 0.40,
            style: function (feature, resolution) {
                let kt = feature.get('objekt').daten.klartexte.get('Itquerart', feature.get('objekt').art)
                let art = 0
                if (!isNullOrUndefined(kt))
                    art = Number(kt.kt);
                //console.log(art);
                if ((art >= 100 && art <= 110) || (art >= 113 && art <= 119) || (art >= 122 && art <= 161) || (art >= 163 && art <= 179) || art == 312) return fill_style('#222222');	// Fahrstreifen
                else if (art == 111) return fill_style('#444444'); // 1. Überholfahrstreifen
                else if (art == 112) return fill_style('#666666'); // 2. Überholfahrstreifen
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

    searchForStreet(event) {
        console.log(document.forms.suche.suche.value);
        let wert = document.forms.suche.suche.value;
        if (wert == "") return;
        if ("ABSCHNITT_WFS_URL" in CONFIG) {
            document.body.style.cursor = 'wait'

            const vnknnk = /(\d{7,9}[A-Z]?)\s+(\d{7,9}[A-Z]?)/gm;
            let found1 = vnknnk.exec(wert)
            if (found1 != null) {
                console.log(found1)
                let vnk = found1[1];
                let nnk = found1[2];
                AbschnittWFS.getByVNKNNK(vnk, nnk, this._loadSearch_Callback, undefined, this);
                return;
            }

            const wnr = /([ABGKLabgkl])\s?(\d{1,4})\s?([A-Za-z]?)/gm;
            let found2 = wnr.exec(wert)
            if (found2 != null) {
                console.log(found2)
                let klasse = found2[1];
                let nummer = found2[2];
                let buchstabe = (found2.lenth > 2)?found2[3]:'';
                AbschnittWFS.getByWegenummer(klasse, nummer, buchstabe, this._loadSearch_Callback, undefined, this);
                return;
            }
            AbschnittWFS.getByStrName(wert, this._loadSearch_Callback, undefined, this);
        } else {
            PublicWFS.showMessage("Straßennamen-Suche ist nur über den AbschnittWFS möglich");
            /*let filter = '<Filter><Like><PropertyName><PropertyName><Literal><Literal></Like></Filter>'
            PublicWFS.doQuery('VI_STRASSENNETZ', filter, this._loadSearch_Callback, undefined, this);*/
        }
    }

    _loadSearch_Callback(xml, _this) {
        let netz = xml.getElementsByTagName("VI_STRASSENNETZ");
        let geladen = [];
        for (let abschnittXML of netz) {
            //console.log(abschnittXML)
            let abschnitt = Abschnitt.fromXML(_this, abschnittXML);
            geladen.push(abschnitt);
            if (!(abschnitt.abschnittid in _this.abschnitte)) {
                _this.abschnitte[abschnitt.abschnittid] = abschnitt;
                _this.v_achse.addFeature(_this.abschnitte[abschnitt.abschnittid]);
            }
        }
        if (geladen.length > 0) {
        let extent = Daten.calcAbschnitteExtent(geladen);
        _this.map.getView().fit(extent, { padding: [20, 240, 20, 20] })
        } else {
            PublicWFS.showMessage("Kein Abschnitt gefunden!", true);
        }
        document.body.style.cursor = '';
    }

    static calcAbschnitteExtent(abschnitte) {
        let minX = null, maxX = null, minY = null, maxY = null;
        for (let i = 0; i < abschnitte.length; i++) {
            let f = abschnitte[i];
            let p = f.getGeometry().getExtent();

            if (minX == null || minX > p[0]) minX = p[0];
            if (minY == null || minY > p[1]) minY = p[1];
            if (maxX == null || maxX < p[2]) maxX = p[2];
            if (maxY == null || maxY < p[3]) maxY = p[3];
        }
        //console.log([minX, minY, maxX, maxY])
        return [minX, minY, maxX, maxY];
    }
}

module.exports = Daten;