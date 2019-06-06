/**
 * Interface für alle Bearbeitungs-Tools
 * @author Florian Timm, LGV HH 
 * @version 2019.06.05
 * @copyright MIT
 */

export default interface Tool {
    start: () => void;
    stop: () => void;
}