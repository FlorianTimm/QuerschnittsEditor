import Abschnitt from './Objekte/Abschnitt'
import PrimaerObjekt from './Objekte/prototypes/PrimaerObjekt';
import WaitBlocker from './WaitBlocker';
import Objekt from './Objekte/prototypes/Objekt';
import SekundaerObjekt from './Objekte/prototypes/SekundaerObjekt';
var CONFIG = require('./config.json');


/**
 * Schnittstelle zum PublicWFS
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */

type xmlCallback = (xml: Document, ...args: any[]) => void


export default class PublicWFS {
    private static doSoapRequestWFS(
        xml: string,
        callbackSuccess: xmlCallback,
        callbackFailed: xmlCallback,
        ...args: any[]) {
        PublicWFS.doSoapRequest(CONFIG.PUBLIC_WFS_URL, xml, callbackSuccess, callbackFailed, ...args);
    }

    private static doSoapRequestERWFS(
        xml: string,
        callbackSuccess: xmlCallback,
        callbackFailed: xmlCallback,
        ...args: any[]) {
        PublicWFS.doSoapRequest(CONFIG.ER_WFS_URL, xml, callbackSuccess, callbackFailed, ...args);
    }

    private static doSoapRequest(url: string, xml: string, callbackSuccess: xmlCallback, callbackFailed: xmlCallback, ...args: any[]) {
        WaitBlocker.warteAdd();
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('POST', url, true);
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState != 4)
                return;
            WaitBlocker.warteSub();
            if (xmlhttp.status == 200) {
                callbackSuccess(xmlhttp.responseXML, ...args);
            }
            else {
                if (callbackFailed != undefined)
                    callbackFailed(xmlhttp.responseXML, ...args);
                else
                    PublicWFS.showMessage("Kommunikationsfehler", true);
            }
        };
        xmlhttp.setRequestHeader('Content-Type', 'text/xml');
        //xmlhttp.setRequestHeader('Content-Type', 'text/xml; charset=ISO-8859-1');
        xmlhttp.send(xml);
    }

    private static doGetRequest(
        url_param: string,
        callbackSuccess?: xmlCallback,
        callbackFailed?: xmlCallback,
        ...args: any[]) {
        WaitBlocker.warteAdd()
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('GET', CONFIG.PUBLIC_WFS_URL + '?' + url_param, true);

        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState != 4) return;
            if (xmlhttp.status == 200 && callbackSuccess != undefined) {
                WaitBlocker.warteSub()
                callbackSuccess(xmlhttp.responseXML, ...args)
            } else if (xmlhttp.status != 200) {
                WaitBlocker.warteSub()
                if (callbackFailed != undefined)
                    callbackFailed(xmlhttp.responseXML, ...args)
                else
                    PublicWFS.showMessage("Kommunikationsfehler", true);
            }
        }
        xmlhttp.send();
    }

    static addInER(
        abschnitt: Abschnitt,
        objekt: string, ereignisraum_nr: string,
        callbackSuccess?: xmlCallback,
        callbackFailed?: xmlCallback,
        ...args: any[]) {

        let xml = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" \n' +
            'xmlns:pub="http://ttsib.novasib.de/PublicServices" xmlns:int="http://interfaceTypes.ttsib5.novasib.de/">\n' +
            '<soapenv:Header/>\n' +
            '<soapenv:Body>\n' +
            '     <pub:expandProjektAbsObj>\n' +
            '            <projekt>\n' +
            '                   <int:ProjektNr>' + ereignisraum_nr + '</int:ProjektNr>\n' +
            '            </projekt>\n' +
            '            <abschnitte>\n' +
            '                   <int:vonKartenblatt>' + abschnitt.getVtknr() + '</int:vonKartenblatt>\n' +
            '                   <int:vonNkLfd>' + abschnitt.getVnklfd() + '</int:vonNkLfd>\n' +
            '                   <int:vonZusatz>' + abschnitt.getVzusatz() + '</int:vonZusatz>\n' +
            '                   <int:nachKartenblatt>' + abschnitt.getNtknr() + '</int:nachKartenblatt>\n' +
            '                   <int:nachNkLfd>' + abschnitt.getNnklfd() + '</int:nachNkLfd>\n' +
            '                   <int:nachZusatz>' + abschnitt.getNzusatz() + '</int:nachZusatz>\n' +
            '            </abschnitte>\n' +
            '            <objektKlassen>\n' +
            '                   <int:objektKlasse>' + objekt + '</int:objektKlasse>\n' +
            '            </objektKlassen>\n' +
            '     </pub:expandProjektAbsObj>\n' +
            '</soapenv:Body>\n' +
            '</soapenv:Envelope>'
        PublicWFS.doSoapRequestERWFS(xml, function (xml, abschnitt, objekt, callbackSuccess, __, ...args) {
            abschnitt.addOKinER(objekt);
            if (callbackSuccess != undefined) {
                callbackSuccess(xml, ...args)
            } else {
                PublicWFS.showMessage("Objekt in ER kopiert");
            }
        }, function (xml, _, __, ___, callbackFailed, ...args) {
            if (callbackFailed != undefined)
                callbackFailed(xml, ...args)
            else
                PublicWFS.showMessage("Objekt konnte nicht in ER kopiert werden", true);
        }, abschnitt, objekt, callbackSuccess, callbackFailed, ...args)
    }

    static addSekInER(objektPrim: PrimaerObjekt, objektTypePrim: string, objekt: string, ereignisraum_nr: string,
        callbackSuccess: (xml: XMLDocument, ...args: any[]) => void, callbackFailed: (xml: XMLDocument, ...args: any[]) => void, ...args: any[]) {

        let xml = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" \n' +
            'xmlns:pub="http://ttsib.novasib.de/PublicServices" xmlns:int="http://interfaceTypes.ttsib5.novasib.de/">\n' +
            '<soapenv:Header/>\n' +
            '<soapenv:Body>\n' +
            '     <pub:expandProjektPrimObj>\n' +
            '            <projekt>\n' +
            '                   <int:ProjektNr>' + ereignisraum_nr + '</int:ProjektNr>\n' +
            '            </projekt>\n' +
            '            <primObjekte>\n' +
            '                   <int:objektId>' + objektPrim.getObjektId() + '</int:objektId>\n' +
            '                   <int:objektKlasse>' + objektTypePrim + '</int:objektKlasse>\n' +
            '            </primObjekte>\n' +
            '            <objektKlassen>\n' +
            '                   <int:objektKlasse>' + objekt + '</int:objektKlasse>\n' +
            '            </objektKlassen>\n' +
            '     </pub:expandProjektPrimObj>\n' +
            '</soapenv:Body>\n' +
            '</soapenv:Envelope>'
        PublicWFS.doSoapRequestERWFS(xml, function (xml, objektPrim: Objekt, objektSek: string, callbackSuccess, __, ...args) {
            console.log(objektPrim)
            objektPrim.addSekOKinER(objektSek);
            if (callbackSuccess != undefined) {
                callbackSuccess(xml, ...args)
            } else {
                PublicWFS.showMessage("Objekt in ER kopiert");
            }
        }, function (xml, _, __, ___, callbackFailed, ...args) {
            if (callbackFailed != undefined)
                callbackFailed(xml, ...args)
            else
                PublicWFS.showMessage("Objekt konnte nicht in ER kopiert werden", true);
        }, objektPrim, objekt, callbackSuccess, callbackFailed, ...args)
    }

    static doTransaction(transaction: string,
        callbackSuccess?: xmlCallback,
        callbackFailed?: xmlCallback, ...args: any[]) {

        var xml =
            '<?xml version="1.0" encoding="ISO-8859-1"?>' +
            '<wfs:Transaction service="WFS" version="1.0.0"' +
            '		xmlns="http://xml.novasib.de"' +
            '		xmlns:wfs="http://www.opengis.net/wfs" ' +
            '		xmlns:gml="http://www.opengis.net/gml" ' +
            '		xmlns:ogc="http://www.opengis.net/ogc" ' +
            '		xmlns:xlink="http://www.w3.org/1999/xlink" ' +
            '		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
            '		xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-transaction.xsd">' +
            transaction +
            '</wfs:Transaction>';
        return PublicWFS.doSoapRequestWFS(xml, this._checkTransacktionSuccess, this._checkTransacktionFailed,
            callbackSuccess, callbackFailed, ...args)
    }

    private static _checkTransacktionSuccess(xml: Document,
        callbackSuccess?: (xml: XMLDocument, ...args: any[]) => void,
        callbackFailed?: (xml: XMLDocument, ...args: any[]) => void,
        ...args: any[]) {

        if (xml.getElementsByTagName('SUCCESS').length > 0) {
            if (callbackSuccess != undefined)
                callbackSuccess(xml, ...args);
            else
                PublicWFS.showMessage("Erfolgreich");
        } else {
            if (callbackFailed != undefined)
                callbackFailed(xml, ...args);
            else
                PublicWFS.showMessage("Konnte nicht gespeichert werden", true);
        }
    }

    private static _checkTransacktionFailed(xml: XMLDocument,
        __?: (xml: XMLDocument, ...args: any[]) => void,
        callbackFailed?: (xml: XMLDocument, ...args: any[]) => void,
        ...args: any[]) {

        callbackFailed(xml, ...args);
    }

    public static doQuery(klasse: string, filter: string,
        callbackSuccess?: (xml: XMLDocument, ...args: any[]) => void,
        callbackFailed?: (xml: XMLDocument, ...args: any[]) => void,
        ...args: any[]) {
        let url_param = "Request=GetFeature&TYPENAME=" + klasse + "&MPP=0&filter=" + encodeURIComponent(filter);
        return PublicWFS.doGetRequest(url_param, callbackSuccess, callbackFailed, ...args);
    }


    public static testER(
        ereignisraum_nr: string,
        callback?: (success: boolean, errorListe?: Element[], ...args: any[]) => void,
        ...args: any[]) {

        let xml = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" \n' +
            'xmlns:pub="http://ttsib.novasib.de/PublicServices" xmlns:int="http://interfaceTypes.ttsib5.novasib.de/">\n' +
            '<soapenv:Header/>\n' +
            '<soapenv:Body>\n' +
            '     <pub:testProjekt>\n' +
            '            <projekt>\n' +
            '                   <int:ProjektNr>' + ereignisraum_nr + '</int:ProjektNr>\n' +
            '            </projekt>\n' +
            '     </pub:testProjekt>\n' +
            '</soapenv:Body>\n' +
            '</soapenv:Envelope>'
        PublicWFS.doSoapRequestERWFS(xml, PublicWFS.testErCallback, undefined, ereignisraum_nr, callback, ...args)
    }

    private static testErCallback(xmlResponse: XMLDocument, ereignisraum_nr: string, callback?: (success: boolean, errorListe?: Element[], ...args: any[]) => void, ...args: any[]) {
        let success = xmlResponse.getElementsByTagName("testSuccess");
        if (!success || success.length == 0) {
            PublicWFS.showMessage("Fehler beim Prüfen", true);
            return;
        }

        if (success.item(0).innerHTML != "false") {
            if (callback) {
                callback(true, ...args)
            } else {
                PublicWFS.showMessage("Erfolgreich geprüft");
            }
            return;
        }

        if (!callback) return;

        let xml = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" \n' +
            'xmlns:pub="http://ttsib.novasib.de/PublicServices" xmlns:int="http://interfaceTypes.ttsib5.novasib.de/">\n' +
            '<soapenv:Header/>\n' +
            '<soapenv:Body>\n' +
            '     <pub:queryTestresult>\n' +
            '            <projekt>\n' +
            '                   <int:ProjektNr>' + ereignisraum_nr + '</int:ProjektNr>\n' +
            '            </projekt>\n' +
            '     </pub:queryTestresult>\n' +
            '</soapenv:Body>\n' +
            '</soapenv:Envelope>'
        PublicWFS.doSoapRequestERWFS(xml, PublicWFS.testErCallback2, undefined, callback, ...args)
    }

    private static testErCallback2(xmlResponse: XMLDocument, callback: (success: boolean, errorListe?: Element[], ...args: any[]) => void, ...args: any[]) {
        let results = xmlResponse.getElementsByTagName("testResult");
        if (!results || results.length == 0) {
            PublicWFS.showMessage("Fehler beim Prüfen", true);
            return;
        }
        if (callback) {
            callback(false, Array.from(results), ...args);
        }
    }

    public static anlegenER(
        kurzBez: string, langBez: string, autoER: boolean = false,
        callbackSuccess?: xmlCallback,
        callbackFailed?: xmlCallback,
        ...args: any[]) {

        let xml = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" \n' +
            'xmlns:pub="http://ttsib.novasib.de/PublicServices" xmlns:int="http://interfaceTypes.ttsib5.novasib.de/">\n' +
            '<soapenv:Header/>\n' +
            '<soapenv:Body>\n' +
            '  <pub:createProjekt>\n' +
            '    <kurzBez>' + kurzBez + '</kurzBez>\n' +
            '    <langBez>' + langBez + '</langBez>\n' +
            '    <eKat>D</eKat>\n' +
            '    <autoER>' + autoER + '</autoER>\n' +
            '  </pub:createProjekt>\n' +
            '</soapenv:Body>\n' +
            '</soapenv:Envelope>'
        PublicWFS.doSoapRequestERWFS(xml, callbackSuccess, callbackFailed, ...args)
    }

    public static showMessage(text: string, error: boolean = false) {
        let m = document.createElement('div');
        m.className = 'nachricht';
        m.innerHTML = text;
        document.body.appendChild(m);

        let ausblenden = function () {
            m.style.display = 'none';
            document.body.removeChild(m);
        }

        if (error) {
            m.style.backgroundColor = 'rgba(255,100,100,0.8)';
            window.setTimeout(ausblenden, 3000);
        } else {
            m.style.backgroundColor = 'rgba(100, 200,100,0.8)';
            window.setTimeout(ausblenden, 5000);
        }
        m.style.display = 'block';
    }
}