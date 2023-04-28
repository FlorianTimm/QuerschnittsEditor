// SPDX-License-Identifier: GPL-3.0-or-later

import { Klartext } from "./Klartext";
import { SekundaerObjekt } from "./prototypes/SekundaerObjekt";

/**
 * Zeichen
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.10.29
 * @license GPL-3.0-or-later
*/
export class Zeichen extends SekundaerObjekt<null> {
    private hasSekObj: string = null;
    private stvoznr: Klartext = null;
    private sort: number = null;
    private vztext: string = null;
    private lageFb: Klartext = null;
    private fsnummer: number = null;
    private lesbarkeit: Klartext = null;
    private strbezug: Klartext = null;
    private bauart: Klartext = null;
    private groesse: Klartext = null;
    private art: Klartext = null;
    private hersteller: Klartext = null;
    private herstdat: string = null;
    private aufstelldat: string = null;
    private aufhebdat: string = null;
    private beleucht: Klartext = null;
    private sichtbar: Klartext = null;
    private lesbarT: Klartext = null;
    private lesbarN: Klartext = null;
    private unterhaltstat: string = null;
    private verdeckbar: Klartext = null;
    private aufnahme: string = null;
    private zuordnung: string = null;
    private ausfuehr: Klartext = null;

    getObjektKlassenName(): string {
        return "Otvzeichlp";
    }

    static async fromXML(xml: Element) {
        //console.log(xml);
        let r = new Zeichen();
        await r.setDataFromXML(xml)
        return r;
    }

    // Getter
    getSort(): number {
        return this.sort;
    }

    getStvoznr(): Klartext {
        return this.stvoznr
    }

    getVztext(): string {
        return this.vztext;
    }

    getLageFb(): Klartext {
        return this.lageFb;
    }

    getBeleucht(): Klartext {
        return this.beleucht;
    }

    getStrbezug(): Klartext {
        return this.strbezug;
    }

    getAufstelldat(): string {
        return this.aufstelldat;
    }

    getArt(): Klartext {
        return this.art;
    }

    getGroesse(): Klartext {
        return this.groesse;
    }

    getLesbarkeit(): Klartext {
        return this.lesbarkeit;
    }

    // Setter
    setGroesse(groesse: Klartext | string) {
        this.groesse = Klartext.get("Itvzgroesse", groesse);
    }

    setStrbezug(strassenbezug: Klartext | string) {
        this.strbezug = Klartext.get("Itbesstrbezug", strassenbezug);
    }

    setSort(sort: number) {
        this.sort = sort;
    }

    setVztext(vztext: string) {
        this.vztext = vztext;
    }

    setLesbarkeit(lesbarkeit: Klartext | string) {
        this.lesbarkeit = Klartext.get("Itvzlesbarkeit", lesbarkeit);;
    }

    setAufstelldat(aufstelldat: string) {
        this.aufstelldat = aufstelldat;
    }

    setStvoznr(stvoznr: Klartext | string): void {
        this.stvoznr = Klartext.get("Itvzstvoznr", stvoznr);
    }

    setLageFb(lageFb: Klartext | string): void {
        this.lageFb = Klartext.get("Itvzlagefb", lageFb);
    }

    setBeleucht(beleucht: Klartext | string): void {
        this.beleucht = Klartext.get("Itvzbeleucht", beleucht);
    }

    setArt(art: Klartext | string): void {
        this.art = Klartext.get("Itvzart", art);
    }
}
