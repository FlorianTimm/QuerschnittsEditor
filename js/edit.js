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
import QuerEdit from './QuerEdit.js';
import Daten from './Daten.js';
import EPSG_CODE from './Config.js';


window.addEventListener('load', function () {
    proj4.defs("EPSG:31467", "+proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7 +units=m +no_defs");
    proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    register(proj4);

    var map = createMap();

    var daten = new Daten(map);
    var edit = new QuerEdit(daten);

    daten.getAbschnitt("test");
});


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
            projection: EPSG_CODE,
            center: fromLonLat([10.0045, 53.4975], EPSG_CODE),
            zoom: 17,
            minZoom: 11,
            maxZoom: 24,
            extent: transform([548000, 5916500, 588500, 5955000], 'EPSG:25832', EPSG_CODE),
        })
    });
}