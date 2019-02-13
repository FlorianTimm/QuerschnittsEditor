import PublicWFS from '../PublicWFS.js';
import Klartext from './Klartext.js';
import { Point } from 'ol/geom';
import Feature from 'ol/Feature.js';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill, Circle, Text } from 'ol/style';

var CONFIG_WFS = require('../config_wfs.json');

var art = null, lage = null, quelle = null;

class Aufstellvorrichtung extends Feature {
    constructor(daten) {
        super({ geom: null });
        this.daten = daten;

        Aufstellvorrichtung.loadKlartexte();
    }

    static loadKlartexte() {
        //console.log("Klartexte laden")
        if (art == null) {
            art = new Klartext('Itaufstvorart', 'art', Aufstellvorrichtung._ktArtLoaded);
        }
        if (lage == null) {
            lage = new Klartext('Itallglage', 'allglage', Aufstellvorrichtung._ktLageLoaded);
        }
        if (quelle == null) {
            quelle = new Klartext('Itquelle', 'quelle', Aufstellvorrichtung._ktQuelleLoaded);
        }
    }

    static _ktArtLoaded(art) {
        let arten = art.getAllSorted();
        for (let a of arten) {
            let option = document.createElement('option');
            let t = document.createTextNode(a.beschreib);
            option.appendChild(t);
            let v = document.createAttribute('value');
            v.value = a.objektId;
            option.setAttributeNode(v);
            document.forms.avadd.avadd_art.appendChild(option);
        }
    }

    static _ktLageLoaded(art) {
        let arten = art.getAllSorted();
        for (let a of arten) {
            let option = document.createElement('option');
            let t = document.createTextNode(a.beschreib);
            option.appendChild(t);
            let v = document.createAttribute('value');
            v.value = a.objektId;
            option.setAttributeNode(v);
            document.forms.avadd.avadd_lage.appendChild(option);
        }
    }

    static _ktQuelleLoaded(art) {
        let arten = art.getAllSorted();
        for (let a of arten) {
            let option = document.createElement('option');
            let t = document.createTextNode(a.beschreib);
            option.appendChild(t);
            let v = document.createAttribute('value');
            v.value = a.objektId;
            option.setAttributeNode(v);
            document.forms.avadd.avadd_quelle.appendChild(option);
        }
    }

    getHTMLInfo() {
        let r = "<table>";
        /*for (var tag in CONFIG_WFS.AUFSTELL) {
            if (this[tag] == null || this[tag] == undefined) continue;

            r += "<tr><td>" + tag + "</td><td>";
            if (tag == 'art') {
                r += art.get(this[tag]).beschreib
            } else {
                r += this[tag];
            }
            r += "</td></tr>";
        }
        */
        r += "<tr><td>VNK:</td><td>" + this.abschnitt.vnk + "</td></tr>";
        r += "<tr><td>NNK:</td><td>" + this.abschnitt.nnk + "</td></tr>";
        r += "<tr><td>VST:</td><td>" + this.vst + "</td></tr>";
        r += "<tr><td>Abstand:</td><td>" 
        if (this.rabstbaVst >= 0.01) r += "R";
        else if (this.rabstbaVst <= 0.01) r += "L";
        else r += "M";
        r += " " + Math.abs(this.rabstbaVst) + '</td></tr>';
        r += "<tr><td>Art:</td><td>" + art.get(this.art).beschreib + "</td></tr>";
        r += "<tr><td>Lage:</td><td>" + lage.get(this.rlageVst).beschreib + "</td></tr>";
        r += "<tr><td>Schilder:</td><td>" + this.hasSekObj + "</td></tr>";
        r += "<tr><td>Quelle:</td><td>" + ((this.quelle!=null)?(quelle.get(this.quelle).beschreib):'') + "</td></tr>";
        r += "</table>"
        return r;
    }

