// Layer mit Querschnittsflächen
var v_quer = new ol.source.Vector({
  features: []
});

function fill_style (color) {
	return new ol.style.Style({
    fill: new ol.style.Fill({
      color: color
    })
  })
}

var l_quer = new ol.layer.Vector({
  source: v_quer,
  opacity: 0.36,
  style: function(feature, resolution) {
    var art = Number(feature.get('art'));
	if ((art >= 100 && art <=119) || (art >= 122 && art <=161) || (art >= 163 && art <=179) || art == 312) return fill_style('#444444');	// Fahrstreifen
	else if (art >= 180 && art <=183) return fill_style('#333366');	// Parkstreifen
	else if (art >= 940 && art <=942) return fill_style('#F914B8'); // Busanlagen
	else if (art == 210) return fill_style('#2222ff');	// Gehweg
	else if ((art >= 240 && art <=243) || art == 162) return fill_style('#333366');	// Radweg
	else if (art == 250 || art == 251) return fill_style('#cc22cc');	// Fuß-Rad-Weg
	else if (art == 220) return fill_style('#ffdd00');	// paralleler Wirtschaftsweg
	else if (art == 420 || art == 430 || art == 900) return fill_style('#ffffff');	// Markierungen
	else if (art == 310 || art == 311 || art == 313 || art == 320 || art == 330 || (art >= 910 && art <= 916)) return fill_style('#eeeeee');	// Trenn-, Schutzstreifen und Schwellen
	else if (art == 120 || art == 121) return fill_style('#1F2297');	// Rinne
	else if (art == 301) return fill_style('#759F1E');	// Banket
	else if (art == 510 || art == 511 || art == 520) return fill_style('#120a8f');	// Gräben und Mulden
	else if (art == 700 || art == 710) return fill_style('#004400');	// Böschungen
	else if (art == 314 || art == 315) return fill_style('#8A60D8');	// Inseln
	else if (art == 400 || art == 410 || art == 715) return fill_style('#8A60D8');	// Randstreifen und Sichtflächen
	else if (art == 600 || art == 610 || art == 620 || art == 630 || art == 640) return fill_style('#C1BAC8');	// Borde und Kantsteine
	else if (art == 340) return fill_style('#000000');	// Gleiskörper
	else if (art == 999) return fill_style('#888888');	// Bestandsachse
	else if (art == 990 || art == 720) return fill_style('#FC8A57');	// sonstige Streifenart
	else return fill_style('#ffffff');
  }
});
map.addLayer(l_quer);


function quer_transp() {
	var wert = document.forms.abschnitt.quer_trans.value / 100;
	l_quer.setOpacity(wert*wert)
	l_trenn.setOpacity(wert)
	l_achse.setOpacity(wert)
	l_station.setOpacity(wert)
}



//Layer mit Trennlinien zwischen Querschnittsflächen
var v_trenn = new ol.source.Vector({
  features: []
});
var l_trenn = new ol.layer.Vector({
  source: v_trenn,
  opacity: 0.6,
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#00dd00',
      width: 2
    })
  })
});
map.addLayer(l_trenn)


// Layer mit Stationen
var v_station = new ol.source.Vector({
  features: []
});

var l_station = new ol.layer.Vector({
  source: v_station,
  opacity: 0.6,
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#000000',
      width: 1
    }),
  })
});
map.addLayer(l_station);


// Layer mit Achsen
var v_achse = new ol.source.Vector({
  features: []
});

var l_achse = new ol.layer.Vector({
  source: v_achse,
  opacity: 0.6,
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#dd0000',
      width: 3
    })
  })
});
map.addLayer(l_achse);


// Sonstige Overlays
var v_overlay = new ol.source.Vector({
  features: []
});

var l_overlay = new ol.layer.Vector({
  source: v_overlay,
  opacity: 0.6,
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#dd0000',
      width: 3
    }),
	image: new ol.style.Circle({
        radius: 7,
        fill: new ol.style.Fill({color: 'black'}),
        stroke: new ol.style.Stroke({
          color: [255,0,0], width: 2
        })
    }),
  })
});
map.addLayer(l_overlay);