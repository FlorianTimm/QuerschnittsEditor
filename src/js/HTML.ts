export default class HTML {
    
    static createSelectForm(form: HTMLFormElement, beschriftung: string, id: string) {
        HTML.createLabel(beschriftung, id, form);
        form.appendChild(document.createElement("br"));
        let select = document.createElement("select");
        select.id = id;
        form.appendChild(select);
        return select;
    }

    static createTextInput(form: HTMLFormElement, beschriftung: string, id: string) {
        HTML.createLabel(beschriftung, id, form);
        let input = document.createElement("input");
        input.id = id;
        input.type = "text"
        form.appendChild(input);
        return input;
    }

    static createLabel(beschriftung: string, id: string, form: HTMLFormElement) {
        let label = document.createElement("label");
        label.textContent = beschriftung;
        label.htmlFor = id;
        form.appendChild(label);
        return label;
    }

    static createBreak(form: HTMLFormElement) {
        form.appendChild(document.createElement("br"));
    }
}