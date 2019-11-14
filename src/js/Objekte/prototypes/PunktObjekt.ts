import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill, Circle, Text, RegularShape, Icon } from 'ol/style';
import { Map } from 'ol';
import { ColorLike } from "ol/colorlike";
import PublicWFS from "../../PublicWFS";
import { InfoToolEditable } from "../../Tools/InfoTool";
import { Point } from "ol/geom";
import Daten from "../../Daten";
import PObjektMitDokument from "./PObjektMitDateien";
import { FeatureLike } from 'ol/Feature';
import Abschnitt from '../Abschnitt';
import Aufstellvorrichtung from '../Aufstellvorrichtung';
import Klartext from '../Klartext';
import { rotate } from 'ol/transform';
import Zeichen from '../Zeichen';

export default abstract class PunktObjekt extends PObjektMitDokument implements InfoToolEditable {
    protected vabstVst: number;
    protected vabstBst: number;
    protected rlageVst: Klartext;
    protected rabstbaVst: number;
    protected labstbaVst: number;

    // Abstrakte Funktionen
    abstract colorFunktion1(): ColorLike;
    abstract colorFunktion2(): ColorLike;
    abstract getInfoForm(sidebar: HTMLElement, changeable?: boolean): void;
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

    setDataFromXML(xml: Element, callback?: (...args: any[]) => void, ...args: any[]) {
        super.setDataFromXML(xml);
        let koords = xml.getElementsByTagName('gml:coordinates')[0].firstChild.textContent.split(',');
        this.setGeometry(new Point([parseFloat(koords[0]), parseFloat(koords[1])]));
        Daten.getInstanz().layerAchse.changed();

        Abschnitt.getAbschnitt(this.abschnittId, function (this: PunktObjekt, abschnitt: Abschnitt) {
            this.abschnitt = abschnitt
            abschnitt.addOKinER(this.getObjektKlassenName());
            if (callback) callback(...args);
        }.bind(this))
    }

    static createLayer(map: Map) {
        let source = new VectorSource({
            features: []
        });
        let layer = new VectorLayer({
            source: source,
            opacity: 0.7,
        });
        layer.setStyle(function (feat: FeatureLike, resolution: number) {
            let style: Style[] = []
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
                style.push(new Style({
                    image: new Circle({
                        radius: 3,
                        fill: new Fill({ color: color2 }),
                        stroke: new Stroke({
                            color: color1,
                            width: 3
                        })
                    }),
                    text: text
                }));
            } else {
                style.push(new Style({
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
                }));
            }


            if (feat instanceof Aufstellvorrichtung && resolution < 0.10) {
                let aufst = feat as Aufstellvorrichtung;
                let abschnitt = feat.getAbschnitt()
                if (abschnitt) {
                    let winkel = abschnitt.getWinkel(feat.getVst());

                    let zeichenListe = aufst.getZeichen().sort(function (a: Zeichen, b: Zeichen) {
                        if (a.getSort() > b.getSort()) return 1;
                        if (a.getSort() < b.getSort()) return -1
                        return 0;
                    })




                    let zeichenL: { [richtung: number]: Zeichen[] } = {}
                    for (let z of zeichenListe) {
                        let r = z.getLesbarkeit() ? z.getLesbarkeit().getKt() : '03';
                        if (r == '05') r = '03';
                        if (!(r in zeichenL)) zeichenL[r] = []
                        zeichenL[r].push(z);
                    }

                    let winkelListe = {
                        'R': {
                            '01': Math.PI,
                            '02': 0,
                            '03': - 0.5 * Math.PI,
                            '04': 0.5 * Math.PI
                        },
                        'L': {
                            '01': 0,
                            '02': Math.PI,
                            '03': 0.5 * Math.PI,
                            '04': - 0.5 * Math.PI
                        }
                    }

                    for (let r in zeichenL) {
                        let liste = zeichenL[r];

                        let canvas = document.createElement("canvas")
                        let ctx = canvas.getContext('2d')
                        ctx.beginPath()
                        ctx.strokeStyle = "#444444";
                        ctx.lineWidth = 4;
                        ctx.moveTo(25, 20 + 40 * liste.length)
                        ctx.lineTo(25, 20)
                        ctx.stroke()

                        for (let i = 0; i < liste.length; i++) {
                            let zeichen = liste[i]

                            let img = new Image();

                            img.src = '../schilder/' + zeichen.getStvoznr().getKt() + '.svg';
                            img.onload = function () {
                                console.log(img)
                                let breite = 40 * img.width / img.height
                                ctx.drawImage(img, (50 - breite) / 2, 40 * i, breite, 40);
                            }
                        }

                        let seite = (aufst.getVabstVst() < 0)?'L':'R';

                        style.push(new Style({
                            geometry: (aufst.getGeometry() as Point),
                            image: new Icon({
                                //src: '../schilder/' + zeichen.getStvoznr().getKt() + '.svg',
                                imgSize: [50, 20 + 40 * liste.length],
                                img: canvas,
                                rotation: winkel + winkelListe[seite][r],
                                anchor: [0.5, 1]
                            })
                        }));
                    }
                }
            }
            return style;
        }.bind(this));

        layer.getStyle
        map.addLayer(layer);
        return layer;
    }

    setRlageVst(rlagevst: Klartext | string) {
        this.rlageVst = Klartext.get("Itallglage", rlagevst);
    }
}