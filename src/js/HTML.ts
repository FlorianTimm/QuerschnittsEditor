export default class HTML {

    static createSelectForm(form: HTMLFormElement, beschriftung: string, id: string) {
        let label = HTML.createLabel(beschriftung, id, form);
        label.className = "label_select"
        HTML.createBreak(form);
        let select = document.createElement("select");
        select.style.marginBottom = "4px";
        select.style.width = "95%";
        select.id = id;
        form.appendChild(select);
        return select;
    }

    static createTextInput(form: HTMLFormElement, beschriftung: string, id: string, inhalt?: string) {
        let label = HTML.createLabel(beschriftung, id, form);
        label.className = "label_text";
        HTML.createBreak(form);
        let input = document.createElement("input");
        input.id = id;
        input.type = "text"
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

    static createToolForm(sidebar: HTMLElement, showForm: boolean = true, formId?: string, ) {
        let form = document.createElement("form");
        form.className = "tool_form";
        if (formId != undefined) form.id = formId;
        sidebar.appendChild(form);
        if (!showForm) form.style.display = "none";
        return form;
    }
}