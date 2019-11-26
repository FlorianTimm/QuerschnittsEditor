import SekundaerObjekt from "./prototypes/SekundaerObjekt";

export default class Dokument extends SekundaerObjekt {
    protected art: string
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
    public getArt(): string {
        return this.pfad ? this.pfad.substr(-32) : null;
    }
}