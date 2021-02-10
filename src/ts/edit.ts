// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Startscript edit.html
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020-04-03
 * @license GPL-3.0-or-later
 */

import 'babel-polyfill';
import { View } from 'ol';
import { defaults as defaultControls, ScaleLine, ZoomSlider } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';
import BaseLayer from 'ol/layer/Base';
import { fromLonLat, toLonLat, transform } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import { TileWMS as TileWMS } from 'ol/source';
import OSM from 'ol/source/OSM';
import proj4 from 'proj4';
import { Daten } from './Daten';
import { AufstellToolBox } from './Klassen/AufstellToolBox';
import { AusstPktToolBox } from './Klassen/AusstPktToolBox';
import { LinienToolBox } from './Klassen/LinienToolBox';
import { QuerschnittToolBox } from './Klassen/QuerschnittToolBox';
import { SonstigesToolBox } from './Klassen/SonstigesToolBox';
import { LayerSwitch } from './LayerSwitch';
import { Abschnitt } from './Objekte/Abschnitt';
import { TileLayer } from './openLayers/Layer';
import { Map } from './openLayers/Map';
import { PublicWFS } from './PublicWFS';
import { Measure } from './Tools/Measure';

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
    new LinienToolBox(map, sidebar);
    new SonstigesToolBox(map, sidebar);
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


    let other_div = document.createElement("div");
    other_div.id = "othermaps";
    other_div.className = "ol-control ol-unselectable";
    document.body.appendChild(other_div);

    let mapillary = document.createElement("button");
    mapillary.innerHTML = "Mappillary";
    other_div.appendChild(mapillary);
    mapillary.addEventListener("click", () => {
        let view = map.getView();
        let middle = toLonLat(view.getCenter(), CONFIG["EPSG_CODE"])
        let url = "https://www.mapillary.com/app/?lat=" + middle[1] + "&lng=" + middle[0] + "&z=" + (view.getZoom() - 2);
        let win = window.open(url, 'zweitkarte');
        win.focus();
    })

    let google = document.createElement("button");
    google.innerHTML = "Google";
    other_div.appendChild(google);
    google.addEventListener("click", () => {
        let view = map.getView();
        let middle = toLonLat(view.getCenter(), CONFIG["EPSG_CODE"])
        let url = "https://www.google.com/maps/@" + middle[1] + "," + middle[0] + "," + (view.getZoom() - 1) + "z";
        let win = window.open(url, 'zweitkarte');
        win.focus();
    })

    let geoportal = document.createElement("button");
    geoportal.innerHTML = "Geoportal";
    other_div.appendChild(geoportal);
    geoportal.addEventListener("click", () => {
        let view = map.getView();
        let middle = transform(view.getCenter(), CONFIG["EPSG_CODE"], "EPSG:25832")
        let zoom = Math.round(((view.getZoom() - 10) > 9) ? 9 : (view.getZoom() - 11))
        let url = "https://geofos.fhhnet.stadt.hamburg.de/FHH-Atlas/?center=" + middle[0] + "," + middle[1] + "&zoomlevel=" + zoom;
        let win = window.open(url, 'zweitkarte');
        win.focus();
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

function recreateHash(event: any) { //TODO: MapEvent
    //console.log(event)
    let map = event.target as Map;
    if (map.firstHash) {
        let view = map.getView();
        let hash = "#zoom=" + view.getZoom();
        hash += "&x=" + Math.round(view.getCenter()[0]);
        hash += "&y=" + Math.round(view.getCenter()[1]);

        let visible: number[] = []
        map.getLayers().forEach(
            function (layer: BaseLayer, id: number, __: BaseLayer[]) {
                if (layer.get('switchable') == true) {
                    if ((layer as BaseLayer).getVisible()) {
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
                visible: true,
                switchable: true,
                source: new OSM()
            }),
            new TileLayer({
                name: 'DOP',
                visible: false,
                switchable: true,
                opacity: 1,
                source: new TileWMS({
                    url: 'https://www.geoproxy.geoportal-th.de/geoproxy/services/DOP?',
                    params: {
                        'LAYERS': 'th_dop',
                        'FORMAT': 'image/png'
                    },
                    attributions: ['Freie und Hansestadt Hamburg, LGV 2019']
                })
            }),
            new TileLayer({
                name: 'TK',
                visible: false,
                switchable: true,
                opacity: 1,
                source: new TileWMS({
                    url: 'https://www.geoproxy.geoportal-th.de/geoproxy/services/UEK?',
                    params: {
                        'LAYERS': 'th_dtk',
                        'FORMAT': 'image/png'
                    },
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
            center: fromLonLat([11.03, 50.979], CONFIG["EPSG_CODE"]),
            zoom: 14,
            minZoom: 11,
            maxZoom: 24,
            //extent: transform([548000, 5916500, 588500, 5955000], 'EPSG:25832', CONFIG.EPSG_CODE),
        })
    });
}


