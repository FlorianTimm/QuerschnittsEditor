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
import Modify from './Modify.js';
import Daten from './Daten.js';
import PublicWFS from './PublicWFS.js';
import InfoTool from './InfoTool.js';
import PartTool from './PartTool.js';
import AddTool from './AddTool.js';
import DelTool from './DelTool.js';
import { add } from 'ol/coordinate';

var CONFIG = require('./config.json');

var infoTool, editTool, delTool, partTool, addTool;

window.addEventListener('load', function () {
    proj4.defs("EPSG:31467", "+proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7 +units=m +no_defs");
    proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    register(proj4);

    var map = createMap();
    let urlParam = new RegExp('[\?&]er=([^&#]*)').exec(window.location.href);
    if (urlParam == null) {
        PublicWFS.showMessage("Kein Ereignisraum ausgewählt!", true);
        return;
    }
    var er = decodeURI(urlParam[1])
    console.log("Ereignisraum: " + er);
    let daten = new Daten(map, er);
    infoTool = new InfoTool(map, daten);
    infoTool.start();
    editTool = new Modify(map, daten, infoTool);
    delTool = new DelTool(map, daten, infoTool);
    addTool = new AddTool(map, daten, infoTool);
    partTool = new PartTool(map, daten, infoTool);

    document.getElementById("befehl_info").addEventListener('change', befehl_changed);
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

    if (document.getElementById("befehl_info").checked) 
        infoTool.start();
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
                    url: 'http://geodienste.hamburg.de/HH_WMS_DOP20',
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