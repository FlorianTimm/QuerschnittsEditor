import PUBLIC_WFS_URL from './Config.js';

class PublicWFS {
    doSoapRequest(xml, callbackSuccess, callbackFailed, ...args) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('POST', PUBLIC_WFS_URL, true);
    
        
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState != 4) return;
            if (xmlhttp.status == 200) {
                callbackSuccess(xmlhttp.responseXML, ...args)
            } else {
                callbackFailed(xmlhttp.responseXML, ...args)
            }
        }
        xmlhttp.setRequestHeader('Content-Type', 'text/xml');
        xmlhttp.send(xml);
    }
    
    doTransaction(transaction, callbackSuccess, callbackFailed, ...args) {
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
        return xml_db_request(xml, _checkTransacktionSuccess, _checkTransacktionFailed, 
            callbackSuccess, callbackFailed, ...args)
    }

    _checkTransacktionSuccess (xml, callbackSuccess, callbackFailed, ...args) {
        if (xml.getElementsByTagName("SUCCESS").length > 0) {
            callbackSuccess(xml, ...args);
        } else {
            callbackFailed(xml, ...args);
        }
    }

    _checkTransacktionFailed (xml, callbackSuccess, callbackFailed, ...args) {
        callbackFailed(xml, ...args);
    }

    doQuery(klasse, filter, callbackSuccess, callbackFailed, ...args) {
        var xml = '<?xml version="1.0" encoding="ISO-8859-1"?>' +
            '<wfs:GetFeature xmlns:ns="http://xml.novasib.de" ' +
            'xmlns:wfs="http://www.opengis.net/wfs" ' +
            'xmlns:gml="http://www.opengis.net/gml" ' +
            'xmlns="http://www.opengis.net/ogc" ' +
            'xmlns:xlink="http://www.w3.org/1999/xlink" ' +
            'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" service="WFS" version="1.0.0" ' +
            'xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-transaction.xsd">' +
            '<wfs:Query typeName="' + klasse + '">' +
            filter
            '</wfs:Query>' +
            '</wfs:GetFeature>';
        return doSoapRequest(xml, callbackSuccess, callbackFailed, ...args)
    }
    
    showMessage(text, error) {
        let m = document.createElement("div");
        m.className = 'nachricht';
        m.innerHTML = text;
        document.body.append(m);

        let ausblenden = function () {
            m.style.display = 'none';
            m.remove();
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