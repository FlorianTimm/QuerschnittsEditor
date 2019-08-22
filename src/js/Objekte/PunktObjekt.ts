import { Feature } from "ol";
import Objekt from "./Objekt";
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill, Circle, Text, RegularShape } from 'ol/style';
import { Map } from 'ol';
import { ColorLike } from "ol/colorlike";
import Klartext from "./Klartext";

export default class PunktObjekt extends Objekt {
    protected color1: (feature: Feature)=> ColorLike ;
    protected color2: (feature: Feature)=> ColorLike ;

    constructor(color1: (feature: Feature)=> ColorLike, color2: (feature: Feature)=> ColorLike) {
        super();
        this.color1 = color1;
        this.color2 = color2;
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
            let color1 = this.color1(feature);
            let color2 = this.color2(feature);

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
        });
        map.addLayer(layer);
        return layer;
    }

    protected static klartextLoaded(klartext: string, id: string) {
        let arten = Klartext.getInstanz().getAllSorted(klartext);
        for (let a of arten) {
            let option = document.createElement('option');
            let t = document.createTextNode(a.beschreib);
            option.appendChild(t);
            option.setAttribute('value', a.objektId);
            document.forms.namedItem("sapadd")[id].appendChild(option);
        }
        $(document.forms.namedItem("sapadd")[id]).chosen({ width: "95%", search_contains: true });
    }
}