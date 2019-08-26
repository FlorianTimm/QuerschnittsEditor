/**
 * Interface für alle Bearbeitungs-Tools
 * @author Florian Timm, LGV HH 
 * @version 2019.06.05
 * @copyright MIT
 */

export default abstract class Tool {
    abstract start(): void;
    abstract stop(): void;
}