// SPDX-License-Identifier: GPL-3.0-or-later

import { Map } from 'ol';
import { ColorLike } from "ol/colorlike";
import { FeatureLike } from 'ol/Feature';
import { LineString, Point } from "ol/geom";
import VectorSource from 'ol/source/Vector';
import { Circle, Fill, RegularShape, Stroke, Style, Text } from 'ol/style';
import { VectorLayer } from '../../openLayers/Layer';
import { PublicWFS } from "../../PublicWFS";
import { InfoToolEditable } from "../../Tools/InfoTool";
import { Abschnitt } from '../Abschnitt';
import { Klartext } from '../Klartext';
import { PObjektMitDokument } from "./PObjektMitDateien";

/**
 * PunktObjekt
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.04.03
 * @license GPL-3.0-or-later
*/
export abstract class PunktObjekt extends PObjektMitDokument<Point | LineString> implements InfoToolEditable {
    protected vabstVst: number;
    protected vabstBst: number;
    protected rlageVst: Klartext;
    protected rabstbaVst: number;
    protected labstbaVst: number;

    // Abstrakte Funktionen
    abstract colorFunktion1(): ColorLike;
    abstract colorFunktion2(): ColorLike;
    abstract getInfoForm(sidebar: HTMLElement, changeable?: boolean): Promise<void | void[]>;
    abstract changeAttributes(form: HTMLFormElement): Promise<Document>;

    public updateStation(station: number, rabstbavst: number, labstbavst?: number) {
        this.rabstbaVst = Math.round(rabstbavst * 10) / 10;
        if (labstbavst) {
            this.labstbaVst = Math.round(labstbavst * 10) / 10
            this.vabstVst = Math.round(rabstbavst + labstbavst * 5) / 10;
        } else {
            this.vabstVst = Math.round(rabstbavst * 10) / 10;
        }
        this.vabstBst = this.vabstVst;
        this.vst = Math.round(station);
        this.bst = this.vst;

        let xml = this.createUpdateXML({
            'vabstVst': this.vabstVst,
            'vabstBst': this.vabstBst,
            'rabstbaVst': this.rabstbaVst,
            'labstbaVst': this.labstbaVst,
            'vst': this.vst,
            'bst': this.bst
        });
        PublicWFS.doTransaction(xml)
            .then(() => { PublicWFS.showMessage("erfolgreich", false) })
            .catch(() => { PublicWFS.showMessage("Fehler", true) });
    }

    public async setDataFromXML(xml: Element): Promise<PunktObjekt> {
        await super.setDataFromXML(xml);
        const abschnitt = await Abschnitt.getAbschnitt(this.abschnittId);
        this.abschnitt = abschnitt;
        abschnitt.addOKinER(this.getObjektKlassenName());
        Abschnitt.getLayer().changed();

        this.calcGeometry(xml)

        return this;
    }

    protected calcGeometry(xml?: Element) {
        if (typeof this.labstbaVst === "number") {
            this.setGeometry(
                new LineString([
                    this.abschnitt.stationierePunkt(this.vst, this.rabstbaVst),
                    this.abschnitt.stationierePunkt(this.vst, this.labstbaVst)
                ]));
        } else if (xml) {
            let koords = xml.getElementsByTagName('gml:coordinates')[0].firstChild.textContent.split(',');
            this.setGeometry(new Point([parseFloat(koords[0]), parseFloat(koords[1])]));
        } else {
            this.setGeometry(new Point(this.abschnitt.stationierePunkt(this.vst, this.rabstbaVst)));
        }
    }


    protected static createLayer(map?: Map): VectorLayer<VectorSource<Point | LineString>> {
        let layer = new VectorLayer<VectorSource<Point | LineString>>({
            source: new VectorSource<Point | LineString>(),
            opacity: 0.7,
        });
        layer.setStyle((feat: FeatureLike, resolution: number) => {
            let pkt = feat as PunktObjekt;
            let color1 = pkt.colorFunktion1();
            let color2 = pkt.colorFunktion2();

            let text = new Text({
                font: '13px Calibri,sans-serif',
                fill: new Fill({ color: '#000' }),
                stroke: new Stroke({
                    color: '#fff', width: 2
                }),
                offsetX: 9,
                offsetY: 8,
                textAlign: 'left',
                // get the text from the feature - `this` is ol.Feature
                // and show only under certain resolution
                text: ((resolution < 0.2) ? ("" + pkt.vst) : '')
            });

            let datum = new Date(pkt.stand);

            //console.log(feature.stand);
            if ((Date.now() - datum.getTime()) > 3600000 * 24) {
                return new Style({
                    image: new Circle({
                        radius: 3,
                        fill: new Fill({ color: color2 }),
                        stroke: new Stroke({
                            color: color1,
                            width: 3
                        })
                    }),
                    stroke: new Stroke({
                        color: color1,
                        width: 3
                    }),
                    text: text
                });
            } else {
                return new Style({
                    image: new RegularShape({
                        points: 4,
                        radius: 4,
                        angle: Math.PI / 4,
                        fill: new Fill({ color: color1 }),
                        stroke: new Stroke({
                            color: color2,
                            width: 1
                        })
                    }),
                    stroke: new Stroke({
                        color: color2,
                        width: 3
                    }),
                    text: text
                });
            }
        });

        layer.getStyle
        if (map) map.addLayer(layer);
        return layer;
    }

    public setRlageVst(rlagevst: Klartext | string) {
        this.rlageVst = Klartext.get("Itallglage", rlagevst);
    }

    public getRAbstBaVst(): number {
        return this.rabstbaVst;
    }
    public getLAbstBaVst(): number {
        return this.labstbaVst;
    }
}