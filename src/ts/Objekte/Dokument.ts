// SPDX-License-Identifier: GPL-3.0-or-later

import SekundaerObjekt from "./prototypes/SekundaerObjekt";
import Klartext from "./Klartext";

/**
 *
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.01.28
 * @license GPL-3.0-or-later
*/
export default class Dokument extends SekundaerObjekt {
    protected art: Klartext
    protected beschreib: string
    protected standort: string
    protected pfad: string
    protected checksumme: string

    constructor() {
        super();
    }

    getObjektKlassenName() {
        return "Otdokument"
    }

    static fromXML(xml: Element) {
        let r = new Dokument();
        r.setDataFromXML(xml)
        return r;
    }

    public getPfad(): string {
        return this.pfad;
    }
    public getBeschreib(): string {
        return this.beschreib;
    }
    public getArt(): Klartext {
        return this.art;
    }
}