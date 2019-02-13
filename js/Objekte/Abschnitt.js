import Feature from 'ol/Feature.js';
import LineString from 'ol/geom/LineString.js';
import PublicWFS from '../PublicWFS.js';
import AbschnittWFS from '../AbschnittWFS.js';
import Vektor from '../Vektor.js';

var CONFIG = require('../config.json');

class Abschnitt extends Feature {
    constructor(daten) {
        super();
        this.daten = daten;
        this.fid = null;
        this.abschnittid = null;
        this.vnk = null;
        this.nnk = null;
        this.len = null;
        this._faktor = null;
        this._station = {};
        this._aufstell = {};
        this.inER = {};
    }

    getFaktor() {
        if (this._faktor == null)
            this._faktor = this.len / Vektor.line_len(this.getGeometry().getCoordinates());
        return this._faktor;
    }

    static load(daten, abschnittid) {
        if ("ABSCHNITT_WFS_URL" in CONFIG) {
            return Abschnitt.loadFromAbschnittWFS(daten, abschnittid);
        } else {
            return Abschnitt.loadFromPublicWFS(daten, abschnittid);
        }
    }

    static loadFromAbschnittWFS(daten, abschnittid) {
        let r = new Abschnitt(daten);
        r.abschnittid = abschnittid;
        AbschnittWFS.getById(abschnittid, r._loadCallback, undefined, r);
        return r;
    }

    static loadFromPublicWFS(daten, abschnittid) {
        let r = new Abschnitt(daten);
        r.abschnittid = abschnittid;

        PublicWFS.doQuery('VI_STRASSENNETZ', '<ogc:Filter>' +
            '<ogc:PropertyIsEqualTo><ogc:PropertyName>ABSCHNITT_ID</ogc:PropertyName>' +
            '<ogc:Literal>' + r.abschnittid + '</ogc:Literal></ogc:PropertyIsEqualTo>' +
            '</ogc:Filter>', r._loadCallback, undefined, r);

        return r;
    }

    _loadCallback(xml, _this) {
        let netz = xml.getElementsByTagName('VI_STRASSENNETZ');

        if (netz.length > 0) {
            _this._fromXML(netz[0]);
        }
    }

    static fromXML(daten, xml) {
        //console.log(xml);
        let r = new Abschnitt(daten);
        r._fromXML(xml);
        return r;
    }

    _fromXML(xml) {
        //console.log(xml)

        this.len = Number(xml.getElementsByTagName('LEN')[0].firstChild.data);
        this.abschnittid = xml.getElementsByTagName('ABSCHNITT_ID')[0].firstChild.data;
        this.fid = "S" + this.abschnittid;
        this.vnk = xml.getElementsByTagName('VNP')[0].firstChild.data;
        this.nnk = xml.getElementsByTagName('NNP')[0].firstChild.data;
        this.vtknr = this.vnk.substring(0, 4);
        this.vnklfd = Number(this.vnk.substring(4, 9));
        this.vzusatz = this.vnk.substring(9, 10);
        this.ntknr = this.nnk.substring(0, 4);
        this.nnklfd = Number(this.nnk.substring(4, 9));
        this.nzusatz = this.nnk.substring(9, 10);
        let koords = xml.getElementsByTagName('gml:coordinates')[0].firstChild.data.trim().split(' ');
        let ak = [];

        for (let i = 0; i < koords.length; i++) {
            let k = koords[i].split(',')
            let x = Number(k[0]);
            let y = Number(k[1]);
            ak.push([x, y]);
        }
        //console.log(ak);
        this.setGeometry(new LineString(ak));
    }

    _readData(xmlhttp) {
        if (xmlhttp.responseXML == undefined) {
            PublicWFS.showMessage('Abschnitt nicht gefunden', true);
            return;
        }
    }

    getFeature() {
        return this._feature;
    }

    addStation(station) {
        this._station[station.vst] = station;
    }

    getStation(station) {
        return this._station[station];
    }

    existsStation(station) {
        return station in this._station;
    }

    getStationByStation(station) {
        let r = null;
        for (var a in this._station) {
            if (a > station) break;
            r = this._station[a];
        }
        return r;
    }
}

module.exports = Abschnitt;