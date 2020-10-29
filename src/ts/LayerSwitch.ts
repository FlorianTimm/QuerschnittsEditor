// SPDX-License-Identifier: GPL-3.0-or-later

import Control, { Options as ControlOptions } from 'ol/control/Control.js';
import BaseLayer from 'ol/layer/Base';
import '../css/layerswitch.css';

/**
 * OpenLayers-Control zum Wechseln des Layers
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.06.06
 * @license GPL-3.0-or-later
*/
class LayerSwitch extends Control {
	constructor(opt_options?: ControlOptions) {
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

		element.addEventListener('mouseenter', () => {
			//layerswi.style.height = "20em";
			//layerswi.style.overflow = "auto";
			let layers = (this as LayerSwitch).getMap().getLayers();
			layers.forEach(function (layer: BaseLayer, id: number) {
				if (layer.get('switchable') == true) {
					let div_layer = document.createElement('div');
					let bt_layer = document.createElement('button');
					div_layer.appendChild(bt_layer)
					bt_layer.innerHTML = layer.get('name');
					let div_zusatz = document.createElement('div');
					let label = document.createElement('label');
					label.setAttribute('for', 'trans_' + id);
					label.innerHTML = "Transparenz:";
					div_zusatz.appendChild(label);
					let trans = document.createElement('input');
					trans.setAttribute('type', 'range');
					trans.value = String(layer.getOpacity() * 100);
					trans.setAttribute('id', 'trans_' + id);
					trans.dataset.layer = String(id);
					div_zusatz.appendChild(trans);
					trans.addEventListener('change', function (__) {
						layer.setOpacity(parseInt(trans.value) / 100);
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
		}, false);
		element.addEventListener('mouseleave', () => {
			element.innerHTML = "";
			button.innerHTML = 'Layer';
			element.appendChild(button);
		}, false);
	}
}

export default LayerSwitch;