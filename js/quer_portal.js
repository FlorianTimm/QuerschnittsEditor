//////// Karte ///////////

ol.proj.proj4.register(proj4);

// Ausdehnung
var extent = [510000.0, 5850000.0, 625000.4, 6000000.0];

// Ansicht definieren
var view = new ol.View({
    projection: EPSG_CODE,
    center: ol.proj.transform([10.0045,53.4975], 'EPSG:4326', EPSG_CODE),
    zoom: 17,
    minZoom: 11,
	maxZoom: 24,
    extent: ol.proj.transform([ 548000,5916500,588500,5955000], 'EPSG:4326', EPSG_CODE),
});

////////////////////////////////////////////////////////////////////////////  Layer

// Attribution
var fhh = 'Freie und Hansestadt Hamburg | &copy 2018 LGV S2 Verkehrsdaten';

// Basis-Layer
var wms_geobasis = new ol.layer.Tile({
	title: "Geobasis",
	visible: true,
	source: new ol.source.TileWMS({
		url: 'http://geodienste.hamburg.de/HH_WMS_Kombi_DISK_GB',
		type: 'base',
		attributions: [fhh],
		params: {
			'LAYERS': '1,5,9,13',
			'FORMAT': 'image/png',
			'STYLES': 'default,default, default, default'
		}
	})
});
wms_geobasis.setOpacity(0.7);
var wms_dop = new ol.layer.Tile({
		name: 'LGV DOP10',
		//visible: false,
		opacity: 0.7,
		source: new ol.source.TileWMS({
			url: 'http://geodienste.hamburg.de/HH_WMS_DOP10',
			params: {
				'LAYERS': '1',
				'FORMAT': 'image/png'
			},
			serverType: /** @type {ol.source.wms.ServerType} */ ('geoserver'),
			attributions: [fhh]
		})
	})

var wms_quer = new ol.layer.Tile({
	name: "Querschnitte gruppiert",
	//visible: false,
	opacity: 0.6,
	source: new ol.source.TileWMS({
		url: 'http://gv-srv-w00118:20031/deegree/services/wms?',
		params: {
			'LAYERS': 'querschnitte',
			'STYLE': 'querschnitte_gruppiert',
			'FORMAT': 'image/png'   
		},
		serverType: /** @type {ol.source.wms.ServerType} */ ('geoserver'),
		attributions: [fhh]
	})
})


// Layerzusammenstellung
var layers = [
	wms_dop,
	//wms_quer,
];

// Erzeugen der Map
var map = new ol.Map({
	layers: layers,
	target: 'map',
	interactions: ol.interaction.defaults({
		pinchRotate: false
	}),
	view: view
});
