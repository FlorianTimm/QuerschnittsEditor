// SPDX-License-Identifier: GPL-3.0-or-later

import { Abschnitt } from './Objekte/Abschnitt';
import { PrimaerObjekt } from './Objekte/prototypes/PrimaerObjekt';
import { WaitBlocker } from './WaitBlocker';
import { CONFIG } from '../config/config'
import { LineString, Point, Polygon } from 'ol/geom';

/**
 * Schnittstelle zum PublicWFS
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.10.29
 * @license GPL-3.0-or-later
*/

export class PublicWFS {
    static capabilities: null | Promise<Document> = null;
    static describeFeature: { [featureType: string]: Promise<Document> };

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
                if (xmlhttp.readyState != 4) return;
                WaitBlocker.warteSub();
                if (xmlhttp.status == 200) {
                    resolve(xmlhttp.responseXML);
                } else {
                    reject(xmlhttp.responseXML)
                }
            };
            xmlhttp.setRequestHeader('Content-Type', 'text/xml');
            //xmlhttp.setRequestHeader('Content-Type', 'text/xml; charset=ISO-8859-1');
            xmlhttp.send(xml);
        })
    }

    private static doGetRequest(url_param: string, blocking: boolean = true): Promise<Document> {
        return new Promise(function (resolve, reject) {
            if (blocking) WaitBlocker.warteAdd()
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open('GET', CONFIG.PUBLIC_WFS_URL + '?' + url_param, true);

            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState != 4) return;
                if (xmlhttp.status == 200) {
                    if (blocking) WaitBlocker.warteSub()
                    resolve(xmlhttp.responseXML)
                } else if (xmlhttp.status != 200) {
                    if (blocking) WaitBlocker.warteSub()
                    reject(xmlhttp.responseXML)
                }
            }
            xmlhttp.onerror = function () {
                PublicWFS.showMessage("Fehler bei der Kommunikation mit WFS", true)
                if (blocking) WaitBlocker.warteSub()
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
                PublicWFS.showMessage("Fehler bei der Kommunikation mit WFS", true)
                reject(xml);
            });
        });
    }

    static async addSekInER(objektPrim: PrimaerObjekt<Point | LineString | Polygon>, objektTypePrim: string, objektSek: string, ereignisraum_nr: string): Promise<Document> {
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
                PublicWFS.showMessage("Fehler bei der Kommunikation mit WFS", true)
                reject(xml);
            });
        });
    }

    static async doTransaction(transaction: string): Promise<Document> {
        var transactXML =
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

        return PublicWFS.doSoapRequestWFS(transactXML)
            .then((responseXML) => {
                if (responseXML.getElementsByTagName('SUCCESS').length > 0) {
                    return Promise.resolve(responseXML);
                } else {
                    return Promise.reject(responseXML);
                }
            })
            .catch((responseXML) => {
                PublicWFS.showMessage("Fehler bei der Kommunikation mit WFS", true);
                return Promise.reject(responseXML)
            })
    }

    public static doQuery(klasse: string, filter: string, blocking: boolean = true, maxCount?: number): Promise<Document> {
        let url_param = "Request=GetFeature&TYPENAME=" + klasse + "&MPP=0&filter=" + encodeURIComponent(filter);
        if (maxCount) {
            url_param += '&MAXFEATURES=' + maxCount;
        }
        return PublicWFS.doGetRequest(url_param, blocking);
    }


    public static async testER(ereignisraum_nr: string): Promise<{ erfolgreich: boolean, fehler?: Element[] }> {
        let xmlPruefung = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" \n' +
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
        let erfolgreich = await PublicWFS.doSoapRequestERWFS(xmlPruefung)
            .then((xmlResponse: Document) => {
                let success = xmlResponse.getElementsByTagName("testSuccess");
                if (!success || success.length == 0) {
                    PublicWFS.showMessage("Fehler bei der Kommunikation mit WFS", true)
                    Promise.reject(Error("Fehler beim Prüfen"))
                }

                if (success.item(0).innerHTML != "false") {
                    return true;
                }
                return false;
            });

        if (erfolgreich) return Promise.resolve({ erfolgreich: true });


        let xmlListe = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" \n' +
            'xmlns:pub="http://ttsib.novasib.de/PublicServices" xmlns:int="http://interfaceTypes.ttsib5.novasib.de/">\n' +
            '<soapenv:Header/>\n' +
            '<soapenv:Body>\n' +
            '     <pub:queryTestresult>\n' +
            '            <projekt>\n' +
            '                   <int:ProjektNr>' + ereignisraum_nr + '</int:ProjektNr>\n' +
            '            </projekt>\n' +
            '     </pub:queryTestresult>\n' +
            '</soapenv:Body>\n' +
            '</soapenv:Envelope>';

        const xmlResponse_1 = await PublicWFS.doSoapRequestERWFS(xmlListe);
        let results = xmlResponse_1.getElementsByTagName("testResult");
        if (!results || results.length == 0) {
            PublicWFS.showMessage("Fehler bei der Kommunikation mit WFS", true);
            return Promise.reject(Error("Fehler beim Prüfen"));
        }
        return Promise.resolve({ erfolgreich: false, fehler: Array.from(results) });
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

    public static async getCapabilities(): Promise<Document> {
        if (this.capabilities == null)
            this.capabilities = PublicWFS.doGetRequest("SERVICE=WFS&REQUEST=GetCapabilities");
        return this.capabilities;
    }

    public static async describeFeatureType(featureType: string): Promise<Document> {
        if (!this.describeFeature) this.describeFeature = {};
        if (!(featureType in this.describeFeature))
            this.describeFeature[featureType] = PublicWFS.doGetRequest("SERVICE=WFS&REQUEST=DescribeFeatureType&TYPENAME=" + featureType);
        return this.describeFeature[featureType];
    }
}