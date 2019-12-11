import "./import_jquery.js";
import "../css/html_forms.css";

export default class HTML {


    static createFormGroup(form: HTMLFormElement | HTMLDivElement, id?: string): HTMLDivElement {
        let formGroup = document.createElement("div")
        formGroup.className = "form_group";
        form.appendChild(formGroup);
        if (id != undefined) formGroup.id = id;
        return formGroup
    }

    static createSelectForm(form: HTMLFormElement | HTMLDivElement, beschriftung: string, id: string, platzhalter?: string) {
        let formGroup = HTML.createFormGroup(form, 'group_' + id);
        let label = HTML.createLabel(beschriftung, id, formGroup, 'label_' + id);
        label.className = 'label_select'
        HTML.createBreak(formGroup);
        let select = document.createElement('select');
        select.id = id;
        if (platzhalter != undefined) select.dataset.placeholder = platzhalter;
        formGroup.appendChild(select);
        return select;
    }

    static createButton(form: HTMLFormElement | HTMLDivElement, beschriftung: string, id: string) {
        let formGroup = HTML.createFormGroup(form, 'group_' + id);
        let input = document.createElement('input');
        input.id = id;
        input.type = 'button';
        formGroup.appendChild(input);
        input.value = beschriftung;
        return input;
    }

    static createCheckbox(form: HTMLFormElement | HTMLDivElement, name: string, id: string, beschriftung: string) {
        let input = HTML.createSimpleInput(form, "checkbox", id, name);
        let label = HTML.createLabel(beschriftung, id, form, 'label_' + id);
        label.className = "label_checkbox"
        return input;
    }

    private static createSimpleInput(form: HTMLFormElement | HTMLDivElement, type: string, id: string, name?: string, value?: string) {
        let input = document.createElement("input");
        input.id = id;
        input.type = type;
        if (name) input.name = name;
        if (value) input.value = value;
        form.appendChild(input);
        return input;
    }

    static createRadio(form: HTMLFormElement | HTMLDivElement, name: string, value: string, id: string, beschriftung: string) {
        let input = HTML.createSimpleInput(form, "radio", id, name, value);
        let label = HTML.createLabel(beschriftung, id, form, 'label_' + id);
        label.className = "label_radio"

        return input;
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

    static createTextInput(form: HTMLFormElement | HTMLDivElement, beschriftung: string, id: string, inhalt?: string) {
        return HTML.createInputField("text", form, beschriftung, id, inhalt);
    }

    static createNumberInput(form: HTMLFormElement | HTMLDivElement, beschriftung: string, id: string, inhalt?: string) {
        let input = HTML.createInputField("number", form, beschriftung, id, inhalt);
        return input;
    }

    static createDateInput(form: HTMLFormElement | HTMLDivElement, beschriftung: string, id: string, inhalt?: string) {
        let aufstellField = HTML.createInputField("text", form, beschriftung, id, inhalt);

        aufstellField.autocomplete = "off";
        $.datepicker.regional['de'] = {
            closeText: 'Done',
            prevText: 'Prev',
            nextText: 'Next',
            currentText: 'heute',
            monthNames: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
            monthNamesShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
                'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
            dayNames: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
            dayNamesShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
            dayNamesMin: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
            weekHeader: 'KW',
            dateFormat: 'dd.mm.yy',
            firstDay: 0,
            isRTL: false,
            showMonthAfterYear: false,
            yearSuffix: ''
        };
        $(aufstellField).datepicker($.datepicker.regional["de"]);
        $(aufstellField).datepicker('option', 'dateFormat', 'yy-mm-dd');
        $(aufstellField).datepicker('option', 'changeMonth', true);
        $(aufstellField).datepicker('option', 'changeYear', true);
        if (inhalt) $(aufstellField).val(inhalt);
        return aufstellField;
    }

    private static createInputField(type: "number" | "text" | "button", form: HTMLFormElement | HTMLDivElement, beschriftung: string, id: string, inhalt?: string) {
        let formGroup = HTML.createFormGroup(form, 'group_' + id);
        let label = HTML.createLabel(beschriftung, id, formGroup, 'label_' + id);
        label.className = "label_" + type;
        HTML.createBreak(formGroup);
        let input = document.createElement("input");
        input.id = id;
        input.type = type;
        formGroup.appendChild(input);
        if (inhalt != undefined)
            input.value = inhalt;
        return input;
    }

    static createLabel(beschriftung: string, forId: string, form: HTMLFormElement | HTMLDivElement, id?: string) {
        let label = document.createElement("label");
        label.textContent = beschriftung;
        label.htmlFor = forId;
        if (id != undefined) label.id = id;
        form.appendChild(label);
        return label;
    }

    static createBreak(form: HTMLFormElement | HTMLDivElement) {
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