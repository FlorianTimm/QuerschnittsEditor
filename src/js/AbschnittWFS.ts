var CONFIG = require('./config.json');
import PublicWFS from './PublicWFS';
import { Extent } from 'ol/extent';

/**
 * Schnittstelle zur eigenen Geometrie-Schnittstelle
 * @author Florian Timm, LGV HH 
 * @version 2019.06.06
 * @copyright MIT
 */
export default class AbschnittWFS {

    static getById(id: string,
        callbackSuccess?: (xml: XMLDocument, ...args: any[]) => void,
        callbackFailed?: (xml: XMLDocument, ...args: any[]) => void,
        ...args: any[]) {

        let param = '?ABSCHNITTID=' + id;
        AbschnittWFS._makeRequest(param, callbackSuccess, callbackFailed, ...args)
    }

    static getByStrName(name: string,
        callbackSuccess?: (xml: XMLDocument, ...args: any[]) => void,
        callbackFailed?: (xml: XMLDocument, ...args: any[]) => void,
        ...args: any[]) {

        let param = '?STRNAME=' + encodeURIComponent(name);
        AbschnittWFS._makeRequest(param, callbackSuccess, callbackFailed, ...args)
    }

    static getByWegenummer(klasse: string, nummer: string, buchstabe: string,
        callbackSuccess?: (xml: XMLDocument, ...args: any[]) => void,
        callbackFailed?: (xml: XMLDocument, ...args: any[]) => void,
        ...args: any[]) {

        let param = '?KLASSE=' + klasse + '&NR=' + nummer + '&BUCHSTABE=' + buchstabe;
        AbschnittWFS._makeRequest(param, callbackSuccess, callbackFailed, ...args)
    }

    static getByVNKNNK(vnk: string, nnk: string,
        callbackSuccess?: (xml: XMLDocument, ...args: any[]) => void,
        callbackFailed?: (xml: XMLDocument, ...args: any[]) => void,
        ...args: any[]) {

        let param = '?VNK=' + vnk + '&NNK=' + nnk;
        AbschnittWFS._makeRequest(param, callbackSuccess, callbackFailed, ...args)
    }

    static getByExtent(extent: Extent,
        callbackSuccess?: (xml: XMLDocument, ...args: any[]) => void,
        callbackFailed?: (xml: XMLDocument, ...args: any[]) => void,
        ...args: any[]) {

        let param = '?BBOX=' + extent.join(',');
        AbschnittWFS._makeRequest(param, callbackSuccess, callbackFailed, ...args)
    }

    static _makeRequest(param: string,
        callbackSuccess?: (xml: XMLDocument, ...args: any[]) => void,
        callbackFailed?: (xml: XMLDocument, ...args: any[]) => void,
        ...args: any[]) {

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('POST', CONFIG.ABSCHNITT_WFS_URL + param, true);

        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState != 4) return;
            if (callbackSuccess != undefined && xmlhttp.status == 200) {
                callbackSuccess(xmlhttp.responseXML, ...args)
            } else if (xmlhttp.status != 200) {
                if (callbackFailed != undefined)
                    callbackFailed(xmlhttp.responseXML, ...args)
                else
                    PublicWFS.showMessage("Kommunikationsfehler", true);
            }
        }
        xmlhttp.send();
    }
}