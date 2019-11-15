import PrimaerObjekt from './PrimaerObjekt';
import Dokument from '../Dokument';
import PublicWFS from '../../PublicWFS';

export default abstract class PObjektMitDokument extends PrimaerObjekt {
    protected dateien: Dokument[] = [];
    protected dateienLoaded: boolean = false;

    public getDokumente(callback?: (doks: Dokument[], ...args: any[]) => void, ...args: any[]): void {
        if (this.dateienLoaded && callback) callback(this.dateien, ...args);
        else if (!this.dateienLoaded)
            this.reloadDokumente(callback, args);
    }

    private reloadDokumente(callback: (doks: Dokument[], ...args: any[]) => void, args: any[]) {
        let filter = '<Filter>\n' +
            '  <PropertyIsEqualTo>\n' +
            '    <PropertyName>parent/@xlink:href</PropertyName>\n' +
            '    <Literal>' + this.fid + '</Literal>\n' +
            '  </PropertyIsEqualTo>\n' +
            '</Filter>';
        PublicWFS.doQuery("Otdokument", filter, this.getDokumenteCallback.bind(this), undefined, callback, ...args);
    }

    public getDokumenteCallback(xml: XMLDocument, callback?: (doks: Dokument[], ...args: any[]) => void, ...args: any[]) {
        let re: Dokument[] = []
        let dokumente = xml.getElementsByTagName("Otdokument");
        for (let i = 0; i < dokumente.length; i++) {
            re.push(Dokument.fromXML(dokumente.item(i)));
        }
        if (callback) callback(re, ...args);
        this.dateien = re;
        this.dateienLoaded = true;
    }
}