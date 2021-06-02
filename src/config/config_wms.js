/**
 * @typedef {
 *    name: string,
 *    url: string,
 *    layers: string,
 *    format: string,
 *    attribution: string,
 *    visible ? : boolean,
 *    opacity ? : number,
 *    style ? : string
 *} []
 */

let lgv = 'Freie und Hansestadt Hamburg, LGV 2021';

export const layer = [{
        name: 'ALKIS',
        visible: false,
        url: 'http://geodienste.hamburg.de/HH_WMS_ALKIS_Basiskarte',
        layers: '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,23,24,26,27,28,29,30,32,33,34,35,36,37',
        format: 'image/png',
        attribution: lgv
    },
    {
        name: 'LGV DOP 2017',
        visible: false,
        opacity: 1.0,
        url: 'http://geodienste.hamburg.de/HH_WMS_DOP10',
        layers: '1',
        format: 'image/png',
        attribution: lgv
    },
    {
        name: 'LGV DOP 2018',
        visible: true,
        opacity: 1.00,
        url: 'https://geodienste.hamburg.de/HH_WMS_DOP_hochaufloesend',
        layers: 'dop_hochaufloesend_highres,dop_hochaufloesend_downscale',
        format: 'image/png',
        attribution: lgv
    },
    {
        name: 'LGV TrueDOP 2018',
        visible: false,
        opacity: 1.0,
        url: 'https://geodienste.hamburg.de/HH_WMS_TrueDOP',
        layers: 'tdop_hochaufloesend_89,tdop_hochaufloesend_downscale',
        format: 'image/png',
        attribution: lgv
    },
    {
        name: 'LGV DOP 2019 belaubt',
        visible: false,
        opacity: 1.0,
        url: 'https://geodienste.hamburg.de/HH_WMS_DOP_hochaufloesend_belaubt',
        layers: 'DOP_hochaufloesend_belaubt_highres,DOP_hochaufloesend_belaubt_downscale',
        format: 'image/png',
        attribution: lgv
    }, {
        name: 'CAD-Daten',
        visible: false,
        opacity: 0.85,
        url: 'http://gv-srv-w00118:20031/deegree/services/wms',
        layers: 'wburg',
        format: 'image/png',
        attribution: lgv
    },
    {
        name: 'Kreuzungsskizzen',
        visible: false,
        opacity: 0.85,
        url: 'https://geodienste.hamburg.de/HH_WMS_Kreuzungsskizzen',
        layers: 'poldata_text,poldata_lines,poldata_poly',
        format: 'image/png',
        attribution: lgv
    },
    {
        name: "Querschnitte (Dienst)",
        visible: false,
        opacity: 0.6,
        url: 'http://gv-srv-w00118:20031/deegree/services/wms?',
        layers: 'querschnitte',
        style: 'querschnitte_gruppiert',
        format: 'image/png',
        attribution: lgv

    },
    {
        name: "Bezirks-Feinkartierung",
        visible: false,
        opacity: 0.8,
        url: 'https://geodienste.hamburg.de/HH_WMS_Feinkartierung_Strasse?',
        layers: 'b_altona_mr_feinkartierung_flaechen,b_harburg_mr_feinkartierung_flaechen,b_mitte_mr_feinkartierung_flaechen,b_eims_mr_feinkartierung_flaechen,b_wands_mr_feinkartierung_flaechen',
        format: 'image/png',
        attribution: lgv
    },
    {
        name: "Raster-Ordner",
        visible: false,
        opacity: 0.8,
        url: 'http://gv-srv-w00175:20031/deegree/services/RasterFolder?',
        layers: 'RasterFolder',
        format: 'image/png',
        attribution: lgv
    },
]