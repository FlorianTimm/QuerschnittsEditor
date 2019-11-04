import Abschnitt from "../Abschnitt";
import { Feature } from "ol";

/**
 * Interface für SIB-Objekte
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */

var CONFIG_WFS: { [index: string]: { [index: string]: { kt?: string, art: number } } } = require('../../config_wfs.json');

export default abstract class Objekt extends Feature {
	protected kherk: string = null;
	protected baujahrGew: string = null;
	protected abnahmeGew: string = null;
	protected dauerGew: string = null;
	protected ablaufGew: string = null;
	protected objektId: string = null;
	protected objektnr: string = null;
	protected erfart: string = null;
	protected quelle: string = null;
	protected ADatum: string = null;
	protected bemerkung: string = null;
	protected bearbeiter: string = null;
	protected behoerde: string = null;
	protected stand: string = null;
	protected fid: string = null;
	protected inER: {} = {};
	protected abschnitt: Abschnitt = null;
	protected projekt: string = null;
	protected abschnittId: string = null;

	abstract getObjektKlassenName(): string;

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

	protected createUpdateXML(updates: { [attribut: string]: any }): string {
		let xml = '<wfs:Update typeName="' + this.getObjektKlassenName() + '">\n'
		for (let update in updates) {
			xml += '	<wfs:Property>\n' +
				'		<wfs:Name>' + update + '</wfs:Name>\n' +
				'		<wfs:Value>' + updates[update] + '</wfs:Value>\n' +
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


	// Getter

	public getProjekt(): string {
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

	public getErfart(): string {
		return this.erfart;
	}

	public getQuelle(): string {
		return this.quelle;
	}

	// Setter
	public setProjekt(projekt: string) {
		this.projekt = projekt;
	}

	public setAbschnittId(abschnittId: string) {
		this.abschnittId = abschnittId;
	}

	public setErfart(erfart: string) {
		this.erfart = erfart;
	}

	public setObjektId(objektId: string) {
		this.objektId = objektId;
	}

	public setQuelle(quelle: string) {
		this.quelle = quelle;
	}

	public setObjektnr(objektnr: string) {
		this.objektnr = objektnr;
	}

}