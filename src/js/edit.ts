/**
 * Startscript edit.html
 * @author Florian Timm, LGV HH 
 * @version 2019.06.06
 * @copyright MIT
 */

 import { View, MapEvent } from 'ol';
import { defaults as defaultInteractions } from 'ol/interaction';
import { defaults as defaultControls, ScaleLine, ZoomSlider } from 'ol/control';
import { Layer } from 'ol/layer';
import { TileWMS as TileWMS } from 'ol/source';
import { register } from 'ol/proj/proj4';
import { transform, fromLonLat } from 'ol/proj';
import 'babel-polyfill';

import Daten from './Daten';
import PublicWFS from './PublicWFS';

import QuerModifyTool from './Tools/Querschnitt/QuerModifyTool';
import QuerInfoTool from './Tools/Querschnitt/QuerInfoTool';
import QuerPartTool from './Tools/Querschnitt/QuerPartTool';
import QuerAddTool from './Tools/Querschnitt/QuerAddTool';
import QuerDelTool from './Tools/Querschnitt/QuerDelTool';
import QuerAdd2ER from './Tools/Querschnitt/QuerAdd2ER';

import AvInfoTool from './Tools/Aufstellvorrichtung/AvInfoTool';
import AvAdd from './Tools/Aufstellvorrichtung/AvAdd';
import AvDelete from './Tools/Aufstellvorrichtung/AvDelete';
import AvVzAdd from './Tools/Aufstellvorrichtung/AvVzAdd';
import AvMove from './Tools/Aufstellvorrichtung/AvMove';
import AvAdd2ER from './Tools/Aufstellvorrichtung/AvAdd2ER';

import Measure from './Measure';
import LayerSwitch from './LayerSwitch';
import OSM from 'ol/source/OSM';
import Map from './openLayers/Map';
import { TileLayer, ImageLayer } from './openLayers/Layer';
import StaticImage from 'ol/source/ImageStatic';
import proj4 from 'proj4';

var CONFIG: [string, string] = require('./config.json');

let urlParamER: RegExpExecArray = new RegExp('[\?&]er=([^&#]*)').exec(window.location.href);
let urlParamERNR: RegExpExecArray = new RegExp('[\?&]ernr=([^&#]*)').exec(window.location.href);
if (urlParamER == null || urlParamERNR == null) {
    PublicWFS.showMessage("Kein Ereignisraum ausgewählt!", true);
    location.href = "./index.html";
}
var er = decodeURI(urlParamER[1])
var ernr = decodeURI(urlParamERNR[1])
console.log("Ereignisraum: " + ernr);

let daten: Daten, infoTool: QuerInfoTool, editTool: QuerModifyTool, delTool: QuerDelTool, partTool: QuerPartTool, addTool: QuerAddTool, vsInfoTool: AvInfoTool, avAdd: AvAdd, avAdd2ER: AvAdd2ER, qsAdd2ER: QuerAdd2ER, avMove: AvMove, vzAdd: AvVzAdd, measure: Measure, avDel: AvDelete;

window.addEventListener('load', function () {
    proj4.defs("EPSG:31467", "+proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7 +units=m +no_defs");
    proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    register(proj4);


    var map = createMap();
    //console.log(map.getControls());

    if (document.location.hash != "") {
        let hash = document.location.hash.replace("#", "").split('&')

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
            map.getLayers().forEach(function (layer, id, array) {
                if (layer.get('switchable') == true) {
                    if (selection.indexOf(id + "") != -1) {
                        layer.setVisible(true);
                    } else {
                        layer.setVisible(false);
                    }
                }
            });
        }
    }
    map.getLayers().forEach(function (layer, id, array) {
        if (layer.get('switchable') == undefined || layer.get('switchable') == true) {
            layer.on("propertychange", recreateHash)
        }
    });
    map.firstHash = true;

    map.on("moveend", recreateHash);

    daten = new Daten(map, er, ernr);
    infoTool = new QuerInfoTool(map, daten);
    infoTool.start();
    editTool = new QuerModifyTool(map, daten, infoTool);
    delTool = new QuerDelTool(map, daten, infoTool);
    addTool = new QuerAddTool(map, daten, infoTool);
    partTool = new QuerPartTool(map, daten, infoTool);
    vsInfoTool = new AvInfoTool(map, daten.l_aufstell, "sidebar");
    avAdd = new AvAdd(map, daten);
    vzAdd = new AvVzAdd(map, daten);
    avMove = new AvMove(map, daten, vsInfoTool);
    avAdd2ER = new AvAdd2ER(map, daten);
    qsAdd2ER = new QuerAdd2ER(map, daten);
    measure = new Measure(map);
    avDel = new AvDelete(map, daten, daten.l_aufstell, "sidebar");

    document.getElementById("befehl_info").addEventListener('change', befehl_changed);
    document.getElementById("befehl_vsinfo").addEventListener('change', befehl_changed);
    document.getElementById("befehl_avadd").addEventListener('change', befehl_changed);
    document.getElementById("befehl_avdel").addEventListener('change', befehl_changed);
    document.getElementById("befehl_vzadd").addEventListener('change', befehl_changed);
    document.getElementById("befehl_modify").addEventListener('change', befehl_changed);
    document.getElementById("befehl_delete").addEventListener('change', befehl_changed);
    document.getElementById("befehl_part").addEventListener('change', befehl_changed);
    document.getElementById("befehl_add").addEventListener('change', befehl_changed);
    document.getElementById("befehl_avadd2er").addEventListener('change', befehl_changed);
    document.getElementById("befehl_avmove").addEventListener('change', befehl_changed);
    document.getElementById("befehl_qsadd2er").addEventListener('change', befehl_changed);
    document.getElementById("befehl_messen").addEventListener('change', befehl_changed);


    document.getElementById("zoomToExtent").addEventListener('click', function () {
        let minX = null, maxX = null, minY = null, maxY = null;
        let features = daten.l_achse.getSource().getFeatures();
        if (features.length == 0) {
            PublicWFS.showMessage("(noch) keine Geometrien geladen", true);
            return;
        }
        for (let f of features) {
            let p = f.getGeometry().getExtent();

            if (minX == null || minX > p[0]) minX = p[0];
            if (minY == null || minY > p[1]) minY = p[1];
            if (maxX == null || maxX < p[2]) maxX = p[2];
            if (maxY == null || maxY < p[3]) maxY = p[3];
        }
        map.getView().fit([minX, minY, maxX, maxY], { padding: [20, 240, 20, 20] })

        //map.getView().fit(daten.l_achse.getExtent());

        /*
        let extent = Daten.calcAbschnitteExtent(daten.l_achse.getSource().getFeatures());
        map.getView().fit(extent, { padding: [20, 240, 20, 20] })
        */
    })


    document.getElementById("loadExtent").addEventListener('click', function () {
        daten.loadExtent();
    })
    /*map.addEventListener('moveend', function (event) {
        if (map.getView().getResolution() < 0.03) {
            daten.loadExtent();
        }
    })*/

    document.getElementById("sucheButton").addEventListener('click', function () {
        daten.searchForStreet();
    })

    document.forms.namedItem("suche").addEventListener('submit', function (event: { preventDefault: () => void; }) {
        event.preventDefault();
        daten.searchForStreet();
    })
});


