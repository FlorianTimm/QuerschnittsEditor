export type LayerJSON = {
    name: string,
    url: string,
    layers: string,
    format: string,
    attribution: string,
    visible?: boolean,
    opacity?: number,
    style?: string
};

export type ConfigJSON = {
    PUBLIC_WFS_URL?: string,
    ER_WFS_URL?: string,
    ABSCHNITT_WFS_URL?: string,
    EPSG_CODE?: string,
    DETAIL_HOCH?: string,
    ERFASSUNG?: string,
    EINZELSCHILD?: string,
    BELEUCHTET?: string,
    LAGEFB?: string,
    GROESSE?: string,
    QUELLE?: string,
    LESBARKEIT?: string,
    STRASSENBEZUG?: string,
    MPP?: number,
    SCHILDERPFAD?: string
}

export type ConfigWfsJSON = { [klasse: string]: { [attribut: string]: { kt?: string, art: 0 | 1 | 2 } } }

export class ConfigLoader {

    private static instance: ConfigLoader;

    private config: Promise<ConfigJSON>;
    private layer: Promise<LayerJSON[]>;
    private wfs: Promise<ConfigWfsJSON>;

    private constructor() {
    }

    public static get() {
        if (!this.instance)
            this.instance = new ConfigLoader();
        return this.instance;
    }

    public getConfig(): Promise<ConfigJSON> {
        if (!this.config)
            this.config = fetch("/config/config.json").then((daten) => {
                return daten.json()
            })
        return this.config;
    }

    public getLayer(): Promise<LayerJSON[]> {
        if (!this.layer)
            this.layer = fetch("/config/config_wms.json").then((daten) => {
                return daten.json()
            })
        return this.layer;
    }

    getWfsConfig() {
        if (!this.wfs)
            this.wfs = fetch("/config/config_wfs.json").then((daten) => {
                return daten.json()
            })
        return this.wfs;
    }
}