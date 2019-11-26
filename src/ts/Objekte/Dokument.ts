import SekundaerObjekt from "./prototypes/SekundaerObjekt";
import Klartext from "./Klartext";

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