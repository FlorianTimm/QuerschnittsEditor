import SekundaerObjekt from "./prototypes/SekundaerObjekt";

/**
* Aufbaudaten
* @author Florian Timm, LGV HH 
* @version 2019.10.29
* @copyright MIT
*/
export default class Aufbau extends SekundaerObjekt {
	getWFSKonfigName(): string {
		return "AUFBAUDATEN";
	}
	getObjektKlassenName(): string {
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