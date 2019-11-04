import Objekt from "./Objekt";

export default abstract class SekundaerObjekt extends Objekt {
	protected parent: string = null;

    getParent(): string {
		return this.parent;
	}

	setParent(parent: string) {
		this.parent = parent;
	}
}