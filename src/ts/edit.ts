/**
 * Startscript edit.html
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */

import 'babel-polyfill';
import { MapEvent, View } from 'ol';
import { defaults as defaultControls, ScaleLine, ZoomSlider } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';
import { Layer } from 'ol/layer';
import { fromLonLat, transform } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import { TileWMS as TileWMS } from 'ol/source';
import StaticImage from 'ol/source/ImageStatic';
import OSM from 'ol/source/OSM';
import proj4 from 'proj4';
import Daten from './Daten';
import LayerSwitch from './LayerSwitch';
import Measure from './Tools/Measure';
import { ImageLayer, TileLayer } from './openLayers/Layer';
import Map from './openLayers/Map';
import PublicWFS from './PublicWFS';
import QuerschnittToolBox from './Klassen/QuerschnittToolBox';
import AufstellToolBox from './Klassen/AufstellToolBox';
import AusstPktToolBox from './Klassen/AusstPktToolBox';
import ToolBox from './Klassen/ToolBox';
import Abschnitt from './Objekte/Abschnitt';
import SonstigesToolBox from './Klassen/SonstigesToolBox';

var CONFIG: { [name: string]: string } = require('./config.json');

let urlParamER: RegExpExecArray = new RegExp('[\?&]er=([^&#]*)').exec(window.location.href);
let urlParamERNR: RegExpExecArray = new RegExp('[\?&]ernr=([^&#]*)').exec(window.location.href);
if (urlParamER == null || urlParamERNR == null) {
    PublicWFS.showMessage("Kein Ereignisraum ausgewählt!", true);
    location.href = "./index.html";
}
var er = decodeURI(urlParamER[1])
var ernr = decodeURI(urlParamERNR[1])
console.log("Ereignisraum: " + ernr);

let daten: Daten, measure: Measure;

window.addEventListener('load', function () {
    proj4.defs("EPSG:31467", "+proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7 +units=m +no_defs");
    proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    register(proj4);


    var map = createMap();
    let foundHash = checkHash(map);

    daten = new Daten(map, er, ernr);

    let sidebar = document.getElementById("tools") as HTMLDivElement | null;
    if (!sidebar) throw new Error("HTML Sidebar nicht gefunden")

    new QuerschnittToolBox(map, sidebar);
    let atb = new AufstellToolBox(map, sidebar);
    new AusstPktToolBox(map, sidebar);
    new SonstigesToolBox(map, sidebar)
    atb.start()
    Abschnitt.getLayer(map);


    daten.loadER(!foundHash);

    document.getElementById("zoomToExtent").addEventListener('click', Daten.getInstanz().zoomToExtent.bind(daten))
    document.getElementById("loadExtent").addEventListener('click', function () {
        daten.loadExtent();
    })

    document.getElementById("sucheButton").addEventListener('click', function () {
        daten.searchForStreet();
    })

    document.forms.namedItem("suche").addEventListener('submit', function (event: { preventDefault: () => void; }) {
        event.preventDefault();
        daten.searchForStreet();
    })
});


function checkHash(map: Map) {
    let foundHash = false;
    if (document.location.hash != "") {
        let hash = document.location.hash.replace("#", "").split('&');
        let layer: string = null, x: number = null, y: number = null, zoom: number = null;
        for (let i = 0; i < hash.length; i++) {
            let t = hash[i].split("=");
            switch (t[0]) {
                case "zoom":
                    zoom = parseInt(t[1]);
                    break;
                case "x":
                    x = parseFloat(t[1]);
                    break;
                case "y":
                    y = parseFloat(t[1]);
                    break;
                case "layer":
                    layer = t[1];
                    break;
            }
        }
        if (zoom != null) {
            map.getView().setZoom(zoom);
        }
        if (x != null && y != null) {
            map.getView().setCenter([x, y]);
        }
        if (layer != null) {
            let selection = layer.split(',');
            map.getLayers().forEach(function (layer, id, __) {
                if (layer.get('switchable') == true) {
                    if (selection.indexOf(id + "") != -1) {
                        layer.setVisible(true);
                    }
                    else {
                        layer.setVisible(false);
                    }
                }
            });
        }
        foundHash = true;
    }
    map.getLayers().forEach(function (layer, __, ___) {
        if (layer.get('switchable') == undefined || layer.get('switchable') == true) {
            layer.on("propertychange", recreateHash);
        }
    });
    map.firstHash = true;
    map.on("moveend", recreateHash);
    return foundHash;
}