function recreateHash(event: MapEvent) {
    //console.log(event)
    if (event.target.firstHash) {
        let view = event.target.getView();
        let hash = "#zoom=" + view.getZoom();
        hash += "&x=" + Math.round(view.getCenter()[0]);
        hash += "&y=" + Math.round(view.getCenter()[1]);

        let visible = []
        event.target.getLayers().forEach(function (layer: { get: (arg0: string) => boolean; getVisible: () => void; }, id: any, array: any) {
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

function befehl_changed() {
    infoTool.stop();
    editTool.stop();
    delTool.stop();
    partTool.stop();
    addTool.stop();
    vsInfoTool.stop();
    avAdd.stop();
    avAdd2ER.stop();
    qsAdd2ER.stop();
    avMove.stop();
    vzAdd.stop();
    measure.stop();
    avDel.stop();

    if ((document.getElementById("befehl_info") as HTMLInputElement).checked)
        infoTool.start();
    else if ((document.getElementById("befehl_vsinfo") as HTMLInputElement).checked)
        vsInfoTool.start();
    else if ((document.getElementById("befehl_avadd") as HTMLInputElement).checked)
        avAdd.start();
    else if ((document.getElementById("befehl_avdel") as HTMLInputElement).checked)
        avDel.start();
    else if ((document.getElementById("befehl_vzadd") as HTMLInputElement).checked)
        vzAdd.start();
    else if ((document.getElementById("befehl_avadd2er") as HTMLInputElement).checked)
        avAdd2ER.start();
    else if ((document.getElementById("befehl_avmove") as HTMLInputElement).checked)
        avMove.start();
    else if ((document.getElementById("befehl_qsadd2er") as HTMLInputElement).checked)
        qsAdd2ER.start();
    else if ((document.getElementById("befehl_modify") as HTMLInputElement).checked)
        editTool.start();
    else if ((document.getElementById("befehl_delete") as HTMLInputElement).checked)
        delTool.start();
    else if ((document.getElementById("befehl_part") as HTMLInputElement).checked)
        partTool.start();
    else if ((document.getElementById("befehl_add") as HTMLInputElement).checked)
        addTool.start();
    else if ((document.getElementById("befehl_messen") as HTMLInputElement).checked)
        measure.start();
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
                name: 'LGV DOP10',
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
                name: 'LGV DOP20',
                visible: false,
                switchable: true,
                opacity: 0.7,
                source: new TileWMS({
                    url: 'http://geodienste.hamburg.de/HH_WMS_DOP20',
                    params: {
                        'LAYERS': '1',
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

function openTab(evt: MouseEvent) {
    // Declare all variables
    let i: number, tabcontent: HTMLCollectionOf<Element>, tablinks: HTMLCollectionOf<Element>;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        (tabcontent[i] as HTMLElement).style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    let tabName = (evt.currentTarget as HTMLElement).dataset.tab;
    document.getElementById(tabName).style.display = "block";
    (evt.currentTarget as HTMLElement).className += " active";
    document.getElementById(tabName).getElementsByTagName('input')[0].click();

    daten.modus = (evt.currentTarget as HTMLElement).dataset.tab.replace("tab_", "")
    daten.l_achse.changed();
}

window.addEventListener('load', function () {
    let tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].addEventListener('click', openTab);
    }
    document.getElementById("defaultOpen").click();
});




