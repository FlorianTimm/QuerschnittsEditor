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
export class LayerSwitch extends Control {
	constructor(opt_options?: ControlOptions) {
		const options = opt_options || {};
		const element = document.createElement('div');
		super({
			element: element,
			target: options.target
		});

		const button = document.createElement('button');
		button.innerHTML = 'Layer';


		element.className = 'layerswitch ol-unselectable ol-control';
		element.appendChild(button);

		element.addEventListener('mouseenter', () => {
			//layerswi.style.height = "20em";
			//layerswi.style.overflow = "auto";
			let layers = (this as LayerSwitch).getMap().getLayers();
			layers.forEach((layer: BaseLayer, id: number) => {
				if (layer.get('switchable') == true) {
					let div_layer = document.createElement('div');
					let bt_layer = document.createElement('button');
					div_layer.appendChild(bt_layer)
					bt_layer.innerHTML = layer.get('name');
					let div_zusatz = document.createElement('div');
					let label = document.createElement('label');
					label.setAttribute('for', 'trans_' + id);
					label.innerHTML = "Transparenz:";
					label.style.marginLeft = "5px"
					div_zusatz.appendChild(label);
					let trans = document.createElement('input');
					trans.setAttribute('type', 'range');
					trans.value = String(layer.getOpacity() * 100);
					trans.setAttribute('id', 'trans_' + id);
					trans.dataset.layer = String(id);
					div_zusatz.appendChild(trans);
					trans.addEventListener('change', () => {
						layer.setOpacity(parseInt(trans.value) / 100);
					});
					div_layer.appendChild(div_zusatz)

					if (layer.getVisible()) {
						bt_layer.style.backgroundColor = "lightgreen";
						div_zusatz.style.display = 'block';
					} else {
						bt_layer.style.backgroundColor = "var(--ol-background-color)";
						div_zusatz.style.display = 'none';
					}
					bt_layer.addEventListener('click', () => {
						layer.setVisible(!layer.getVisible());
						if (layer.getVisible()) {
							bt_layer.style.backgroundColor = "lightgreen";
							div_zusatz.style.display = 'block';
						} else {
							bt_layer.style.backgroundColor = "var(--ol-background-color)";
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
