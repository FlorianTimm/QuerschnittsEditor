// Florian Timm - Version 2017.03.22
import Control from 'ol/control/Control.js';

class LayerSwitch extends Control {

    constructor () {
        super();
    

    var button = document.createElement('button');
    button.innerHTML = 'Layer';
    
    var layerswi = document.createElement('div');
    layerswi.className = 'layerswitch ol-unselectable ol-control';
    layerswi.appendChild(button);

    var this_ = this;
    var handleRotateNorth = function() {
        this_.getMap().getView().setRotation(0);
    };
	

    button.addEventListener('click', handleRotateNorth, false);
    layerswi.addEventListener('mouseenter', function () {
    	//layerswi.style.height = "20em";
    	//layerswi.style.overflow = "auto";
    	var layers = this_.getMap().getLayers();
    	layers.forEach (function (layer,id,array) {
			if (layer.get('switchable') == undefined || layer.get('switchable') == true) {
				var span = document.createElement('button');
				span.innerHTML = layer.get('name');
				if (layer.getVisible()) {
					span.style.backgroundColor = "green";
				} else {
					span.style.backgroundColor = "grey";
				}
				span.addEventListener('click', function () {
					layer.setVisible(!layer.getVisible());
					if (layer.getVisible()) {
						span.style.backgroundColor = "green";
					} else {
						span.style.backgroundColor = "grey";
					}
				});
				layerswi.appendChild(span);
			}
    	});
    }, false);
    layerswi.addEventListener('mouseleave', function () {
    	layerswi.innerHTML = "";
    	button.innerHTML = 'Layer';
    	layerswi.appendChild(button);
    	//layerswi.style.height = "inherit";
    	//button.style.width = "inherit";
    }, false);
    
    button.addEventListener('touchstart', handleRotateNorth, false);

    

    ol.control.Control.call(this, {
        element: layerswi,
        target: options.target
    });
}