function recreateHash(event: MapEvent) {
    //console.log(event)
    if (event.target.firstHash) {
        let view = event.target.getView();
        let hash = "#zoom=" + view.getZoom();
        hash += "&x=" + Math.round(view.getCenter()[0]);
        hash += "&y=" + Math.round(view.getCenter()[1]);

        let visible: number[] = []
        event.target.getLayers().forEach(
            function (layer: Layer, id: number, __: Layer[]) {
                if (layer.get('switchable') == true) {
                    if ((layer as Layer).getVisible()) {
                        visible.push(id);
                    }
                }
            });

        hash += "&layer=" + visible.join(',');
        document.location.hash = hash;
    }
}

function createMap() {
    return new Map({
        layers: [
            new TileLayer({
                name: 'OpenStreetMap',
                visible: false,
                switchable: true,
                source: new OSM()
            }),
            new TileLayer({
                name: 'ALKIS',
                visible: false,
                switchable: true,
                opacity: 1,
                source: new TileWMS({
                    url: 'http://geodienste.hamburg.de/HH_WMS_ALKIS_Basiskarte',
                    params: {
                        'LAYERS': '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,23,24,26,27,28,29,30,32,33,34,35,36,37',
                        'FORMAT': 'image/png'
                    },
                    attributions: ['Freie und Hansestadt Hamburg, LGV 2019']
                })
            }),
            new TileLayer({
                name: 'LGV DOP 2017',
                visible: true,
                switchable: true,
                opacity: 0.7,
                source: new TileWMS({
                    url: 'http://geodienste.hamburg.de/HH_WMS_DOP10',
                    params: {
                        'LAYERS': '1',
                        'FORMAT': 'image/png'
                    },
                    attributions: ['Freie und Hansestadt Hamburg, LGV 2019']
                })
            }),
            new TileLayer({
                name: 'LGV DOP 2018',
                visible: false,
                switchable: true,
                opacity: 0.7,
                source: new TileWMS({
                    url: 'https://geodienste.hamburg.de/HH_WMS_DOP_hochaufloesend',
                    params: {
                        'LAYERS': 'DOP5',
                        'FORMAT': 'image/png'
                    },
                    attributions: ['Freie und Hansestadt Hamburg, LGV 2019']
                })
            }),

            new ImageLayer({
                name: 'LGV DOP5 (nur LGV)',
                visible: false,
                switchable: true,
                source: new StaticImage({
                    attributions: ['Freie und Hansestadt Hamburg, LGV 2019'],
                    url: 'http://gv-srv-w00118:8080/dop5rgb_3256650_592800_hh_2018.jpg',
                    imageExtent: transform([566500, 5928000, 566750, 5928250], 'EPSG:25832', CONFIG["EPSG_CODE"])
                })
            }),

            new TileLayer({
                name: "Querschnitte gruppiert",
                visible: false,
                switchable: true,
                opacity: 0.6,
                source: new TileWMS({
                    url: 'http://gv-srv-w00118:20031/deegree/services/wms?',
                    params: {
                        'LAYERS': 'querschnitte',
                        'STYLE': 'querschnitte_gruppiert',
                        'FORMAT': 'image/png'
                    },
                    serverType: ('geoserver'),
                    attributions: ['Freie und Hansestadt Hamburg, LGV 2019']
                })
            }),
            new TileLayer({
                name: "Bezirks-Feinkartierung",
                visible: false,
                switchable: true,
                opacity: 0.8,
                source: new TileWMS({
                    url: 'https://geodienste.hamburg.de/HH_WMS_Feinkartierung_Strasse?',
                    params: {
                        'LAYERS': 'b_altona_mr_feinkartierung_flaechen,b_harburg_mr_feinkartierung_flaechen,b_mitte_mr_feinkartierung_flaechen,b_eims_mr_feinkartierung_flaechen,b_wands_mr_feinkartierung_flaechen',
                        'FORMAT': 'image/png'
                    },
                    serverType: ('geoserver'),
                    attributions: ['Freie und Hansestadt Hamburg, LGV 2019']
                })
            })
        ],
        target: 'map',
        interactions: defaultInteractions({
            pinchRotate: false
        }),
        controls: defaultControls().extend([new LayerSwitch(), new ScaleLine(), new ZoomSlider()]),
        view: new View({
            projection: CONFIG["EPSG_CODE"],
            center: fromLonLat([10.0045, 53.4975], CONFIG["EPSG_CODE"]),
            zoom: 17,
            minZoom: 11,
            maxZoom: 24,
            //extent: transform([548000, 5916500, 588500, 5955000], 'EPSG:25832', CONFIG.EPSG_CODE),
        })
    });
}

$("div#tabs").tabs({
    activate: function (event, ui) {
        Daten.getInstanz().modus = (event.currentTarget as HTMLElement).dataset.ok;
        Abschnitt.getLayer().changed();
        ToolBox.getByFormId(ui.oldPanel.prop("id")).stop();
        ToolBox.getByFormId(ui.newPanel.prop("id")).start();
    },
    active: 1
})
