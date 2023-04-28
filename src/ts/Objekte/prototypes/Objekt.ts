// SPDX-License-Identifier: GPL-3.0-or-later

import { Feature } from "ol";
import { LineString, Point, Polygon } from "ol/geom";
import { ConfigLoader } from "../../ConfigLoader";
import { Abschnitt } from "../Abschnitt";
import { Klartext } from "../Klartext";

/**
 * Interface für SIB-Objekte
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.04.03
 * @license GPL-3.0-or-later
*/
export abstract class Objekt<GeometryType extends Polygon | Point | LineString> extends Feature<GeometryType> {
	protected kherk: Klartext = null;
	protected baujahrGew: string = null;
	protected abnahmeGew: string = null;
	protected dauerGew: string = null;
	protected ablaufGew: string = null;
	protected objektId: string = null;
	protected objektnr: string = null;
	protected erfart: Klartext = null;
	protected quelle: Klartext = null;
	protected ADatum: string = null;
	protected bemerkung: string = null;
	protected bearbeiter: string = null;
	protected behoerde: string = null;
	protected stand: string = null;
	protected fid: string = null;
	protected inER: { [objektklasse: string]: boolean } = {};
	protected abschnitt: Abschnitt = null;
	protected projekt: Klartext = null;
	protected abschnittId: string = null;
	protected sekInER: { [ok: string]: boolean } = {};

	abstract getObjektKlassenName(): string;

	public async setDataFromXML(xml: Element): Promise<any> {
		this.fid = xml.getAttribute('fid');
		const configWfs = await ConfigLoader.get().getWfsConfig();
		for (let tag in configWfs[this.getObjektKlassenName()]) {
			if (xml.getElementsByTagName(tag).length <= 0) continue;
			if (configWfs[this.getObjektKlassenName()][tag].art == 0) {
				// Kein Klartext
				this[tag] = xml.getElementsByTagName(tag)[0].firstChild.textContent;
			} else if (configWfs[this.getObjektKlassenName()][tag].art == 1) {
				// Kein Klartext
				this[tag] = Number(xml.getElementsByTagName(tag)[0].firstChild.textContent);
			} else if (configWfs[this.getObjektKlassenName()][tag].art == 2) {
				// Klartext, xlink wird gespeichert
				let eintrag = xml.getElementsByTagName(tag)[0]
				this[tag] = Klartext.get(
					eintrag.getAttribute('typeName'),
					eintrag.getAttribute('xlink:href'),
					eintrag.getAttribute('luk')
				);
			}
		}
	}

	protected createUpdateXML(updates: { [attribut: string]: Klartext | string | number }): string {
		let xml = '<wfs:Update typeName="' + this.getObjektKlassenName() + '">\n'
		for (let update in updates) {
			let wert: string | number | Klartext = updates[update];
			if (wert instanceof Klartext) wert = wert.getXlink();

			xml += '	<wfs:Property>\n' +
				'		<wfs:Name>' + update + '</wfs:Name>\n' +
				'		<wfs:Value>' + (wert ?? '') + '</wfs:Value>\n' +
				'	</wfs:Property>\n';
		}
		xml += '	<ogc:Filter>\n' +
			'		<ogc:And>\n' +
			'			<ogc:PropertyIsEqualTo>\n' +
			'				<ogc:PropertyName>objektId</ogc:PropertyName>\n' +
			'				<ogc:Literal>' + this.objektId + '</ogc:Literal>\n' +
			'			</ogc:PropertyIsEqualTo>\n' +
			'			<ogc:PropertyIsEqualTo>\n' +
			'				<ogc:PropertyName>projekt/@xlink:href</ogc:PropertyName>\n' +
			'				<ogc:Literal>' + this.projekt + '</ogc:Literal>\n' +
			'			</ogc:PropertyIsEqualTo>\n' +
			'		</ogc:And>\n' +
			'	</ogc:Filter>\n' +
			'</wfs:Update>';
		return xml;
	}

	public async createInsertXML(changes?: { [tag: string]: number | string }, removeIds?: boolean) {
		let r = '<wfs:Insert>\n';
		r += await this.createXML(changes, removeIds);
		r += '</wfs:Insert>\n';
		return r;
	}

	public async createXML(changes?: { [tag: string]: number | string }, removeIds?: boolean) {
		let r = '<' + this.getObjektKlassenName() + '>\n';
		const configWfs = await ConfigLoader.get().getWfsConfig();
		for (let change in changes) {
			if (configWfs[this.getObjektKlassenName()][change].art == 0 || configWfs[this.getObjektKlassenName()][change].art == 1) {
				// Kein Klartext
				r += '<' + change + '>' + changes[change] + '</' + change + '>\n';
			} else if (configWfs[this.getObjektKlassenName()][change].art == 2) {
				// Klartext
				r += '<' + change + ' xlink:href="' + changes[change] + '" typeName="' + configWfs[this.getObjektKlassenName()][change].kt + '" />\n';
			}
		}

		for (let tag in configWfs[this.getObjektKlassenName()]) {
			if (changes != undefined && tag in changes) continue;
			else if (removeIds == true && (tag == "objektId" || tag == "fid")) continue;
			else if (this[tag] === null || this[tag] === undefined) continue;
			else if (configWfs[this.getObjektKlassenName()][tag].art == 0 || configWfs[this.getObjektKlassenName()][tag].art == 1) {
				// Kein Klartext
				r += '<' + tag + '>' + this[tag] + '</' + tag + '>\n';
			} else if (configWfs[this.getObjektKlassenName()][tag].art == 2) {
				// Klartext
				r += '<' + tag + ' xlink:href="' + this[tag] + '" typeName="' + configWfs[this.getObjektKlassenName()][tag].kt + '" />\n';
			}
		}

		r += '</' + this.getObjektKlassenName() + '>\n';
		return r;
	}


	public addSekOKinER(ok: string) {
		this.sekInER[ok] = true;
	}

	public isSekOKinER(ok: string) {
		return (ok in this.sekInER && this.sekInER[ok]);
	}

	// Getter
	public getProjekt(): Klartext {
		return this.projekt;
	}

	public getAbschnitt(): Abschnitt {
		return this.abschnitt;
	}

	public getAbschnittId(): string {
		return this.abschnittId;
	}

	public getFid(): string {
		return this.fid;
	}

	public getObjektId(): string {
		return this.objektId;
	}

	public getObjektnr(): string {
		return this.objektnr;
	}

	public getErfart(): Klartext {
		return this.erfart;
	}

	public getQuelle(): Klartext {
		return this.quelle;
	}

	// Setter
	public setProjekt(projekt: Klartext | string) {
		this.projekt = Klartext.get("Projekt", projekt);
	}

	public setAbschnittId(abschnittId: string) {
		this.abschnittId = abschnittId;
	}

	public setErfart(erfart: Klartext | string) {
		this.erfart = Klartext.get("Iterfart", erfart);
	}

	public setObjektId(objektId: string) {
		this.objektId = objektId;
	}

	public setQuelle(quelle: Klartext | string) {
		this.quelle = Klartext.get("Itquelle", quelle)
	}

	public setObjektnr(objektnr: string) {
		this.objektnr = objektnr;
	}

	public setADatum(adatum?: string) {
		this.ADatum = adatum ?? new Date(Date.now()).toISOString().split('T')[0];
	}
}