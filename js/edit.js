import 'ol/ol.css';
import '../css/edit.css';
import { Map, View } from 'ol';
import { defaults as defaultInteractions } from 'ol/interaction.js';
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

var CONFIG = require('./config.json');

let urlParam = new RegExp('[\?&]er=([^&#]*)').exec(window.location.href);
if (urlParam == null) {
    PublicWFS.showMessage("Kein Ereignisraum ausgewählt!", true);
    location.href = "./index.html";
    return;
}
var er = decodeURI(urlParam[1])
console.log("Ereignisraum: " + er);

let infoTool, editTool, delTool, partTool, addTool, vsInfoTool, avAdd;

window.addEventListener('load', function () {
    
    proj4.defs("EPSG:31467", "+proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7 +units=m +no_defs");
    proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    register(proj4);

    var map = createMap();

    let daten = new Daten(map, er);
    infoTool = new InfoTool(map, daten);
    infoTool.start();
    editTool = new ModifyTool(map, daten, infoTool);
    delTool = new DelTool(map, daten, infoTool);
    addTool = new AddTool(map, daten, infoTool);
    partTool = new PartTool(map, daten, infoTool);
    vsInfoTool = new VsInfoTool(map, [daten.l_aufstell], "sidebar");
    avAdd = new AvAdd(map, daten); //map, daten.l_aufstell, er, "sidebar");

    document.getElementById("befehl_info").addEventListener('change', befehl_changed);
    document.getElementById("befehl_vsinfo").addEventListener('change', befehl_changed);
    document.getElementById("befehl_avadd").addEventListener('change', befehl_changed);
    document.getElementById("befehl_modify").addEventListener('change', befehl_changed);
    document.getElementById("befehl_delete").addEventListener('change', befehl_changed);
    document.getElementById("befehl_part").addEventListener('change', befehl_changed);
    document.getElementById("befehl_add").addEventListener('change', befehl_changed);

});

function befehl_changed() {
    infoTool.stop();
    editTool.stop();
    delTool.stop();
    partTool.stop();
    addTool.stop();
    vsInfoTool.stop();
    avAdd.stop();

    if (document.getElementById("befehl_info").checked)
        infoTool.start();
    else if (document.getElementById("befehl_vsinfo").checked)
        vsInfoTool.start();
    else if (document.getElementById("befehl_avadd").checked)
        avAdd.start();
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
                name: 'LGV DOP10',
                //visible: false,
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
            /*
            new TileLayer({
                name: "Querschnitte gruppiert",
                //visible: false,
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
            */
        ],
        target: 'map',
        interactions: defaultInteractions({
            pinchRotate: false
        }),
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
}

window.addEventListener('load', function () {
    let tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].addEventListener('click', openTab);
    }
    document.getElementById("defaultOpen").click();
});