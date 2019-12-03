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
    private static doSoapRequestWFS(xml: string): Promise<Document> {
        return PublicWFS.doSoapRequest(CONFIG.PUBLIC_WFS_URL, xml);
    }

    private static doSoapRequestERWFS(xml: string): Promise<Document> {
        return PublicWFS.doSoapRequest(CONFIG.ER_WFS_URL, xml);
    }

    private static doSoapRequest(url: string, xml: string): Promise<Document> {
        return new Promise(function (resolve, reject) {
            WaitBlocker.warteAdd();
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open('POST', url, true);
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState != 4)
                    return;
                WaitBlocker.warteSub();
                if (xmlhttp.status == 200) {
                    resolve(xmlhttp.responseXML);
                }
                else {
                    reject(Error("Kommunikationsfehler"))
                }
            };
            xmlhttp.setRequestHeader('Content-Type', 'text/xml');
            //xmlhttp.setRequestHeader('Content-Type', 'text/xml; charset=ISO-8859-1');
            xmlhttp.send(xml);
        })
    }

    private static doGetRequest(url_param: string): Promise<Document> {
        return new Promise(function (resolve, reject) {
            WaitBlocker.warteAdd()
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open('GET', CONFIG.PUBLIC_WFS_URL + '?' + url_param, true);

            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState != 4) return;
                if (xmlhttp.status == 200) {
                    WaitBlocker.warteSub()
                    resolve(xmlhttp.responseXML)
                } else if (xmlhttp.status != 200) {
                    WaitBlocker.warteSub()
                    reject(xmlhttp.responseXML)
                }
            }
            xmlhttp.onerror = function () {
                reject(Error("Network Error"));
            };
            xmlhttp.send();
        });
    }

    static addInER(abschnitt: Abschnitt, objekt: string, ereignisraum_nr: string) {
        return new Promise(function (resolve, reject) {
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
            PublicWFS.doSoapRequestERWFS(xml).then((xml: Document) => {
                abschnitt.addOKinER(objekt);
                resolve(xml)
            }).catch((xml: Document) => {
                reject(xml);
            });
        });
    }

    static addSekInER(objektPrim: PrimaerObjekt, objektTypePrim: string, objektSek: string, ereignisraum_nr: string) {
        return new Promise(function (resolve, reject) {
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
                '                   <int:objektKlasse>' + objektSek + '</int:objektKlasse>\n' +
                '            </objektKlassen>\n' +
                '     </pub:expandProjektPrimObj>\n' +
                '</soapenv:Body>\n' +
                '</soapenv:Envelope>'
            PublicWFS.doSoapRequestERWFS(xml).then((xml: Document) => {
                objektPrim.addSekOKinER(objektSek);
                resolve(xml)
            }).catch((xml: Document) => {
                reject(xml);
            });
        });
    }

    static doTransaction(transaction: string) {
        return new Promise(function (resolve, reject) {
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
            PublicWFS.doSoapRequestWFS(xml).then((xml: Document) => {
                if (xml.getElementsByTagName('SUCCESS').length > 0) {
                    resolve(xml);
                } else {
                    reject(xml);
                }
            })
        })
    }

    public static doQuery(klasse: string, filter: string): Promise<Document> {
        let url_param = "Request=GetFeature&TYPENAME=" + klasse + "&MPP=0&filter=" + encodeURIComponent(filter);
        return PublicWFS.doGetRequest(url_param);
    }


    public static testER(ereignisraum_nr: string): Promise<{ erfolgreich: boolean, fehler?: HTMLCollectionOf<Element> }> {
        return new Promise(function (resolve, reject) {


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
            PublicWFS.doSoapRequestERWFS(xml)
                .then((xmlResponse: Document) => {
                    let success = xmlResponse.getElementsByTagName("testSuccess");
                    if (!success || success.length == 0) {
                        reject(Error("Fehler beim Prüfen"))
                    }

                    if (success.item(0).innerHTML != "false") {
                        resolve({ erfolgreich: true });
                    }


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
                    PublicWFS.doSoapRequestERWFS(xml)
                        .then((xmlResponse: XMLDocument) => {
                            let results = xmlResponse.getElementsByTagName("testResult");
                            if (!results || results.length == 0) {
                                reject(Error("Fehler beim Prüfen"))
                            }
                            reject({ erfolgreich: false, fehler: Array.from(results) });
                        })
                })
        })
    }

    public static anlegenER(
        kurzBez: string, langBez: string, autoER: boolean = false): Promise<Document> {

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
        return PublicWFS.doSoapRequestERWFS(xml)
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