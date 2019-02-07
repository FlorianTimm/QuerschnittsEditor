import PublicWFS from '../PublicWFS.js';
import Klartext from './Klartext.js';
import {  Point } from 'ol/geom';
import Feature from 'ol/Feature.js';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill, Circle } from 'ol/style';

var CONFIG_WFS = require('../config_wfs.json');

var art = null;

class Aufstellvorrichtung extends Feature {
    constructor () {
        super({geom:null});
        //this.daten = daten;
        if (art == null) art = new Klartext('Itaufstvorart', 'art');
    }

    getHTMLInfo() {
        let r = "<table>";
        for (var tag in CONFIG_WFS.AUFSTELL) {
            if (this[tag] == null || this[tag] == undefined) continue;

            r += "<tr><td>" + tag + "</td><td>";
            if (tag == 'art') {
                r += art.get(this[tag]).beschreib
            } else {
                r += this[tag];
            }
            r += "</td></tr>";
        }
        r += "</table>"
        return r;
    }


    static loadAbschnittER(ereignisraum, layer) {
        PublicWFS.doQuery('Otaufstvor', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>projekt/@xlink:href</PropertyName>' +
            '<Literal>' + ereignisraum + '</Literal></PropertyIsEqualTo></Filter>', Aufstellvorrichtung._loadER_Callback, undefined, layer);

    }

    static _loadER_Callback(xml, layer) {
        let aufstell = xml.getElementsByTagName("Otaufstvor");
        for (let auf of aufstell) {
            let f = Aufstellvorrichtung.fromXML(auf);
            layer.getSource().addFeature(f);
        }
    }

    static fromXML (xml) {
        let r = new Aufstellvorrichtung();
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
        return r;
    }
    
    static createLayer(map) {
        let source = new VectorSource({
            features: []
        });
        let layer = new VectorLayer({
            source: source,
            opacity: 0.6,
            style: new Style({
                image: new Circle({
                    radius: 3,
                    fill: new Fill({ color: 'black' }),
                    stroke: new Stroke({
                        color: [255, 0, 0], width: 2
                    })
                }),
            })
        });
        map.addLayer(layer);
        return layer;
    }
    
}

module.exports = Aufstellvorrichtung