import Map from "../openLayers/Map";
import Tool from "../Tools/prototypes/Tool";
import { VectorLayer } from "../openLayers/Layer";

/**
 * Klasse zum Erzeugen von Werkzeugkästen zur Auswahl des Bearbeitungswerkzeuges
 * @author Florian Timm
 * @version 2019-11-20
 * @license MIT
 */
export default abstract class ToolBox {

    /** Kartenobjekt */
    protected map: Map;
    /** DIV-Element, in den die _Tools_ geladen werden sollen */
    protected sidebar: HTMLDivElement;
    /** DIV-Element, in den die _Toolboxes_ geladen werden sollen */
    protected form: HTMLInputElement;
    /** Liste aller Radiobuttons */
    protected radioButtons: { tool: Tool, radio: HTMLInputElement }[] = []
    protected formid: string;
    protected layer: VectorLayer[] = [];
    static liste: { [formid: string]: ToolBox } = {};
    stopped: boolean;

    /**
     * Erzeugt das Menu zur Auswahl des Werkzeuges
     */
    protected abstract createToolBox(): void;

    /**
    * @param map Karte
    * @param sidebar DIV-Element, in den die Tools geladen werden sollen
    * @param formid ID des Form-Elementes, in den die Toolbox geladen werden soll
    */
    constructor(map: Map, sidebar: HTMLDivElement, formid: string) {
        this.map = map;
        this.sidebar = sidebar;
        this.formid = formid;
        this.form = document.getElementById(this.formid) as HTMLInputElement;
        ToolBox.liste[this.formid] = this;
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

        input.addEventListener("change", function (this: ToolBox) {
            this.stopAll(false);
            tool.start();
        }.bind(this));

        $(this.form).append($("<label />", {
            append: [input, "&nbsp;" + text]
        }));

        this.radioButtons.push({ tool: tool, radio: input })

        return input;
    }
}

