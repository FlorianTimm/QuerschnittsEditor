// SPDX-License-Identifier: GPL-3.0-or-later

import { Map } from 'ol';
import Event from 'ol/events/Event';
import { Extent } from 'ol/extent';
import { AbschnittWFS } from './AbschnittWFS';
import { Abschnitt } from './Objekte/Abschnitt';
import { Aufstellvorrichtung } from './Objekte/Aufstellvorrichtung';
import { Querschnitt } from './Objekte/Querschnittsdaten';
import { StrassenAusPunkt } from './Objekte/StrassenAusPunkt';
import { PublicWFS } from './PublicWFS';
import { WaitBlocker } from './WaitBlocker';

var CONFIG: { [name: string]: string } = require('./config.json');

/**
 * Daten
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019-10-29
 * @license GPL-3.0-or-later
 */
export class Daten {
    private static daten: Daten = null;

    public modus: string = "Otaufstvor"
    public ereignisraum: string;
    public ereignisraum_nr: string;

    private map: Map;

    constructor(map: Map, ereignisraum: string, ereignisraum_nr: string) {
        Daten.daten = this;
        this.map = map;
        this.ereignisraum = ereignisraum;
        this.ereignisraum_nr = ereignisraum_nr;
    }

    /**
     * Lädt Daten aus den ERs
     */
    public loadER(zoomToExtentWhenReady: boolean = true) {
        let tasks: Promise<any>[] = [
            Querschnitt.loadER(),
            Aufstellvorrichtung.loadER(),
            StrassenAusPunkt.loadER()]
        Promise.all(tasks).then(() => {
            (document.getElementById("zoomToExtent") as HTMLFormElement).disabled = false;
            if (zoomToExtentWhenReady)
                this.zoomToExtent();
        })
    }

    public zoomToExtent() {
        let minX = null, maxX = null, minY = null, maxY = null;
        let features = Abschnitt.getLayer().getSource().getFeatures();
        if (features.length == 0) {
            PublicWFS.showMessage("Keine Daten geladen<br /><br />[ ER enthält keine bearbeitbaren Objekte ]", true);
            return;
        }

        for (let f of features) {
            let geo = f.getGeometry()
            let p = geo.getExtent();

            if (minX == null || minX > p[0]) minX = p[0];
            if (minY == null || minY > p[1]) minY = p[1];
            if (maxX == null || maxX < p[2]) maxX = p[2];
            if (maxY == null || maxY < p[3]) maxY = p[3];
        }
        this.map.getView().fit([minX, minY, maxX, maxY], { padding: [20, 240, 20, 20] })

    }

    public static getInstanz(): Daten {
        return Daten.daten;
    }

    public async loadExtent() {
        WaitBlocker.warteAdd()
        let extent = this.map.getView().calculateExtent();
        if ("ABSCHNITT_WFS_URL" in CONFIG) {
            const xml = await AbschnittWFS.getByExtent(extent);
            return this.loadExtent_Callback(xml);
        } else {
            let filter = '<Filter>' +
                '<BBOX>' +
                '<PropertyName>GEOMETRY</PropertyName>' +
                '<Box srsName="' + CONFIG.EPSG_CODE + '">' +
                '<coordinates>' + extent[0] + ',' + extent[1] + ' ' + extent[2] + ',' + extent[3] + ' ' + '</coordinates>' +
                '</Box>' +
                '</BBOX>' +
                '</Filter>';
            const xml = await PublicWFS.doQuery('VI_STRASSENNETZ', filter, undefined, 100);
            return this.loadExtent_Callback(xml);
        }
    }

    private loadExtent_Callback(xml: XMLDocument) {
        let netz = xml.getElementsByTagName("VI_STRASSENNETZ");
        let r: Abschnitt[] = [];
        for (let i = 0; i < netz.length; i++) {
            r.push(Abschnitt.fromXML(netz[i]));
        }
        WaitBlocker.warteSub()

    }

