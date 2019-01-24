
// Layer mit Querschnittsflächen
var v_quer = new ol.source.Vector({features: []});
var l_quer = new ol.layer.Vector({
    source: v_quer,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 128, 128, 0.2)'
        })
    })
});
map.addLayer(l_quer);


//Layer mit Trennlinien zwischen Querschnittsflächen
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
map.addLayer(l_trenn)


// Layer mit Stationen
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
map.addLayer(l_station);


// Layer mit Achsen
var v_achse = new ol.source.Vector({features: []});

var l_achse = new ol.layer.Vector({
    source: v_achse,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
            color: '#dd0000',
            width: 3
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
map.addLayer(l_achse); 
