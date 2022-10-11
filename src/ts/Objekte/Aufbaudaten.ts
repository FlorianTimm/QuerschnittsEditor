// SPDX-License-Identifier: GPL-3.0-or-later

import { Point } from "ol/geom";
import { Klartext } from "./Klartext";
import { SekundaerObjekt } from "./prototypes/SekundaerObjekt";

/**
 * Aufbaudaten
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2019.10.29
 * @license GPL-3.0-or-later
*/
export class Aufbau extends SekundaerObjekt<null> {
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

	public static async fromXML(xml: Element): Promise<Aufbau> {
		//console.log(xml);
		let r = new Aufbau();
		await r.setDataFromXML(xml)
		return r;
	}

	// Getter

	getSchichtnr(): number {
		return this.schichtnr;
	}

	getArtNeu() {
		return this.artneu;
	}

	getMaterial1() {
		return this.material1;
	}

	getMaterial2() {
		return this.material2;
	}

	getMaterial3() {
		return this.material3;
	}

	isDeckschicht(): boolean {
		return this.decksch == '1'
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

	public setDeckschicht(decksch: boolean) {
		this.decksch = decksch ? '1' : '0';
	}
}