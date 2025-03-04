// SPDX-License-Identifier: GPL-3.0-or-later

import { Extent } from 'ol/extent';
import { ConfigLoader } from './ConfigLoader';

/**
 * Schnittstelle zur eigenen Geometrie-Schnittstelle
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.06.06
 * @license GPL-3.0-or-later
*/
export class AbschnittWFS {

    static getById(id: string): Promise<XMLDocument> {
        let param = '?ABSCHNITTID=' + id;
        return AbschnittWFS._makeRequest(param)
    }

    static getByStrName(name: string): Promise<XMLDocument> {

        let param = '?STRNAME=' + encodeURIComponent(name);
        return AbschnittWFS._makeRequest(param)
    }

    static getByWegenummer(klasse: string, nummer: string, buchstabe: string): Promise<XMLDocument> {

        let param = '?KLASSE=' + klasse + '&NR=' + nummer + '&BUCHSTABE=' + buchstabe;
        return AbschnittWFS._makeRequest(param)
    }

    static getByVNKNNK(vnk: string, nnk: string): Promise<XMLDocument> {

        let param = '?VNK=' + vnk + '&NNK=' + nnk;
        return AbschnittWFS._makeRequest(param)
    }

    static getByExtent(extent: Extent): Promise<XMLDocument> {

        let param = '?BBOX=' + extent.join(',');
        return AbschnittWFS._makeRequest(param)
    }

    static async _makeRequest(param: string): Promise<XMLDocument> {

        var xmlhttp = new XMLHttpRequest();
        let config = await ConfigLoader.get().getConfig();
        xmlhttp.open('POST', config.ABSCHNITT_WFS_URL + param, true);
        return new Promise((resolve, reject) => {
            xmlhttp.onreadystatechange = () => {
                if (xmlhttp.readyState != 4) return;
                if (xmlhttp.status == 200) {
                    resolve(xmlhttp.responseXML)
                } else if (xmlhttp.status != 200) {
                    reject(xmlhttp.responseXML)
                }
            }
            xmlhttp.send();
        });

    }
}