    public searchForStreet(__?: Event) {
        console.log(document.forms.namedItem("suche").suche.value);
        let wert = document.forms.namedItem("suche").suche.value;
        if (wert == "") return;
        if ("ABSCHNITT_WFS_URL" in CONFIG) {
            WaitBlocker.warteAdd();

            const vnknnk = /(\d{7,9}[A-Z]?)[\s\-]+(\d{7,9}[A-Z]?)/gm;
            let found1 = vnknnk.exec(wert.toUpperCase())
            if (found1 != null) {
                console.log(found1)
                let vnk = found1[1];
                let nnk = found1[2];
                AbschnittWFS.getByVNKNNK(vnk, nnk)
                    .then((xml: Document) => { this.loadSearch_Callback(xml) });
                return;
            }

            const wnr = /([ABGKL])\s?(\d{1,4})\s?([A-Z]?)/gm;
            let found2 = wnr.exec(wert.toUpperCase())
            if (found2 != null) {
                console.log(found2)
                let klasse = found2[1];
                let nummer = found2[2];
                let buchstabe = (found2.length > 2) ? found2[3] : '';
                AbschnittWFS.getByWegenummer(klasse, nummer, buchstabe)
                    .then((xml: Document) => { this.loadSearch_Callback(xml) });
                return;
            }
            AbschnittWFS.getByStrName(wert)
                .then((xml: Document) => { this.loadSearch_Callback(xml) });
        } else {
            const vnknnk = /(\d{7,9}[A-Z]?)[\s\-]+(\d{7,9}[A-Z]?)/gm;
            let found1 = vnknnk.exec(wert.toUpperCase())
            if (found1 != null) {
                console.log(found1)
                let vnk = found1[1];
                let nnk = found1[2];
                let filter = '<Filter><And>' +
                    '<PropertyIsEqualTo><PropertyName>VNK</PropertyName><Literal>' + vnk + '</Literal></PropertyIsEqualTo>' +
                    '<PropertyIsEqualTo><PropertyName>NNK</PropertyName><Literal>' + nnk + '</Literal></PropertyIsEqualTo>' +
                    '</And></Filter>';
                PublicWFS.doQuery('VI_STRASSENNETZ', filter, undefined, 100).
                    then((xml: Document) => this.loadSearch_Callback(xml));
                return;
            }

            const wnr = /([ABGKL])\s?(\d{1,4})\s?([A-Z]?)/gm;
            let found2 = wnr.exec(wert.toUpperCase())
            if (found2 != null) {
                console.log(found2)
                let klasse = found2[1];
                let nummer = found2[2];
                let buchstabe = (found2.length > 2) ? found2[3] : null;
                let filter = '<Filter><And>' +
                    '<PropertyIsEqualTo><PropertyName>KLASSE</PropertyName><Literal>' + klasse + '</Literal></PropertyIsEqualTo>' +
                    '<PropertyIsEqualTo><PropertyName>NUMMER</PropertyName><Literal>' + nummer + '</Literal></PropertyIsEqualTo>';
                if (buchstabe)
                    filter += '<PropertyIsEqualTo><PropertyName>BUCHSTABE</PropertyName><Literal>' + buchstabe + '</Literal></PropertyIsEqualTo>';
                filter += '</And></Filter>';
                PublicWFS.doQuery('VI_STRASSENNETZ', filter, undefined, 100).
                    then((xml: Document) => this.loadSearch_Callback(xml));
                return;
            }

            PublicWFS.showMessage("Straßennamen-Suche ist nur über den AbschnittWFS möglich");
            /*let filter = '<Filter><Like><PropertyName><PropertyName><Literal><Literal></Like></Filter>'
            PublicWFS.doQuery('VI_STRASSENNETZ', filter, this._loadSearch_Callback, undefined, this);*/
        }
    }

    private loadSearch_Callback(xml: XMLDocument) {
        let netz = xml.getElementsByTagName("VI_STRASSENNETZ");
        console.log(netz);
        let geladen = [];
        for (let i = 0; i < netz.length; i++) {
            //console.log(abschnittXML)
            let abschnitt = Abschnitt.fromXML(netz.item(i));
            geladen.push(abschnitt);
        }

        // auf die Abschnitte zoomen
        if (geladen.length > 0) {
            let extent = Daten.calcAbschnitteExtent(geladen);
            this.map.getView().fit(extent, { padding: [20, 240, 20, 20] })
        } else {
            PublicWFS.showMessage("Kein Abschnitt gefunden!", true);
        }
        WaitBlocker.warteSub();
    }

    public static calcAbschnitteExtent(abschnitte: Abschnitt[]): Extent {
        let minX = null, maxX = null, minY = null, maxY = null;
        for (let i = 0; i < abschnitte.length; i++) {
            let f = abschnitte[i];
            let p = f.getGeometry().getExtent();

            if (minX == null || minX > p[0]) minX = p[0];
            if (minY == null || minY > p[1]) minY = p[1];
            if (maxX == null || maxX < p[2]) maxX = p[2];
            if (maxY == null || maxY < p[3]) maxY = p[3];
        }
        //console.log([minX, minY, maxX, maxY])
        return [minX, minY, maxX, maxY];
    }
}
