import Objekt from "./Objekt";

var CONFIG_WFS: { [index: string]: { [index: string]: { kt?: string, art: number } } } = require('../config_wfs.json');

/**
* Aufbaudaten
* @author Florian Timm, LGV HH 
* @version 2019.06.06
* @copyright MIT
*/
export default class Aufbau implements Objekt {
	abschnittOderAst: string = null;
	schichtnr: number = null;
	parent: string = null;
	vst: number = null;
	bst: number = null;
	teilnr: number = null;
	teilbreite: string = null;
	decksch: string = null;
	baujahr: string = null;
	dicke: number = null;
	baumonat: number = null;
	korngr: string = null;
	unscharf: string = null;
	kennz: string = null;
	artnull: string = null;
	art2: string = null;
	art3: string = null;
	artneu: string = null;
	materialnull: string = null;
	material2: string = null;
	material3: string = null;
	bindemitnull: string = null;
	bindemit2: string = null;
	detaila: string = null;
	detailb: string = null;
	detailc: string = null;
	detaild: string = null;
	umweltr: string = null;
	kherk: string = null;
	baujahrGew: string = null;
	abnahmeGew: string = null;
	dauerGew: string = null;
	ablaufGew: string = null;
	objektId: string = null;
	objektnr: string = null;
	erfart: string = null;
	quelle: string = null;
	ADatum: string = null;
	bemerkung: string = null;
	bearbeiter: string = null;
	behoerde: string = null;

	constructor() {

	}

	static fromXML(xml: Element) {
		//console.log(xml);
		let r = new Aufbau();
		for (var tag in CONFIG_WFS.AUFBAUDATEN) {
			if (xml.getElementsByTagName(tag).length <= 0) continue;
			if (CONFIG_WFS.AUFBAUDATEN[tag].art == 0) {
				// Kein Klartext
				r[tag] = xml.getElementsByTagName(tag)[0].firstChild.textContent;
			} else if (CONFIG_WFS.AUFBAUDATEN[tag].art == 1) {
				// Kein Klartext
				r[tag] = Number(xml.getElementsByTagName(tag)[0].firstChild.textContent);
			} else if (CONFIG_WFS.AUFBAUDATEN[tag].art == 2) {
				// Klartext, xlink wird gespeichert
				r[tag] = xml.getElementsByTagName(tag)[0].getAttribute('xlink:href');
			}
		}
		return r;
	}

	createXML() {
		let r = '<Otschicht>\n';

		for (let tag in CONFIG_WFS["AUFBAUDATEN"]) {
			//console.log(tag);
			if (this[tag] === null) continue;
			if (CONFIG_WFS["AUFBAUDATEN"][tag].art == 0 || CONFIG_WFS["AUFBAUDATEN"][tag].art == 1) {
				// Kein Klartext
				r += '<' + tag + '>' + this[tag] + '</' + tag + '>\n';
			} else if (CONFIG_WFS["AUFBAUDATEN"][tag].art == 2) {
				// Klartext
				r += '<' + tag + ' xlink:href="' + this[tag] + '" typeName="' + CONFIG_WFS["AUFBAUDATEN"][tag].kt + '" />' + this[tag];
			}
		}

		r += '</Otschicht>\n';
	}
}