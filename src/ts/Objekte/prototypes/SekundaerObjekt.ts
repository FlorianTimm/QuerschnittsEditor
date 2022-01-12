// SPDX-License-Identifier: GPL-3.0-or-later

import { LineString, Point, Polygon } from "ol/geom";
import { Klartext } from "../Klartext";
import { Objekt } from "./Objekt";

/**
 *
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.01.28
 * @license GPL-3.0-or-later
*/
export abstract class SekundaerObjekt<GeometryType extends Polygon | LineString | Point> extends Objekt<GeometryType> {
	protected parent: Klartext = null;

	getParent(): Klartext {
		return this.parent;
	}

	setParent(parent: Klartext | string) {
		this.parent = Klartext.get(this.getObjektKlassenName(), parent);
	}
}