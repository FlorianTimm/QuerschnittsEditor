import Feature from 'ol/Feature.js';
import LineString from 'ol/geom/LineString.js';
import PublicWFS from './PublicWFS';

class Abschnitt extends Feature {

    constructor(abschnittid) {
		super();
        this.abschnittid = abschnittid;
        this.geom = null;
        this.vnk = null;
        this.nnk = null;
        this.len = null;
        this.faktor = null;
        this.querschnitte = {};
        this._loadData();
    }

    _loadData() {
        PublicWFS.doQuery('VI_STRASSENNETZ', '<ogc:Filter>' +
            '<ogc:PropertyIsEqualTo><ogc:PropertyName>ABSCHNITT_ID</ogc:PropertyName><ogc:Literal>' + this.abschnittid + '</ogc:Literal></ogc:PropertyIsEqualTo>' +
            '</ogc:Filter>',this._readData,function() {PublicWFS.showMessage("Fehler beim Laden der Achse")})
    }

    _readData(xmlhttp) {
		if (xmlhttp.responseXML == undefined) {
			PublicWFS.showMessage("Abschnitt nicht gefunden", true);
			return;
		}
        let netz = xmlhttp.responseXML.getElementsByTagName("VI_STRASSENNETZ")

        if (netz.length == 0) return;

        let abschnitt = netz[0];
        this.len = Number(abschnitt.getElementsByTagName("LEN")[0].firstChild.data);
        this.abschnittid = abschnitt.getElementsByTagName("ABSCHNITT_ID")[0].firstChild.data;
        this.vnk = abschnitt.getElementsByTagName("VNP")[0].firstChild.data;
        this.nnk = abschnitt.getElementsByTagName("NNP")[0].firstChild.data;
        let koords = abschnitt.getElementsByTagName("gml:coordinates")[0].firstChild.data.split(" ");
        let ak = [];

        for (let i = 0; i < koords.length; i++) {
            let k = koords[i].split(",")
            let x = Number(k[0]);
            let y = Number(k[1]);
            ak.push([x, y]);
        }
        this.faktor = l_len(ak) / this.len;
        this.geom = new LineString(ak);
    }
}

module.exports = Abschnitt;