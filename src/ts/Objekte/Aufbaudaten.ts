// SPDX-License-Identifier: GPL-3.0-or-later

import SekundaerObjekt from "./prototypes/SekundaerObjekt";
import Klartext from "./Klartext";

/**
 * Aufbaudaten
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.10.29
 * @license GPL-3.0-or-later
*/
export default class Aufbau extends SekundaerObjekt {
	public getObjektKlassenName(): string {
		return "Otschicht";
	}

	protected abschnittOderAst: string = null;
	protected vst: number = null;
	protected bst: number = null;
	private schichtnr: number = null;
	private teilnr: number = null;
	private teilbreite: string = null;
	private decksch: string = null;
	private baujahr: string = null;
	private dicke: number = null;
	private baumonat: number = null;
	private korngr: string = null;
	private unscharf: string = null;
	private kennz: string = null;
	private art1: Klartext = null;
	private art2: Klartext = null;
	private art3: Klartext = null;
	private artneu: Klartext = null;
	private material1: Klartext = null;
	private material2: Klartext = null;
	private material3: Klartext = null;
	private bindemit1: Klartext = null;
	private bindemit2: Klartext = null;
	private detaila: Klartext = null;
	private detailb: Klartext = null;
	private detailc: Klartext = null;
	private detaild: Klartext = null;
	private umweltr: string = null;

	public static fromXML(xml: Element): Aufbau {
		//console.log(xml);
		let r = new Aufbau();
		r.setDataFromXML(xml)
		return r;
	}

	// Getter

	getSchichtnr(): number {
		return this.schichtnr;
	}

	// Setter

	public getVst() {
		return this.vst;
	}

	public getBst() {
		return this.bst;
	}

	public setVst(vst: number) {
		this.vst = vst;
	}

	public setBst(bst: number) {
		this.bst = bst;
	}
}