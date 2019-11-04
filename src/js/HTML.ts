
import "./import_jquery.js";
import "../css/html_forms.css";

export default class HTML {


    static createSelectForm(form: HTMLFormElement, beschriftung: string, id: string, platzhalter = "Bitte auswählen...") {
        let label = HTML.createLabel(beschriftung, id, form);
        label.className = "label_select"
        HTML.createBreak(form);
        let select = document.createElement("select");
        select.style.marginBottom = "4px";
        select.style.width = "95%";
        select.id = id;
        select.dataset.placeholder = platzhalter;
        form.appendChild(select);
        return select;
    }

    public static createSelectNode(selectInput: HTMLSelectElement, text: string, value?: string, selected?: boolean) {
        let option = document.createElement('option');
        let t = document.createTextNode(text);
        option.appendChild(t);
        option.setAttribute('value', value);
        selectInput.appendChild(option);
        if (selected != undefined && selected)
            option.setAttribute("selected", "selected");
        return option;
    }

    static createTextInput(form: HTMLFormElement, beschriftung: string, id: string, inhalt?: string) {
        return HTML.createInputField("text", form, beschriftung, id, inhalt);
    }

    static createNumberInput(form: HTMLFormElement, beschriftung: string, id: string, inhalt?: string) {
        return HTML.createInputField("number", form, beschriftung, id, inhalt);
    }

    private static createInputField(type: "number" | "text", form: HTMLFormElement, beschriftung: string, id: string, inhalt?: string) {
        let label = HTML.createLabel(beschriftung, id, form);
        label.className = "label_" + type;
        HTML.createBreak(form);
        let input = document.createElement("input");
        input.id = id;
        input.type = type;
        form.appendChild(input);
        if (inhalt != undefined)
            input.value = inhalt;
        return input;
    }

    static createLabel(beschriftung: string, id: string, form: HTMLFormElement) {
        let label = document.createElement("label");
        label.style.fontSize = "8pt";
        label.textContent = beschriftung;
        label.htmlFor = id;
        form.appendChild(label);
        return label;
    }

    static createBreak(form: HTMLFormElement) {
        form.appendChild(document.createElement("br"));
    }

    static createToolForm(sidebar: HTMLElement, showForm: boolean = true, formId?: string) {
        //console.log(formId)
        let form = document.createElement("form");
        form.className = "tool_form";
        if (formId != undefined) form.id = formId;
        sidebar.appendChild(form);
        if (!showForm) $(form).hide();//form.style.display = 'none';
        return form;
    }
}