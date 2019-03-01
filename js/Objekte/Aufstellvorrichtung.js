import PublicWFS from '../PublicWFS.js';
import Klartext from './Klartext.js';
import { Point } from 'ol/geom';
import Feature from 'ol/Feature.js';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill, Circle, Text } from 'ol/style';
import Zeichen from './Zeichen.js';

var CONFIG_WFS = require('../config_wfs.json');


class Aufstellvorrichtung extends Feature {
    constructor(daten) {
        super({ geom: null });
        this._daten = daten;
        this._zeichen = null;
        this.fid = null;
        this.inER = {};

        Aufstellvorrichtung.loadKlartexte(this._daten.klartexte);
    }

    static loadKlartexte(klartexte) {
        klartexte.load('Itaufstvorart', Aufstellvorrichtung._ktArtLoaded, klartexte);
        klartexte.load('Itallglage', Aufstellvorrichtung._ktLageLoaded, klartexte);
        klartexte.load('Itquelle', Aufstellvorrichtung._ktQuelleLoaded, klartexte);
    }

    static _ktArtLoaded(__, klartexte) {
        let arten = klartexte.getAllSorted('Itaufstvorart');
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

    static _ktLageLoaded(__, klartexte) {
        let arten = klartexte.getAllSorted('Itallglage');
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

    static _ktQuelleLoaded(__, klartexte) {
        let arten = klartexte.getAllSorted('Itquelle');
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

    getHTMLInfo(ziel) {
        let kt = this._daten.klartexte;
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
        r += "<tr><td>VNK</td><td>" + this.abschnitt.vnk + "</td></tr>";
        r += "<tr><td>NNK</td><td>" + this.abschnitt.nnk + "</td></tr>";
        r += "<tr><td>VST</td><td>" + this.vst + "</td></tr>";
        if (this.labstbaVst == null) {
            r += "<tr><td>Abstand:</td><td>"
        } else {
            r += "<tr><td>Abst.&nbsp;re.</td><td>"
        }

        if (this.rabstbaVst >= 0.01) r += "R";
        else if (this.rabstbaVst <= 0.01) r += "L";
        else r += "M";
        r += " " + Math.abs(this.rabstbaVst) + '</td></tr>';
        console.log(this.labstbaVst);
        if (this.labstbaVst != null) {
            r += "<tr><td>Abst.&nbsp;li.</td><td>"
            if (this.labstbaVst >= 0.01) r += "R";
            else if (this.labstbaVst <= 0.01) r += "L";
            else r += "M";
            r += " " + Math.abs(this.labstbaVst) + '</td></tr>';
        }

        r += "<tr><td>Art</td><td>" + kt.get('Itaufstvorart', this.art).beschreib + "</td></tr>";
        r += "<tr><td>Lage</td><td>" + kt.get('Itallglage', this.rlageVst).beschreib + "</td></tr>";
        r += "<tr><td>Schilder</td><td>" + this.hasSekObj + "</td></tr>";
        r += "<tr><td>Quelle</td><td>" + ((this.quelle != null) ? (kt.get("Itquelle", this.quelle).beschreib) : '') + "</td></tr>";
        r += "</table>"

        if (ziel != undefined) {
            ziel.innerHTML = r;
            this.getZeichen(Aufstellvorrichtung._vz_addHTML, this, ziel)
        }

        return r;
    }

    static _vz_addHTML(zeichen, _this, ziel) {
        let div = document.createElement('div');
        div.style.marginTop = '5px';
        for (let eintrag of zeichen) {
            let img = document.createElement("img");
            img.style.height = "30px";
            img.src = "http://gv-srv-w00118:8080/schilder/" + _this._daten.klartexte.get("Itvzstvoznr", eintrag.stvoznr)['kt'] + ".svg";
            img.title = _this._daten.klartexte.get("Itvzstvoznr", eintrag.stvoznr)['beschreib'] + ((eintrag.vztext != null) ? ("\n" + eintrag.vztext) : (''))
            div.appendChild(img);
        }
        ziel.appendChild(div);
    }


    /**
     * 
     * @param {*} ereignisraum 
     * @param {*} daten 
     */
    static loadER(daten) {
        Aufstellvorrichtung.loadKlartexte(daten.klartexte);
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
        r.fid = xml.getAttribute('fid');
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
                        color: (feature.hasSekObj > 0) ? ('rgba(250,120,0,0.8)') : ('rgba(255,0,0,0.8)'),
                        width: 3
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
                    text: ((zoom < 0.2) ? ("" + feature.vst) : '')
                }),
            });
        });
        map.addLayer(layer);
        return layer;
    }

    _getText() {
        return "test";
    }

    updateStation(station, abstand) {
        this.vabstVst = Math.round(abstand * 10) / 10;
        this.vabstBst = this.vabstVst;
        this.rabstbaVst = this.vabstVst;
        this.vst = Math.round(station);
        this.bst = this.vst;
        let xml = '<wfs:Update typeName="Otaufstvor">\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>vabstVst</wfs:Name>\n' +
            '		<wfs:Value>' + this.vabstVst + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>vabstBst</wfs:Name>\n' +
            '		<wfs:Value>' + this.vabstBst + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>rabstbaVst</wfs:Name>\n' +
            '		<wfs:Value>' + this.rabstbaVst + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>vst</wfs:Name>\n' +
            '		<wfs:Value>' + this.vst + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>bst</wfs:Name>\n' +
            '		<wfs:Value>' + this.bst + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<ogc:Filter>\n' +
            '		<ogc:And>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>objektId</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.objektId + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.projekt + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '		</ogc:And>\n' +
            '	</ogc:Filter>\n' +
            '</wfs:Update>';
        PublicWFS.doTransaction(xml);
    }


    getZeichen(callback, ...args) {
        console.log(callback);
        if (this._zeichen == null && this.hasSekObj > 0) {
            PublicWFS.doQuery('Otvzeichlp', '<Filter>\n' +
                '  <PropertyIsEqualTo>\n' +
                '    <PropertyName>parent/@xlink:href</PropertyName>\n' +
                '    <Literal>' + this.fid + '</Literal>\n' +
                '  </PropertyIsEqualTo>\n' +
                '</Filter>', this._parseZeichen, undefined, this, callback, ...args);
        } else if (this.hasSekObj > 0) {
            if (callback != undefined) {
                callback(this._zeichen, ...args);
            }
        }
    }

    _parseZeichen(xml, _this, callback, ...args) {
        let zeichen = [];
        console.log(xml);
        let zeichenXML = xml.getElementsByTagName('Otvzeichlp');

        for (let eintrag of zeichenXML) {
            console.log(eintrag);
            if (!eintrag.getElementsByTagName("enr").length > 0) {
                zeichen.push(Zeichen.fromXML(eintrag, _this._daten));
            }
        }
        _this._zeichen = zeichen;
        console.log(callback);
        if (callback != undefined) {
            callback(_this._zeichen, ...args);
        }
    }

}

module.exports = Aufstellvorrichtung