// Florian Timm - Version 2017.03.22
import Control from 'ol/control/Control.js';
import '../css/layerswitch.css';

class LayerSwitch extends Control {
	constructor(opt_options) {
		var options = opt_options || {};
		var element = document.createElement('div');
		super({
			element: element,
			target: options.target
		});

		var button = document.createElement('button');
		button.innerHTML = 'Layer';

		
		element.className = 'layerswitch ol-unselectable ol-control';
		element.appendChild(button);

		element.addEventListener('mouseenter', function () {
			//layerswi.style.height = "20em";
			//layerswi.style.overflow = "auto";
			let layers = this.getMap().getLayers();
			layers.forEach(function (layer, id, array) {
				if (layer.get('switchable') == true) {
					let div_layer = document.createElement('div');
					let bt_layer = document.createElement('button');
					div_layer.appendChild(bt_layer)
					bt_layer.innerHTML = layer.get('name');
					let div_zusatz = document.createElement('div');
					let label = document.createElement('label');
					label.setAttribute('for', 'trans_'+id);
					label.innerHTML = "Transparenz:";
					div_zusatz.appendChild(label);
					let trans = document.createElement('input');
					trans.setAttribute('type', 'range');
					trans.value = layer.getOpacity() * 100;
					trans.setAttribute('id', 'trans_'+id);
					trans.dataset.layer = id;
					div_zusatz.appendChild(trans);
					trans.addEventListener('change', function(event) {
						layer.setOpacity(trans.value / 100);
					});
					div_layer.appendChild(div_zusatz)
					
					if (layer.getVisible()) {
						bt_layer.style.backgroundColor = "green";
						div_zusatz.style.display = 'block';
					} else {
						bt_layer.style.backgroundColor = "grey";
						div_zusatz.style.display = 'none';
					}
					bt_layer.addEventListener('click', function () {
						layer.setVisible(!layer.getVisible());
						if (layer.getVisible()) {
							bt_layer.style.backgroundColor = "green";
							div_zusatz.style.display = 'block';
						} else {
							bt_layer.style.backgroundColor = "grey";
							div_zusatz.style.display = 'none';
						}
					});
					element.appendChild(div_layer);
				}
			});
		}.bind(this), false);
		element.addEventListener('mouseleave', function () {
			element.innerHTML = "";
			button.innerHTML = 'Layer';
			element.appendChild(button);
		}.bind(this), false);
	}
}

module.exports = LayerSwitch;