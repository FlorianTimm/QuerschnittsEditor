/**
 * Interface für SIB-Objekte
 * @author Florian Timm, LGV HH 
 * @version 2019.06.05
 * @copyright MIT
 */

 export default interface Objekt {
	abschnittOderAst: string;
	vst: number;
	bst: number;
	kherk: string;
	baujahrGew: string;
	abnahmeGew: string;
	dauerGew: string;
	ablaufGew: string;
	objektId: string;
	objektnr: string;
	erfart: string;
	quelle: string;
	ADatum: string;
	bemerkung: string;
	bearbeiter: string;
	behoerde: string;
}