import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill, Text, Icon, Circle } from 'ol/style';
import Point from 'ol/geom/Point.js';
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
            document.forms.qsMultiMod.qsmm_art.appendChild(option.cloneNode(true));
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
            document.forms.qsMultiMod.qsmm_ober.appendChild(option.cloneNode(true));
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
        let achsen_style = function (feature, resolution) {
            let styles = [];

            console.log(feature)

            // Linienfarbe - rot, wenn in ER
            let color = '#222';
            if (feature.daten.modus in feature.inER) color = '#d00';

            // Linie + Beschriftung
            styles.push(new Style({
                stroke: new Stroke({
                    color: color,
                    width: 3
                }),
                // Beschriftung
                text: new Text({
                    font: '12px Calibri,sans-serif',
                    fill: new Fill({ color: color }),
                    stroke: new Stroke({
                        color: '#fff', width: 2
                    }),
                    text: feature.vnk + ' - ' + feature.nnk,
                    placement: 'line',
                    offsetY: -7
                })
            }));

            // Pfeile/Start/Endknoten ab bestimmten Maßstab
            if (resolution < 0.15) {
                // Pfeile
                var geometry = feature.getGeometry();
                let first = true;
                geometry.forEachSegment(function (start, end) {
                    if (first) {
                        first = false;
                    } else {
                        let point = new Point(start);
                        var dx = end[0] - start[0];
                        var dy = end[1] - start[1];
                        var rotation = Math.atan2(dy, dx);
                        // arrows
                        styles.push(new Style({
                            geometry: point,
                            image: new Icon({
                                src: 'arrow_klein.png',
                                anchor: [0.75, 0.5],
                                rotateWithView: false,
                                rotation: -rotation
                            })
                        }));
                    }
                });

                // Startpunkt
                styles.push(new Style({
                    geometry: new Point(geometry.getFirstCoordinate()),
                    image: new Circle({
                        radius: 6,
                        fill: new Fill({ color: 'green' }),
                        stroke: new Stroke({
                            color: [255, 255, 255],
                            width: 1
                        })
                    })
                }));

                // Endpunkt
                styles.push(new Style({
                    geometry: new Point(geometry.getLastCoordinate()),
                    image: new Circle({
                        radius: 6,
                        fill: new Fill({ color: 'red' }),
                        stroke: new Stroke({
                            color: [255, 255, 255],
                            width: 1
                        })
                    })
                }));
            }
            return styles;
        };
        this.l_achse = new VectorLayer({
            daten: this,
            source: this.v_achse,
            opacity: 0.6,
            style: achsen_style
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

        let createStyle = function (feature, resolution) {
            let kt_art = feature.get('objekt').daten.klartexte.get('Itquerart', feature.get('objekt').art)
            let kt_ober = feature.get('objekt').daten.klartexte.get('Itquerober', feature.get('objekt').artober)

            // leere Arten filtern
            let art = 0
            if (!isNullOrUndefined(kt_art))
                art = Number(kt_art.kt);

            // leere Oberflächen filtern
            let ober = 0
            if (!isNullOrUndefined(kt_ober))
                ober = Number(kt_ober.kt);

            // Farbe für Querschnittsfläche
            let color = [255, 255, 255];

            if ((art >= 100 && art <= 110) || (art >= 113 && art <= 119) || (art >= 122 && art <= 161) || (art >= 163 && art <= 179) || art == 312)
                color = [33, 33, 33];	// Fahrstreifen
            else if (art == 111)
                color = [66, 66, 66]; // 1. Überholfahrstreifen
            else if (art == 112)
                color = [100, 100, 100]; // 2. Überholfahrstreifen
            else if (art >= 180 && art <= 183)
                color = [50, 50, 100];	// Parkstreifen
            else if (art >= 940 && art <= 942)
                color = [0xF9, 0x14, 0xB8]; // Busanlagen
            else if (art == 210) color = [0x22, 0x22, 0xff];	// Gehweg
            else if ((art >= 240 && art <= 243) || art == 162)
                color = [0x33, 0x33, 0x66];	// Radweg
            else if (art == 250 || art == 251)
                color = [0xcc, 0x22, 0xcc];	// Fuß-Rad-Weg
            else if (art == 220)
                color = [0xff, 0xdd, 0x00];	// paralleler Wirtschaftsweg
            else if (art == 420 || art == 430 || art == 900)
                color = [0xff, 0xff, 0xff];	// Markierungen
            else if (art == 310 || art == 311 || art == 313 || art == 320 || art == 330 || (art >= 910 && art <= 916))
                color = [0xee, 0xee, 0xee];	// Trenn-, Schutzstreifen und Schwellen
            else if (art == 120 || art == 121)
                color = [0x1F, 0x22, 0x97];	// Rinne
            else if (art == 301)
                color = [0x75, 0x9F, 0x1E];	// Banket
            else if (art == 510 || art == 511 || art == 520)
                color = [0x12, 0x0a, 0x8f];	// Gräben und Mulden
            else if (art == 700 || art == 710)
                color = [0x00, 0x44, 0x00];	// Böschungen
            else if (art == 314 || art == 315)
                color = [0x8A, 0x60, 0xD8];	// Inseln
            else if (art == 400 || art == 410 || art == 715)
                color = [0x8A, 0x60, 0xD8];	// Randstreifen und Sichtflächen
            else if (art == 600 || art == 610 || art == 620 || art == 630 || art == 640)
                color = [0xC1, 0xBA, 0xC8];	// Borde und Kantsteine
            else if (art == 340)
                color = [0, 0, 0];	// Gleiskörper
            else if (art == 999)
                color = [0x88, 0x88, 0x88];	// Bestandsachse
            else if (art == 990 || art == 720)
                color = [0xFC, 0x8A, 0x57];	// sonstige Streifenart

            color.push(0.4);

            return new Style({
                fill: new Fill({
                    color: color
                }),
                text: new Text({
                    font: '12px Calibri,sans-serif',
                    fill: new Fill({ color: '#000' }),
                    stroke: new Stroke({
                        color: '#fff', width: 2
                    }),
                    // get the text from the feature - `this` is ol.Feature
                    // and show only under certain resolution
                    text: ((resolution < 0.05) ? (art + " - " + ober) : '')
                })
            })
        }

        this.l_quer = new VectorLayer({
            source: this.v_quer,
            //opacity: 0.40,
            style: createStyle
        });
        this.map.addLayer(this.l_quer);
    }

    searchForStreet(event) {
        console.log(document.forms.suche.suche.value);
        let wert = document.forms.suche.suche.value;
        if (wert == "") return;
        if ("ABSCHNITT_WFS_URL" in CONFIG) {
            document.body.style.cursor = 'wait'

            const vnknnk = /(\d{7,9}[A-Z]?)[\s\-]+(\d{7,9}[A-Z]?)/gm;
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
                let buchstabe = (found2.lenth > 2) ? found2[3] : '';
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