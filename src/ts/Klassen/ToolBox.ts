// SPDX-License-Identifier: GPL-3.0-or-later

import { LineString, MultiLineString, Point, Polygon } from "ol/geom";
import VectorSource from "ol/source/Vector";
import { Daten } from "../Daten";
import { Abschnitt } from "../Objekte/Abschnitt";
import { VectorLayer } from "../openLayers/Layer";
import { Map } from "../openLayers/Map";
import { Tool } from "../Tools/prototypes/Tool";

/**
 * Klasse zum Erzeugen von Werkzeugkästen zur Auswahl des Bearbeitungswerkzeuges
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.11.20
 * @license GPL-3.0-or-later
*/
export abstract class ToolBox {

    /** Kartenobjekt */
    protected map: Map;
    /** DIV-Element, in den die _Tools_ geladen werden sollen */
    protected sidebar: HTMLDivElement;
    /** DIV-Element, in den die _Toolboxes_ geladen werden sollen */
    protected form: HTMLInputElement;
    /** Liste aller Radiobuttons */
    protected radioButtons: { tool: Tool, radio: HTMLInputElement }[] = []
    protected formid: string;
    protected layer: VectorLayer<VectorSource<Point | Polygon | MultiLineString | LineString>>[] = [];
    static liste: { [objektKlasse: string]: ToolBox } = {};
    stopped: boolean;
    private static selectBox: HTMLSelectElement;

    /**
     * Erzeugt das Menu zur Auswahl des Werkzeuges
     */
    protected abstract createToolBox(): void;

    /**
    * @param map Karte
    * @param sidebar DIV-Element, in den die Tools geladen werden sollen
    * @param formid ID des Form-Elementes, in den die Toolbox geladen werden soll (bei Objektklassen, die WFS Bezeichnung)
    * @param beschriftung
    * @param color Hintergrundfarbe für Option und Box
    */
    constructor(map: Map, sidebar: HTMLDivElement, formid: string, beschriftung?: string, color?: string) {
        this.map = map;
        this.sidebar = sidebar;
        this.formid = formid;

        if (!ToolBox.selectBox) {
            ToolBox.selectBox = document.createElement("select");
            document.getElementById("toolboxen").appendChild(ToolBox.selectBox)

            $(ToolBox.selectBox).selectmenu({
                width: 210,
                change: () => {
                    $(ToolBox.getByFormId(Daten.getInstanz().modus).form).hide();
                    ToolBox.getByFormId(Daten.getInstanz().modus).stop()
                    $(ToolBox.getByFormId(ToolBox.selectBox.value).form).show();
                    ToolBox.getByFormId(ToolBox.selectBox.value).start()
                    Daten.getInstanz().modus = ToolBox.selectBox.value;
                    Abschnitt.getLayer().changed();
                }
            });
        }

        this.form = document.createElement('div') as HTMLInputElement;
        if (color) this.form.style.backgroundColor = color;
        document.getElementById("toolboxen").appendChild(this.form);

        if (beschriftung) {
            let opt = document.createElement("option")
            opt.innerHTML = beschriftung;
            opt.value = formid;
            if (color) opt.style.backgroundColor = color;
            ToolBox.selectBox.appendChild(opt);
            $(ToolBox.selectBox).selectmenu("refresh");

            if (Daten.getInstanz().modus != formid) {
                this.form.style.display = "none";
            } else {
                opt.selected = true;
            }
        }

        this.form.id = formid;
        ToolBox.liste[formid] = this;
    }

    public getId() {
        return this.getId;
    }

    public static getByFormId(formid: string): ToolBox {
        return ToolBox.liste[formid]
    }

    /**
     * Soll aufgerufen werden, wenn eine Toolbox ausgewählt wird
     */
    public start() {
        this.stopAll()
        if (this.radioButtons.length > 0) {
            this.radioButtons[0].radio.checked = true;
            this.radioButtons[0].tool.start();
        }

        // Layer einblenden
        if (!this.stopped) return;
        for (let layer of this.layer) {
            layer.setOpacity(layer.getOpacity() * 2)
        }
        this.stopped = false;
    }

    public stop(uncheck: boolean = true, justTools = false) {
        for (let radio of this.radioButtons) {
            radio.tool.stop()
            if (uncheck) radio.radio.checked = false;
        }

        // Layer ausblenden
        if (justTools || this.stopped) return;
        for (let layer of this.layer) {
            layer.setOpacity(layer.getOpacity() / 2)
        }
        this.stopped = true;
    }

    /**
     * Beendet die Nutzung aller Toolboxen - wird bei der Verwendung einer neuen ausgeführt
     * @param uncheck Wenn wahr, werden alle Haken im Menü entfernt
     */
    private stopAll(uncheck: boolean = true) {
        for (let box in ToolBox.liste) {
            ToolBox.liste[box].stop(uncheck, ToolBox.liste[box] == this)
        }
    }

    /**
     * Erzeugt einen neuen Radiobutton in der aktuellen Toolbox
     * @param text Beschriftung des Radiobuttons
     * @param tool Tool, welches durch den Radiobutton gesteuert wird
     */
    public createRadio(text: string, tool: Tool) {
        let input = document.createElement("input");
        input.type = "radio";
        input.name = "toolbox_radio";

        input.addEventListener("change", () => {
            this.stopAll(false);
            tool.start();
        });

        $(this.form).append($("<label />", {
            append: [input, "&nbsp;" + text]
        }));

        this.radioButtons.push({ tool: tool, radio: input })

        return input;
    }
}

