var CONFIG = require('./config.json');

class PublicWFS {

    static doSoapRequest(xml, callbackSuccess, callbackFailed, ...args) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('POST', CONFIG.PUBLIC_WFS_URL, true);


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
        xmlhttp.setRequestHeader('Content-Type', 'text/xml');
        xmlhttp.send(xml);
    }

    static addInER(abschnitt, objekt, ereignisraum_nr, callbackSuccess, callbackFailed, ...args) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('POST', CONFIG.ER_WFS_URL, true);

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
        xmlhttp.setRequestHeader('Content-Type', 'text/xml');
        xmlhttp.send('<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" \n' +
            'xmlns:pub="http://ttsib.novasib.de/PublicServices" xmlns:int="http://interfaceTypes.ttsib5.novasib.de/">\n' +
            '<soapenv:Header/>\n' +
            '<soapenv:Body>\n' +
            '     <pub:expandProjektAbsObj>\n' +
            '            <projekt>\n' +
            '                   <int:ProjektNr>' + ereignisraum_nr + '</int:ProjektNr>\n' +
            '            </projekt>\n' +
            '            <abschnitte>\n' +
            '                   <int:vonKartenblatt>' + abschnitt.vtknr + '</int:vonKartenblatt>\n' +
            '                   <int:vonNkLfd>' + abschnitt.vnklfd + '</int:vonNkLfd>\n' +
            '                   <int:vonZusatz>' + abschnitt.vzusatz + '</int:vonZusatz>\n' +
            '                   <int:nachKartenblatt>' + abschnitt.ntknr + '</int:nachKartenblatt>\n' +
            '                   <int:nachNkLfd>' + abschnitt.nnklfd + '</int:nachNkLfd>\n' +
            '                   <int:nachZusatz>' + abschnitt.nzusatz + '</int:nachZusatz>\n' +
            '            </abschnitte>\n' +
            '            <objektKlassen>\n' +
            '                   <int:objektKlasse>' + objekt + '</int:objektKlasse>\n' +
            '            </objektKlassen>\n' +
            '     </pub:expandProjektAbsObj>\n' +
            '</soapenv:Body>\n' +
            '</soapenv:Envelope>');
    }

    static doTransaction(transaction, callbackSuccess, callbackFailed, ...args) {
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
        return PublicWFS.doSoapRequest(xml, this._checkTransacktionSuccess, this._checkTransacktionFailed,
            callbackSuccess, callbackFailed, ...args)
    }

    static _checkTransacktionSuccess(xml, callbackSuccess, callbackFailed, ...args) {
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

    static _checkTransacktionFailed(xml, callbackSuccess, callbackFailed, ...args) {
        callbackFailed(xml, ...args);
    }

    static doQuery(klasse, filter, callbackSuccess, callbackFailed, ...args) {
        var xml = '<?xml version="1.0" encoding="ISO-8859-1"?>' +
            '<wfs:GetFeature xmlns="http://xml.novasib.de" ' +
            'xmlns:wfs="http://www.opengis.net/wfs" ' +
            'xmlns:gml="http://www.opengis.net/gml" ' +
            'xmlns:ogc="http://www.opengis.net/ogc" ' +
            'xmlns:xlink="http://www.w3.org/1999/xlink" ' +
            'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" service="WFS" version="1.0.0" ' +
            'xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-transaction.xsd">' +
            '<wfs:Query typeName="' + klasse + '">' +
            filter +
            '</wfs:Query>' +
            '</wfs:GetFeature>';
        return PublicWFS.doSoapRequest(xml, callbackSuccess, callbackFailed, ...args)
    }

    static showMessage(text, error) {
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

module.exports = PublicWFS;