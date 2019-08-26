import Abschnitt from "./Abschnitt";
import { Feature } from "ol";

/**
 * Interface für SIB-Objekte
 * @author Florian Timm, LGV HH 
 * @version 2019.08.22
 * @copyright MIT
 */

var CONFIG_WFS: { [index: string]: { [index: string]: { kt?: string, art: number } } } = require('../config_wfs.json');

export default abstract class Objekt extends Feature {
	abschnittOderAst: string = null;
	vst: number = null;
	bst: number = null;
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
	stand: string = null;
	fid: string = null;
	inER: {} = {};
	abschnitt: Abschnitt = null;
	projekt: string = null;
	abschnittId: string = null;

	constructor() {
		super({ geom: null });
	}

	setDataFromXML(objekt: string, xml: Element) {
		this.fid = xml.getAttribute('fid');
		for (var tag in CONFIG_WFS[objekt]) {
			if (xml.getElementsByTagName(tag).length <= 0) continue;
			if (CONFIG_WFS[objekt][tag].art == 0) {
				// Kein Klartext
				this[tag] = xml.getElementsByTagName(tag)[0].firstChild.textContent;
			} else if (CONFIG_WFS[objekt][tag].art == 1) {
				// Kein Klartext
				this[tag] = Number(xml.getElementsByTagName(tag)[0].firstChild.textContent);
			} else if (CONFIG_WFS[objekt][tag].art == 2) {
				// Klartext, xlink wird gespeichert
				this[tag] = xml.getElementsByTagName(tag)[0].getAttribute('xlink:href');
			}
		}
	}


}