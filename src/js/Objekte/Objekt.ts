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
	public abschnittOderAst: string = null;
	public vst: number = null;
	public bst: number = null;
	public kherk: string = null;
	public baujahrGew: string = null;
	public abnahmeGew: string = null;
	public dauerGew: string = null;
	public ablaufGew: string = null;
	public objektId: string = null;
	public objektnr: string = null;
	public erfart: string = null;
	public quelle: string = null;
	public ADatum: string = null;
	public bemerkung: string = null;
	public bearbeiter: string = null;
	public behoerde: string = null;
	public stand: string = null;
	public fid: string = null;
	public inER: {} = {};
	public abschnitt: Abschnitt = null;
	public projekt: string = null;
	public abschnittId: string = null;

	constructor() {
		super({ geom: null });
	}

	public setDataFromXML(objekt: string, xml: Element) {
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