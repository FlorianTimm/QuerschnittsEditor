import Map from "../openLayers/Map";
import Tool from "../Tools/prototypes/Tool";

export default abstract class ToolBox {
    protected map: Map;
    protected sidebar: HTMLDivElement;
    protected form: HTMLInputElement;
    static radioButtons: { tool: Tool, radio: HTMLInputElement }[] = []

    protected abstract createToolBox(): void;

    constructor(map: Map, sidebar: HTMLDivElement, id: string) {
        this.map = map;
        this.sidebar = sidebar;
        this.form = document.getElementById(id) as HTMLInputElement;
    }

    public static start() {
        ToolBox.stop()
        if (ToolBox.radioButtons.length > 0) {
            ToolBox.radioButtons[0].radio.checked = true;
            ToolBox.radioButtons[0].tool.start();
        }
    }

    public static stop(uncheck: boolean = true) {
        for (let radio of ToolBox.radioButtons) {
            radio.tool.stop()
            if (uncheck) radio.radio.checked = false;
        }
    }

    public createRadio(text: string, tool: Tool) {
        ToolBox.createRadio(this.form, text, tool)
    }

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

