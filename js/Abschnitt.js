import Feature from 'ol/Feature.js';
import LineString from 'ol/geom/LineString.js';
import PublicWFS from './PublicWFS';

class Abschnitt extends Feature {

    constructor() {
        super();
        this.fid = null;
        this.abschnittid = null;
        this.geom = null;
        this.vnk = null;
        this.nnk = null;
        this.len = null;
        this.faktor = null;
        this.querschnitte = {};
    }


    static load(abschnittid) {
        
        let xml = PublicWFS.doQueryWait('VI_STRASSENNETZ', '<ogc:Filter>' +
            '<ogc:PropertyIsEqualTo><ogc:PropertyName>ABSCHNITT_ID</ogc:PropertyName><ogc:Literal>' + this.abschnittid + '</ogc:Literal></ogc:PropertyIsEqualTo>' +
            '</ogc:Filter>')
            
        if (xml == null) {
            PublicWFS.showMessage('Fehler beim Laden der Achse'); 
            return null;
        }

        let netz = xml.getElementsByTagName('VI_STRASSENNETZ');

        if (netz.length() > 0) {
            return Abschnitt.fromXML(netz[0]);
        }
        return null;
    }

    static fromXML(xml) {
        let r = new Abschnitt();

        r.fid = xml.getAttribute('fid');
        
        r.len = Number(xml.getElementsByTagName('LEN')[0].firstChild.data);
        r.abschnittid = xml.getElementsByTagName('ABSCHNITT_ID')[0].firstChild.data;
        r.vnk = xml.getElementsByTagName('VNP')[0].firstChild.data;
        r.nnk = xml.getElementsByTagName('NNP')[0].firstChild.data;
        let koords = xml.getElementsByTagName('gml:coordinates')[0].firstChild.data.split(' ');
        let ak = [];

        for (let i = 0; i < koords.length; i++) {
            let k = koords[i].split(',')
            let x = Number(k[0]);
            let y = Number(k[1]);
            ak.push([x, y]);
        }
        r.faktor = l_len(ak) / this.len;
        r.geom = new LineString(ak);

        return r;
    }

    _readData(xmlhttp) {
		if (xmlhttp.responseXML == undefined) {
			PublicWFS.showMessage('Abschnitt nicht gefunden', true);
			return;
		}
        

        
    }
}

module.exports = Abschnitt;