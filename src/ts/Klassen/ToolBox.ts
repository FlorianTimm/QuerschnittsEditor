import Map from "../openLayers/Map";
import Tool from "../Tools/prototypes/Tool";

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
    /** Liste aller Radiobuttons _aller_ Werkzeuge */
    static radioButtons: { tool: Tool, radio: HTMLInputElement }[] = []

    /**
     * Erzeugt das Menu zur Auswahl des Werkzeuges
     */
    protected abstract createToolBox(): void;

    /**
    * @param map Karte
    * @param sidebar DIV-Element, in den die Tools geladen werden sollen
    * @param id ID des Form-Elementes, in den die Toolbox geladen werden soll
    */
    constructor(map: Map, sidebar: HTMLDivElement, id: string) {
        this.map = map;
        this.sidebar = sidebar;
        this.form = document.getElementById(id) as HTMLInputElement;
    }

    /**
     * Soll aufgerufen werden, wenn eine Toolbox ausgewählt wird
     */
    public static start() {
        ToolBox.stop()
        if (ToolBox.radioButtons.length > 0) {
            ToolBox.radioButtons[0].radio.checked = true;
            ToolBox.radioButtons[0].tool.start();
        }
    }

    /**
     * Beendet die Nutzung aller Toolboxen - wird bei der Verwendung einer neuen ausgeführt
     * @param uncheck Wenn wahr, werden alle Haken im Menü entfernt
     */
    public static stop(uncheck: boolean = true) {
        for (let radio of ToolBox.radioButtons) {
            radio.tool.stop()
            if (uncheck) radio.radio.checked = false;
        }
    }

    /**
     * Erzeugt einen neuen Radiobutton in der aktuellen Toolbox
     * @param text Beschriftung des Radiobuttons
     * @param tool Tool, welches durch den Radiobutton gesteuert wird
     */
    public createRadio(text: string, tool: Tool) {
        ToolBox.createRadio(this.form, text, tool)
    }

    /**
    * Erzeugt einen neuen Radiobutton im ausgewählten Bereich
    * @param form Bereich, in den der neue Button angefügt werden sollte
    * @param text Beschriftung des Radiobuttons
    * @param tool Tool, welches durch den Radiobutton gesteuert wird
    */
    public static createRadio(form: HTMLDivElement, text: string, tool: Tool): HTMLInputElement {
        let input = document.createElement("input");
        input.type = "radio";
        input.name = "toolbox_radio";

        input.addEventListener("change", function () {
            ToolBox.stop(false);
            tool.start();
        });

        $(form).append($("<label />", {
            append: [input, "&nbsp;" + text]
        }));

        ToolBox.radioButtons.push({ tool: tool, radio: input })

        return input;
    }
}

