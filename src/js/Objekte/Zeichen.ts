import Daten from "../Daten";
import Objekt from "./Objekt";

var CONFIG_WFS: { [index: string]: { [index: string]: { kt?: string, art: number } } } = require('../config_wfs.json');

/**
* Zeichen
* @author Florian Timm, LGV HH 
* @version 2019.10.29
* @copyright MIT
*/

class Zeichen extends Objekt {
    _daten: Daten;
    private hasSekObj: string = null;
    private stvoznr: string = null;
    private sort: number = null;
    private vztext: string = null;
    private lageFb: string = null;
    private fsnummer: number = null;
    private lesbarkeit: string = null;
    private strbezug: string = null;
    private bauart: string = null;
    private groesse: string = null;
    private art: string = null;
    private hersteller: string = null;
    private herstdat: string = null;
    private aufstelldat: string = null;
    private aufhebdat: string = null;
    private beleucht: string = null;
    private sichtbar: string = null;
    private lesbarT: string = null;
    private lesbarN: string = null;
    private unterhaltstat: string = null;
    private verdeckbar: string = null;
    private aufnahme: string = null;
    private zuordnung: string = null;
    private ausfuehr: string = null;

    constructor(daten: Daten) {
        super();
        this._daten = daten;
    }

    getObjektKlassenName(): string {
        return "Otvzeichlp"
    }

    static fromXML(xml: Element, daten: Daten) {
        //console.log(xml);
        let r = new Zeichen(daten);
        for (var tag in CONFIG_WFS["ZEICHEN"]) {
            if (xml.getElementsByTagName(tag).length <= 0) continue;
            if (CONFIG_WFS["ZEICHEN"][tag].art == 0) {
                // Kein Klartext
                r[tag] = xml.getElementsByTagName(tag)[0].firstChild.textContent;
            } else if (CONFIG_WFS["ZEICHEN"][tag].art == 1) {
                // Kein Klartext
                r[tag] = Number(xml.getElementsByTagName(tag)[0].firstChild.textContent);
            } else if (CONFIG_WFS["ZEICHEN"][tag].art == 2) {
                // Klartext, xlink wird gespeichert
                r[tag] = xml.getElementsByTagName(tag)[0].getAttribute('xlink:href');
            }
        }
        return r;
    }

    createXML() {
        let r = '<Otvzeichlp>\n';

        for (let tag in CONFIG_WFS["ZEICHEN"]) {
            //console.log(tag);
            if (this[tag] === null) continue;
            if (CONFIG_WFS["ZEICHEN"][tag].art == 0 || CONFIG_WFS["ZEICHEN"][tag].art == 1) {
                // Kein Klartext
                r += '<' + tag + '>' + this[tag] + '</' + tag + '>\n';
            } else if (CONFIG_WFS["ZEICHEN"][tag].art == 2) {
                // Klartext
                r += '<' + tag + ' xlink:href="' + this[tag] + '" typeName="' + CONFIG_WFS["ZEICHEN"][tag].kt + '" />' + this[tag];
            }
        }

        r += '</Otvzeichlp>\n';
    }


    // Getter

    getSort(): number {
        return this.sort;
    }

    getStvoznr(): string {
        return this.stvoznr
    }

    getVztext(): string {
        return this.vztext;
    }

    getLageFb(): string {
        return this.lageFb;
    }

    getBeleucht(): string {
        return this.beleucht;
    }

    getStrbezug(): string {
        return this.strbezug;
    }

    getAufstelldat(): string {
        return this.aufstelldat;
    }

    getArt(): string {
        return this.art;
    }

    getGroesse(): string {
        return this.groesse;
    }

    getLesbarkeit(): string {
        return this.lesbarkeit;
    }

    // Setter

    setGroesse(groesse: string) {
        this.groesse = groesse;
    }

    setStrbezug(strassenbezug: string) {
        this.strbezug = strassenbezug;
    }

    setSort(sort: number) {
        this.sort = sort;
    }

    setVztext(vztext: string) {
        this.vztext = vztext;
    }

    setLesbarkeit(lesbarkeit: string) {
        this.lesbarkeit = lesbarkeit;
    }

    setAufstelldat(aufstelldat: string) {
        this.aufstelldat = aufstelldat;
    }

    setStvoznr(stvoznr: string): void {
        this.stvoznr = stvoznr;
    }

    setLageFb(lageFb: string): void {
        this.lageFb = lageFb;
    }

    setBeleucht(beleucht: string): void {
        this.beleucht = beleucht;
    }

    setArt(art: string): void {
        this.art = art;
    }
}

export default Zeichen;