import { Feature } from "ol";
import Objekt from "./Objekt";
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill, Circle, Text, RegularShape } from 'ol/style';
import { Map } from 'ol';
import { ColorLike } from "ol/colorlike";
import Klartext from "./Klartext";
import PublicWFS from "../PublicWFS";
import { InfoToolSelectable } from "../Tools/InfoTool";
import { Point } from "ol/geom";
import Daten from "../Daten";

export default abstract class PunktObjekt extends Objekt implements InfoToolSelectable {
    protected vabstVst: number;
    protected vabstBst: number;
    protected rlageVst: string;
    protected rabstbaVst: number;
    protected labstbaVst: number;

    // Abstrakte Funktionen
    abstract colorFunktion1(): ColorLike;
    abstract colorFunktion2(): ColorLike;
    abstract getHTMLInfo(sidebar: HTMLElement, changeable?: boolean): void;
    abstract changeAttributes(form: HTMLFormElement): void;

    public updateStation(station: number, abstand: number) {
        this.vabstVst = Math.round(abstand * 10) / 10;
        this.vabstBst = this.vabstVst;
        this.rabstbaVst = this.vabstVst;
        this.vst = Math.round(station);
        this.bst = this.vst;

        let xml = this.createUpdateXML({
            'vabstVst': this.vabstVst,
            'vabstBst': this.vabstBst,
            'rabstbaVst': this.rabstbaVst,
            'vst': this.vst,
            'bst': this.bst
        });
        PublicWFS.doTransaction(xml);
    }

    setDataFromXML(objekt: string, xml: Element) {
        super.setDataFromXML(objekt, xml);
        let koords = xml.getElementsByTagName('gml:coordinates')[0].firstChild.textContent.split(',');
        this.setGeometry(new Point([parseFloat(koords[0]), parseFloat(koords[1])]));
        this.abschnitt = Daten.getInstanz().getAbschnitt(this.abschnittId);
        this.abschnitt.addOKinER(this.getObjektKlassenName());
        Daten.getInstanz().layerAchse.changed();
    }

    static createLayer(map: Map) {
        let source = new VectorSource({
            features: []
        });
        let layer = new VectorLayer({
            source: source,
            opacity: 0.7,
        });
        layer.setStyle(function (feature: PunktObjekt, zoom) {
            let color1 = feature.colorFunktion1();
            let color2 = feature.colorFunktion2();

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
                text: ((zoom < 0.2) ? ("" + feature.vst) : '')
            });

            let datum = new Date(feature.stand);
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
                    text: text
                });
            }
        }.bind(this));
        map.addLayer(layer);
        return layer;
    }
}