import Objekt from "./Objekt";
import { InfoToolSelectable } from "src/js/Tools/InfoTool";

export default abstract class PrimaerObjekt extends Objekt implements InfoToolSelectable {
    protected abschnittOderAst: string = null;
    protected vst: number = null;
	protected bst: number = null;
	
	abstract getInfoForm(sidebar: HTMLElement, changeable?: boolean): void;

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