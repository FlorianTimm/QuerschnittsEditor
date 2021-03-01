import { PublicWFS } from "../PublicWFS";

export class Projekt {
    private _fid: string = null;
    private _nr: number = null;
    private _kurzbez: string;
    private _langbez: string;
    private _ownerName: string;
    private _bearbeiter: string;
    private _anlagedat: string = null;

    /* GETTER */
    public get fid(): string {
        return this._fid;
    }
    public get nr(): number {
        return this._nr;
    }
    public get anlagedat(): string {
        return this._anlagedat;
    }

    public get kurzbez(): string {
        return this._kurzbez;
    }

    public get langbez(): string {
        return this._langbez;
    }

    public get ownerName(): string {
        return this._ownerName;
    }

    public get bearbeiter(): string {
        return this._bearbeiter;
    }

    constructor(fid: string = null, nr: number = null, kurzbez: string, langbez: string,
        ownerName: string, bearbeiter: string, anlagedat: string = null) {

        this._fid = fid;
        this._nr = nr;
        this._kurzbez = kurzbez;
        this._langbez = langbez;
        this._ownerName = ownerName;
        this._bearbeiter = bearbeiter;
        this._anlagedat = anlagedat;
    }

    static fromXML(xml: Element) {
        let fid = xml.getAttribute("fid")
        let nr = parseInt(xml.getElementsByTagName("projekt")[0].firstChild.textContent);
        let kurzbezArray = xml.getElementsByTagName("kurzbez")
        let kurzbez = ""
        if (kurzbezArray.length > 0)
            kurzbez = kurzbezArray[0].firstChild.textContent

        let langbez = "";
        let langbezArray = xml.getElementsByTagName("langbez")
        if (langbezArray.length > 0)
            langbez = xml.getElementsByTagName("langbez")[0].firstChild.textContent

        let ownerName = xml.getElementsByTagName("ownerName")[0].firstChild.textContent
        let bearbeiter = xml.getElementsByTagName("bearbeiter")[0].firstChild.textContent
        let anlagedat = xml.getElementsByTagName("anlagedat")[0].firstChild.textContent

        return new Projekt(fid, nr, kurzbez, langbez, ownerName, bearbeiter, anlagedat);
    }

    static async create(kurzBez: string, langBez: string, bearbeiter?: string): Promise<Projekt> {
        const xml = await PublicWFS.anlegenER(kurzBez, langBez, false);
        let projektnr = Number.parseInt(xml.getElementsByTagNameNS('http://interfaceTypes.ttsib5.novasib.de/', 'ProjektNr').item(0).innerHTML);
        const projekt = await Projekt.loadER(projektnr);
        if (bearbeiter)
            projekt.setBearbeiter(bearbeiter);
        return projekt;
    }


    public static loadER(): Promise<Projekt[]>
    public static loadER(projektnr: number): Promise<Projekt>
    public static async loadER(projektnr?: number): Promise<Projekt | Projekt[]> {
        let xml = '<Filter><And>' +
            '<PropertyIsEqualTo><PropertyName>status</PropertyName>' +
            '<Literal>1</Literal>' +
            '</PropertyIsEqualTo><PropertyIsEqualTo>' +
            '<PropertyName>typ</PropertyName>' +
            '<Literal>D</Literal>' +
            '</PropertyIsEqualTo>';
        if (projektnr) {
            xml += '<PropertyIsEqualTo>' +
                '<PropertyName>projekt</PropertyName>' +
                '<Literal>' + projektnr + '</Literal>' +
                '</PropertyIsEqualTo>';
        }
        xml += '</And></Filter>';

        let response = await PublicWFS.doQuery('Projekt', xml);
        let proj = response.getElementsByTagName("Projekt");
        let er = [];
        for (var i = 0; i < proj.length; i++) {
            er.push(Projekt.fromXML(proj[i]));
        }
        if (projektnr) {
            return er.length >= 1 ? er[0] : null
        } else {
            er.sort(function (a, b) {
                return Number(a.nr) - Number(b.nr);
            });
            return er;
        }

    }

    public async setBearbeiter(bearbeiter: string) {
        let xml = '<wfs:Update typeName="Projekt">\n' +
            '	<wfs:Property>\n' +
            '		<wfs:Name>bearbeiter</wfs:Name>\n' +
            '		<wfs:Value>' + bearbeiter + '</wfs:Value>\n' +
            '	</wfs:Property>\n' +
            '	<ogc:Filter>\n' +
            '			<ogc:PropertyIsEqualTo>\n' +
            '				<ogc:PropertyName>projekt</ogc:PropertyName>\n' +
            '				<ogc:Literal>' + this.nr + '</ogc:Literal>\n' +
            '			</ogc:PropertyIsEqualTo>\n' +
            '	</ogc:Filter>\n' +
            '</wfs:Update>';
        await PublicWFS.doTransaction(xml);
        this._bearbeiter = bearbeiter
    }
}