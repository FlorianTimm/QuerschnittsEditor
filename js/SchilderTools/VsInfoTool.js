import {Style, Stroke, Fill} from 'ol/style';
import { Select as SelectInteraction } from 'ol/interaction';

class VsInfoTool {
    constructor(map, layer, sidebar) {
        this.map = map;
        this.layer = layer;
        this.sidebar = document.getElementById(sidebar);

        this.infoField = document.createElement("form");
        this.sidebar.appendChild(this.infoField);
        this.infoField.style.display = "none";

        this.select = new SelectInteraction({
            layers: this.layer,
            hitTolerance: 10
        });
        this.select.on('select', this.featureSelected.bind(this))
    }

    featureSelected (event) {
        console.log(event);
        if (event.selected.length == 0) {
            this.infoField.style.display = "none";
            return;
        }
        this.infoField.style.display = "block";
        let auswahl = event.selected[0];

        this.infoField.innerHTML = auswahl.getHTMLInfo();
    }


    start() {
        this.map.addInteraction(this.select);
    }

    stop() {
        this.map.removeInteraction(this.select);
        this.infoField.style.display = "none";
    }

}

module.exports = VsInfoTool;