import Objekt from "./Objekt";

var CONFIG_WFS: { [index: string]: { [index: string]: { kt?: string, art: number } } } = require('../config_wfs.json');

/**
* Aufbaudaten
* @author Florian Timm, LGV HH 
* @version 2019.08.22
* @copyright MIT
*/
export default class Aufbau extends Objekt {
	schichtnr: number = null;
	parent: string = null;
	teilnr: number = null;
	teilbreite: string = null;
	decksch: string = null;
	baujahr: string = null;
	dicke: number = null;
	baumonat: number = null;
	korngr: string = null;
	unscharf: string = null;
	kennz: string = null;
	art1: string = null;
	art2: string = null;
	art3: string = null;
	artneu: string = null;
	material1: string = null;
	material2: string = null;
	material3: string = null;
	bindemit1: string = null;
	bindemit2: string = null;
	detaila: string = null;
	detailb: string = null;
	detailc: string = null;
	detaild: string = null;
	umweltr: string = null;

	private constructor() {
		super();
	}

	static fromXML(xml: Element): Aufbau {
		//console.log(xml);
		let r = new Aufbau();
		r.setDataFromXML("AUFBAUDATEN", xml)
		return r;
	}

	public createXML(deleteParentId?: boolean): string {
		let r = '<Otschicht>\n';

		for (let tag in CONFIG_WFS["AUFBAUDATEN"]) {
			console.log(tag);
			if (this[tag] === null) continue;
			if (CONFIG_WFS["AUFBAUDATEN"][tag].art == 0 || CONFIG_WFS["AUFBAUDATEN"][tag].art == 1) {
				// Kein Klartext
				r += '<' + tag + '>' + this[tag] + '</' + tag + '>\n';
			} else if (CONFIG_WFS["AUFBAUDATEN"][tag].art == 2) {
				// Klartext
				r += '<' + tag + ' xlink:href="' + this[tag] + '" typeName="' + CONFIG_WFS["AUFBAUDATEN"][tag].kt + '" />\n';
			}
		}
		r += '</Otschicht>\n';
		console.log(r);
		return r;
	}
}