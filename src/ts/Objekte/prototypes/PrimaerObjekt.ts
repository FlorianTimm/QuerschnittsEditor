// SPDX-License-Identifier: GPL-3.0-or-later

import Objekt from "./Objekt";
import { InfoToolSelectable } from "../../Tools/InfoTool";

/**
 *
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.01.28
 * @license GPL-3.0-or-later
*/
export default abstract class PrimaerObjekt extends Objekt implements InfoToolSelectable {
    protected abschnittOderAst: string = null;
    protected vst: number = null;
	protected bst: number = null;
	
	abstract getInfoForm(sidebar: HTMLElement, changeable?: boolean): Promise<void>;

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