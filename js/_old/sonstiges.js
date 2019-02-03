
function quer_transp() {
    var wert = document.forms.abschnitt.quer_trans.value / 100;
    l_quer.setOpacity(wert * wert)
    l_trenn.setOpacity(wert)
    l_achse.setOpacity(wert)
    l_station.setOpacity(wert)
}



// Sonstige Overlays
var v_overlay = new ol.source.Vector({
    features: []
});

var l_overlay = new ol.layer.Vector({
    source: v_overlay,
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#dd0000',
            width: 3
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({ color: 'black' }),
            stroke: new ol.style.Stroke({
                color: [255, 0, 0], width: 2
            })
        }),
    })
});
map.addLayer(l_overlay);