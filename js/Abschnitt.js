import Feature from 'ol/Feature.js';
import LineString from 'ol/geom/LineString.js';
import PublicWFS from './PublicWFS';

class Abschnitt extends Feature {

    constructor(abschnittid) {
        this.abschnittid = abschnittid;
        this.geom = null;
        this.vnk = null;
        this.nnk = null;
        this.len = null;
        this.faktor = null;
        this.querschnitte = {};
        _loadData();
    }

    _loadData() {
        PublicWFS.doQuery('VI_STRASSENNETZ', '<Filter>' +
            '<PropertyIsEqualTo><PropertyName>ABSCHNITT_ID</PropertyName><Literal>' + this.abschnittid + '</Literal></PropertyIsEqualTo>' +
            '</Filter>',readData,PublicWFS.showMessage("Fehler beim Laden der Achse"))
    }

    _readData(xmlhttp) {
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