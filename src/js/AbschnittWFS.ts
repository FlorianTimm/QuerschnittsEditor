var CONFIG = require('./config.json');
import PublicWFS from './PublicWFS';
import { Extent } from 'ol/interaction';

class AbschnittWFS {

    static getById(id, callbackSuccess, callbackFailed, ...args) {
        let param = '?ABSCHNITTID=' + id;
        AbschnittWFS._makeRequest(param, callbackSuccess, callbackFailed, ...args)
    }

    static getByStrName(name, callbackSuccess, callbackFailed, ...args) {
        let param = '?STRNAME=' + encodeURIComponent(name);
        AbschnittWFS._makeRequest(param, callbackSuccess, callbackFailed, ...args)
    }

    static getByWegenummer(klasse, nummer, buchstabe, callbackSuccess, callbackFailed, ...args) {
        let param = '?KLASSE=' + klasse + '&NR=' + nummer + '&BUCHSTABE=' + buchstabe;
        AbschnittWFS._makeRequest(param, callbackSuccess, callbackFailed, ...args)
    }

    static getByVNKNNK(vnk, nnk, callbackSuccess, callbackFailed, ...args) {
        let param = '?VNK=' + vnk + '&NNK=' + nnk;
        AbschnittWFS._makeRequest(param, callbackSuccess, callbackFailed, ...args)
    }

    static getByExtent(extent, callbackSuccess, callbackFailed, ...args) {
        let param = '?BBOX=' + extent.join(',');
        AbschnittWFS._makeRequest(param, callbackSuccess, callbackFailed, ...args)
    }

    static _makeRequest(param, callbackSuccess, callbackFailed, ...args) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('POST', CONFIG.ABSCHNITT_WFS_URL + param, true);

        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState != 4) return;
            if (xmlhttp.status == 200) {
                callbackSuccess(xmlhttp.responseXML, ...args)
            } else {
                if (callbackFailed != undefined)
                    callbackFailed(xmlhttp.responseXML, ...args)
                else
                    PublicWFS.showMessage("Kommunikationsfehler", true);
            }
        }
        xmlhttp.send();
    }
}

export default AbschnittWFS