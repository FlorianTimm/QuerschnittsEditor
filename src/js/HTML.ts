export default class HTML {

    static createSelectForm(form: HTMLFormElement, beschriftung: string, id: string) {
        HTML.createLabel(beschriftung, id, form);
        HTML.createBreak(form);
        let select = document.createElement("select");
        select.id = id;
        form.appendChild(select);
        return select;
    }

    static createTextInput(form: HTMLFormElement, beschriftung: string, id: string, inhalt?: string) {
        HTML.createLabel(beschriftung, id, form);
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
}