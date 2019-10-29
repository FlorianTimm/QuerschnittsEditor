import Objekt from "./Objekt";

var CONFIG_WFS: { [index: string]: { [index: string]: { kt?: string, art: number } } } = require('../config_wfs.json');

/**
* Aufbaudaten
* @author Florian Timm, LGV HH 
* @version 2019.10.29
* @copyright MIT
*/
export default class Aufbau extends Objekt {
	getObjektKlassenName(): string {
		return "Otschicht";
	}
	private schichtnr: number = null;
	private parent: string = null;
	private teilnr: number = null;
	private teilbreite: string = null;
	private decksch: string = null;
	private baujahr: string = null;
	private dicke: number = null;
	private baumonat: number = null;
	private korngr: string = null;
	private unscharf: string = null;
	private kennz: string = null;
	private art1: string = null;
	private art2: string = null;
	private art3: string = null;
	private artneu: string = null;
	private material1: string = null;
	private material2: string = null;
	private material3: string = null;
	private bindemit1: string = null;
	private bindemit2: string = null;
	private detaila: string = null;
	private detailb: string = null;
	private detailc: string = null;
	private detaild: string = null;
	private umweltr: string = null;

	private constructor() {
		super();
	}

	public static fromXML(xml: Element): Aufbau {
		//console.log(xml);
		let r = new Aufbau();
		r.setDataFromXML("AUFBAUDATEN", xml)
		return r;
	}

	public createXML(changes?: { [tag: string]: number | string }, removeIds?: boolean): string {
		let r = '<Otschicht>\n';

		for (let tag in CONFIG_WFS["AUFBAUDATEN"]) {
			for (let change in changes) {
				if (CONFIG_WFS.AUFBAUDATEN[change].art == 0 || CONFIG_WFS.AUFBAUDATEN[change].art == 1) {
					// Kein Klartext
					r += '<' + change + '>' + changes[change] + '</' + change + '>\n';
				} else if (CONFIG_WFS.AUFBAUDATEN[change].art == 2) {
					// Klartext
					r += '<' + change + ' xlink:href="' + changes[change] + '" typeName="' + CONFIG_WFS.AUFBAUDATEN[change].kt + '" />\n';
				}
			}

			for (let tag in CONFIG_WFS.AUFBAUDATEN) {
				//console.log(tag);
				if (changes != undefined && tag in changes) continue;
				else if (removeIds == true && (tag == "objektId" || tag == "fid")) continue;
				else if (this[tag] === null || this[tag] === undefined) continue;
				else if (CONFIG_WFS.AUFBAUDATEN[tag].art == 0 || CONFIG_WFS.AUFBAUDATEN[tag].art == 1) {
					// Kein Klartext
					r += '<' + tag + '>' + this[tag] + '</' + tag + '>\n';
				} else if (CONFIG_WFS.AUFBAUDATEN[tag].art == 2) {
					// Klartext
					r += '<' + tag + ' xlink:href="' + this[tag] + '" typeName="' + CONFIG_WFS.AUFBAUDATEN[tag].kt + '" />\n';
				}
			}
			r += '</Otschicht>\n';
			console.log(r);
			return r;
		}
	}

	// Getter

	getParent(): string {
		return this.parent;
	}

	getSchichtnr(): number {
		return this.schichtnr;
	}

	// Setter

	setParent(parent: string) {
		this.parent = parent;
	}
}