    /**
     * 
     * @param {*} ereignisraum 
     * @param {*} daten 
     */
    static loadER(daten) {
        Aufstellvorrichtung.loadKlartexte();
        PublicWFS.doQuery('Otaufstvor', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></Filter>', Aufstellvorrichtung._loadER_Callback, undefined, daten);

    }

    static _loadER_Callback(xml, daten) {
        let aufstell = xml.getElementsByTagName("Otaufstvor");
        for (let auf of aufstell) {
            let f = Aufstellvorrichtung.fromXML(auf, daten);
            daten.l_aufstell.getSource().addFeature(f);
        }
    }

    /**
     * Lädt einen Abschnitt nach
     * @param {Daten} daten 
     * @param {Abschnitt} abschnitt 
     */
    static loadAbschnittER(daten, abschnitt, callback, ...args) {
        //console.log(daten);
        document.body.style.cursor = 'wait';
        PublicWFS.doQuery('Otaufstvor', '<Filter>' +
            '<And><PropertyIsEqualTo><PropertyName>abschnittId</PropertyName>' +
            '<Literal>' + abschnitt.abschnittid + '</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + daten.ereignisraum + '</Literal></PropertyIsEqualTo></And></Filter>', Aufstellvorrichtung._loadAbschnittER_Callback, undefined, daten, callback, ...args);
    }

    static _loadAbschnittER_Callback(xml, daten, callback, ...args) {
        //console.log(daten);
        let aufstell = xml.getElementsByTagName("Otaufstvor");
        for (let auf of aufstell) {
            let f = Aufstellvorrichtung.fromXML(auf, daten);
            daten.l_aufstell.getSource().addFeature(f);
        }
        callback(...args)
        document.body.style.cursor = ''
    }

    static fromXML(xml, daten) {
        //console.log(daten);
        let r = new Aufstellvorrichtung(daten);
        for (var tag in CONFIG_WFS.AUFSTELL) {
            if (xml.getElementsByTagName(tag).length <= 0) continue;
            if (CONFIG_WFS.AUFSTELL[tag].art == 0) {
                // Kein Klartext
                r[tag] = xml.getElementsByTagName(tag)[0].firstChild.data;
            } else if (CONFIG_WFS.AUFSTELL[tag].art == 1) {
                // Kein Klartext
                r[tag] = Number(xml.getElementsByTagName(tag)[0].firstChild.data);
            } else if (CONFIG_WFS.AUFSTELL[tag].art == 2) {
                // Klartext, xlink wird gespeichert
                r[tag] = xml.getElementsByTagName(tag)[0].getAttribute('xlink:href');
            }
        }

        let koords = xml.getElementsByTagName('gml:coordinates')[0].firstChild.data.split(',');
        r.setGeometry(new Point(koords));
        r.abschnitt = daten.getAbschnitt(r.abschnittId);
        r.abschnitt.inER['Otaufstvor'] = true;
        daten.l_achse.changed();
        return r;
    }

    static createLayer(map) {
        let source = new VectorSource({
            features: []
        });
        let layer = new VectorLayer({
            source: source,
            opacity: 0.7,
        });
        layer.setStyle(function (feature, zoom) {
            return new Style({
                image: new Circle({
                    radius: 3,
                    fill: new Fill({ color: 'black' }),
                    stroke: new Stroke({
                        color: 'rgba(250,120,0,0.8)', width: 3
                    })
                }),
                text: new Text({
                    font: '13px Calibri,sans-serif',
                    fill: new Fill({ color: '#000' }),
                    stroke: new Stroke({
                        color: '#fff', width: 2
                    }),
                    offsetX: 9,
                    offsetY: -8,
                    textAlign: 'left',
                    // get the text from the feature - `this` is ol.Feature
                    // and show only under certain resolution
                    text: ((zoom < 0.2)?("" + feature.vst):'')
                }),
            });
        });
        map.addLayer(layer);
        return layer;
    }

    _getText() {
        return "test";
    }

}

module.exports = Aufstellvorrichtung