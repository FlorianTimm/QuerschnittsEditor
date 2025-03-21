// SPDX-License-Identifier: GPL-3.0-or-later

import { LineString, Point, Polygon } from "ol/geom";
import { InfoToolSelectable } from "../../Tools/InfoTool";
import { Objekt } from "./Objekt";

/**
 *
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.01.28
 * @license GPL-3.0-or-later
*/
export abstract class PrimaerObjekt<GeometryType extends Polygon | Point | LineString> extends Objekt<GeometryType> implements InfoToolSelectable {
	protected abschnittOderAst: string = null;
	protected vst: number = null;
	protected bst: number = null;

	abstract getInfoForm(sidebar: HTMLElement, changeable?: boolean): Promise<any>;

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