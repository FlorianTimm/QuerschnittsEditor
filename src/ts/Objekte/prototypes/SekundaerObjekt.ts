import Objekt from "./Objekt";
import Klartext from "../Klartext";

export default abstract class SekundaerObjekt extends Objekt {
	protected parent: Klartext = null;

	getParent(): Klartext {
		return this.parent;
	}

	setParent(parent: Klartext | string) {
		this.parent = Klartext.get(this.getObjektKlassenName(), parent);
	}
}