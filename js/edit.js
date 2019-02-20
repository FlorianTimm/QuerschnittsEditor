import 'ol/ol.css';
import '../css/edit.css';
import { Map, View } from 'ol';
import { defaults as defaultInteractions } from 'ol/interaction.js';
import { defaults as defaultControls } from 'ol/control.js';
import { Tile as TileLayer } from 'ol/layer';
import { TileWMS as TileWMS } from 'ol/source';
import { register } from 'ol/proj/proj4.js';
import proj4 from 'proj4';
import { transform, fromLonLat } from 'ol/proj.js';
import '@babel/polyfill';
import ModifyTool from './QuerTools/ModifyTool.js';
import Daten from './Daten.js';
import PublicWFS from './PublicWFS.js';
import InfoTool from './QuerTools/InfoTool.js';
import PartTool from './QuerTools/PartTool.js';
import AddTool from './QuerTools/AddTool.js';
import DelTool from './QuerTools/DelTool.js';
import VsInfoTool from './SchilderTools/VsInfoTool.js';
import AvAdd from './SchilderTools/AvAdd.js';
import VzAdd from './SchilderTools/VzAdd.js';
import AvMove from './SchilderTools/AvMove.js';
import AvAdd2ER from './SchilderTools/AvAdd2ER.js';
import QsAdd2ER from './QuerTools/QsAdd2ER.js';
import LayerSwitch from './LayerSwitch.js';

var CONFIG = require('./config.json');

let urlParamER = new RegExp('[\?&]er=([^&#]*)').exec(window.location.href);
let urlParamERNR = new RegExp('[\?&]ernr=([^&#]*)').exec(window.location.href);
if (urlParamER == null || urlParamERNR == null) {
    PublicWFS.showMessage("Kein Ereignisraum ausgewählt!", true);
    location.href = "./index.html";
}
var er = decodeURI(urlParamER[1])
var ernr = decodeURI(urlParamERNR[1])
console.log("Ereignisraum: " + ernr);

let daten, infoTool, editTool, delTool, partTool, addTool, vsInfoTool, avAdd, avAdd2ER, qsAdd2ER, avMove, vzAdd;

window.addEventListener('load', function () {

    proj4.defs("EPSG:31467", "+proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7 +units=m +no_defs");
    proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    register(proj4);

    var map = createMap();
    //console.log(map.getControls());

    if (document.location.hash != "") {
        let hash = document.location.hash.replace("#", "").split('&')

        let hashP = {}

        for (let i = 0; i < hash.length; i++) {
            let t = hash[i].split("=");
            hashP[t[0]] = t[1];
        }

        if ("zoom" in hashP) {
            map.getView().setZoom(parseInt(hashP['zoom']));
        }

        if ("x" in hashP && "y" in hashP) {
            map.getView().setCenter([parseFloat(hashP['x']), parseFloat(hashP['y'])]);
        }

        if ("layer" in hashP) {
            let selection = hashP['layer'].split(',');
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
    infoTool = new InfoTool(map, daten);
    infoTool.start();
    editTool = new ModifyTool(map, daten, infoTool);
    delTool = new DelTool(map, daten, infoTool);
    addTool = new AddTool(map, daten, infoTool);
    partTool = new PartTool(map, daten, infoTool);
    vsInfoTool = new VsInfoTool(map, [daten.l_aufstell], "sidebar");
    avAdd = new AvAdd(map, daten); //map, daten.l_aufstell, er, "sidebar");
    vzAdd = new VzAdd(map, daten);
    avMove = new AvMove(map, daten, vsInfoTool);
    avAdd2ER = new AvAdd2ER(map, daten);
    qsAdd2ER = new QsAdd2ER(map, daten);

    document.getElementById("befehl_info").addEventListener('change', befehl_changed);
    document.getElementById("befehl_vsinfo").addEventListener('change', befehl_changed);
    document.getElementById("befehl_avadd").addEventListener('change', befehl_changed);
    document.getElementById("befehl_vzadd").addEventListener('change', befehl_changed);
    document.getElementById("befehl_modify").addEventListener('change', befehl_changed);
    document.getElementById("befehl_delete").addEventListener('change', befehl_changed);
    document.getElementById("befehl_part").addEventListener('change', befehl_changed);
    document.getElementById("befehl_add").addEventListener('change', befehl_changed);
    document.getElementById("befehl_avadd2er").addEventListener('change', befehl_changed);
    document.getElementById("befehl_avmove").addEventListener('change', befehl_changed);
    document.getElementById("befehl_qsadd2er").addEventListener('change', befehl_changed);


    document.getElementById("zoomToExtent").addEventListener('click', function () {
        let minX = null, maxX = null, minY = null, maxY = null;
        for (let f of daten.l_achse.getSource().getFeatures()) {
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

    document.forms.suche.addEventListener('submit', function (event) {
        event.preventDefault();
        daten.searchForStreet();
    })
});


function recreateHash(event) {
    //console.log(event)
    if (event.target.firstHash) {
        let view = event.target.getView();
        let hash = "#zoom=" + view.getZoom();
        hash += "&x=" + Math.round(view.getCenter()[0]);
        hash += "&y=" + Math.round(view.getCenter()[1]);

        let visible = []
        event.target.getLayers().forEach(function (layer, id, array) {
            if (layer.get('switchable') == true) {
                if (layer.getVisible()) {
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

    if (document.getElementById("befehl_info").checked)
        infoTool.start();
    else if (document.getElementById("befehl_vsinfo").checked)
        vsInfoTool.start();
    else if (document.getElementById("befehl_avadd").checked)
        avAdd.start();
    else if (document.getElementById("befehl_vzadd").checked)
        vzAdd.start();
    else if (document.getElementById("befehl_avadd2er").checked)
        avAdd2ER.start();
    else if (document.getElementById("befehl_avmove").checked)
        avMove.start();
    else if (document.getElementById("befehl_qsadd2er").checked)
        qsAdd2ER.start();
    else if (document.getElementById("befehl_modify").checked)
        editTool.start();
    else if (document.getElementById("befehl_delete").checked)
        delTool.start();
    else if (document.getElementById("befehl_part").checked)
        partTool.start();
    else if (document.getElementById("befehl_add").checked)
        addTool.start();
}

function createMap() {
    return new Map({
        layers: [
            new TileLayer({
                name: 'ALKIS',
                visible: false,
                switchable: true,
                opacity: 1,
                source: new TileWMS({
                    url: 'http://geodienste.hamburg.de/HH_WMS_ALKIS_Basiskarte',
                    params: {
                        'LAYERS': '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,20,21,23,24,25,26,28,29,30,31,32',
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
        controls: defaultControls().extend([new LayerSwitch()]),
        view: new View({
            projection: CONFIG.EPSG_CODE,
            center: fromLonLat([10.0045, 53.4975], CONFIG.EPSG_CODE),
            zoom: 17,
            minZoom: 11,
            maxZoom: 24,
            extent: transform([548000, 5916500, 588500, 5955000], 'EPSG:25832', CONFIG.EPSG_CODE),
        })
    });
}

function openTab(evt) {
    // Declare all variables
    let i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    let tabName = evt.currentTarget.dataset.tab;
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
    document.getElementById(tabName).getElementsByTagName('input')[0].click();

    daten.modus = evt.currentTarget.dataset.tab.replace("tab_", "")
    daten.l_achse.changed();
}

window.addEventListener('load', function () {
    let tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].addEventListener('click', openTab);
    }
    document.getElementById("defaultOpen").click();
});





