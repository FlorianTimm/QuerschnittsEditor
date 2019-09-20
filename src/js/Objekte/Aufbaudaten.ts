import Objekt from "./Objekt";

var CONFIG_WFS: { [index: string]: { [index: string]: { kt?: string, art: number } } } = require('../config_wfs.json');

/**
* Aufbaudaten
* @author Florian Timm, LGV HH 
* @version 2019.08.22
* @copyright MIT
*/
export default class Aufbau extends Objekt {
	public schichtnr: number = null;
	public parent: string = null;
	public teilnr: number = null;
	public teilbreite: string = null;
	public decksch: string = null;
	public baujahr: string = null;
	public dicke: number = null;
	public baumonat: number = null;
	public korngr: string = null;
	public unscharf: string = null;
	public kennz: string = null;
	public art1: string = null;
	public art2: string = null;
	public art3: string = null;
	public artneu: string = null;
	public material1: string = null;
	public material2: string = null;
	public material3: string = null;
	public bindemit1: string = null;
	public bindemit2: string = null;
	public detaila: string = null;
	public detailb: string = null;
	public detailc: string = null;
	public detaild: string = null;
	public umweltr: string = null;

	private constructor() {
		super();
	}

	public static fromXML(xml: Element): Aufbau {
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