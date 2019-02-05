import Feature from 'ol/Feature.js';
import LineString from 'ol/geom/LineString.js';
import PublicWFS from './PublicWFS';
import Vektor from './Vektor.js';

class Abschnitt {

    constructor() {
        this.fid = null;
        this.abschnittid = null;
        this.geom = null;
        this.vnk = null;
        this.nnk = null;
        this.len = null;
        this.faktor = null;
        this._station = {};
        this._feature = new Feature({geom: null, objekt: this});
    }


    static loadFromPublicWFS(abschnittid) {
        let r = new Abschnitt();
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

    static fromXML(xml) {
        let r = new Abschnitt();
        r._fromXML(xml);
        return r;
    }

    _fromXML(xml) {
        this.fid = xml.getAttribute('fid');
        
        this.len = Number(xml.getElementsByTagName('LEN')[0].firstChild.data);
        this.abschnittid = xml.getElementsByTagName('ABSCHNITT_ID')[0].firstChild.data;
        this.vnk = xml.getElementsByTagName('VNP')[0].firstChild.data;
        this.nnk = xml.getElementsByTagName('NNP')[0].firstChild.data;
        let koords = xml.getElementsByTagName('gml:coordinates')[0].firstChild.data.split(' ');
        let ak = [];

        for (let i = 0; i < koords.length; i++) {
            let k = koords[i].split(',')
            let x = Number(k[0]);
            let y = Number(k[1]);
            ak.push([x, y]);
        }
        this._feature.setGeometry(new LineString(ak));
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

    getStation (station) {
        return this._station[station];        
    }

    existsStation(station) {
        return station in this._station;
    }
}

module.exports = Abschnitt;