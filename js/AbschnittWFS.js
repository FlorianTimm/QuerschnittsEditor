var CONFIG = require('./config.json');
import PublicWFS from './PublicWFS.js';
import { Extent } from 'ol/interaction';

class AbschnittWFS {

    static getById(id, callbackSuccess, callbackFailed, ...args) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('POST', CONFIG.ABSCHNITT_WFS_URL + '?ABSCHNITTID=' + id, true);

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

    static getByExtent(extent, callbackSuccess, callbackFailed, ...args) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('POST', CONFIG.ABSCHNITT_WFS_URL + '?BBOX=' + extent.join(','), true);

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

module.exports = AbschnittWFS