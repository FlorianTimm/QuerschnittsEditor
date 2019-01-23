//////// Karte ///////////

ol.proj.proj4.register(proj4);

// Ausdehnung
var extent = [510000.0, 5850000.0, 625000.4, 6000000.0];

// Ansicht definieren
var view = new ol.View({
    projection: 'EPSG:25832',
    center: ol.proj.transform([10.0045,53.4975], 'EPSG:4326', 'EPSG:25832'),
    zoom: 17,
    minZoom: 11,
	maxZoom: 22,
    extent: [ 548000,5916500,588500,5955000],
});

////////////////////////////////////////////////////////////////////////////  Layer

// Attribution
var fhh = 'Freie und Hansestadt Hamburg | &copy 2018 LGV S2 Verkehrsdaten';

// Basis-Layer
var geobasis = new ol.layer.Tile({
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
geobasis.setOpacity(0.7);
var dop = new ol.layer.Tile({
		name: 'LGV DOP10',
		visible: true,
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
dop.setOpacity(0.7);

var quer = new ol.layer.Tile({
		name: "Querschnitte gruppiert",
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

var v_achse = new ol.source.Vector({features: []});

var l_achse = new ol.layer.Vector({
    source: v_achse,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
            color: '#00dd00',
            width: 3.5
        }),
        image: new ol.style.Circle({
            radius: 5,
            fill: new ol.style.Fill({
                color: 'rgba(200, 0, 0, 0.2)'
            }),
			stroke: new ol.style.Stroke({
				color: 'rgba(200, 0, 0, 1)',
				width: 1.5
			})
        })
    })
});


var v_quer = new ol.source.Vector({features: []});

var l_quer = new ol.layer.Vector({
    source: v_quer,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 128, 128, 0.2)'
        })
    })
});

var v_trenn = new ol.source.Vector({features: []});

var l_trenn = new ol.layer.Vector({
    source: v_trenn,
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#00dd00',
            width: 2
        })
    })
});

var v_station = new ol.source.Vector({features: []});

var l_station = new ol.layer.Vector({
    source: v_station,
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#000000',
            width: 1
        }),
    })
});

// Layerzusammenstellung
var layers = [
	dop,
	//geobasis,
	quer,
	l_achse,
	l_quer,
	l_trenn,
	l_station
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

var select =  new ol.interaction.Select({layers: [l_trenn]});
map.addInteraction(select)

var modify =  new ol.interaction.Modify({/*source: v_trenn, */insertVertexCondition: ol.events.condition.never, features: select.getFeatures()});
map.addInteraction(modify)

modify.on('modifyend',function(e){
console.log("feature id is",e.features.getArray()[0].getId());
});


var snap =  new ol.interaction.Snap({source: v_trenn});
map.addInteraction(snap)