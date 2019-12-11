import PrimaerObjekt from './PrimaerObjekt';
import Dokument from '../Dokument';
import PublicWFS from '../../PublicWFS';

export default abstract class PObjektMitDokument extends PrimaerObjekt {
    protected dateien: Dokument[] = [];
    protected dateienLoaded: Promise<Dokument[]>;

    public getDokumente(blocking = true): Promise<Dokument[]> {

        if (!this.dateienLoaded)
            this.reloadDokumente(blocking);
        
        return this.dateienLoaded;
    }

    private reloadDokumente(blocking = true): Promise<Dokument[]> {
        let filter = '<Filter>\n' +
            '  <PropertyIsEqualTo>\n' +
            '    <PropertyName>parent/@xlink:href</PropertyName>\n' +
            '    <Literal>' + this.fid + '</Literal>\n' +
            '  </PropertyIsEqualTo>\n' +
            '</Filter>';
        this.dateienLoaded = PublicWFS.doQuery("Otdokument", filter, blocking)
            .then((xml: Document) => { return this.getDokumenteCallback(xml) });
        return this.dateienLoaded;
    }

    public getDokumenteCallback(xml: XMLDocument): Dokument[] {
        let re: Dokument[] = []
        let dokumente = xml.getElementsByTagName("Otdokument");
        for (let i = 0; i < dokumente.length; i++) {
            re.push(Dokument.fromXML(dokumente.item(i)));
        }
        this.dateien = re;
        return re;
    }
}