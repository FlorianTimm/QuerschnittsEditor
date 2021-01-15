// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Ausblenden des Tools bei Hintergrundjobs
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version
 * @license GPL-3.0-or-later
*/

export class WaitBlocker {
    private static counter: number = 0;
    private static blocker: HTMLElement;

    private static generateBlocker() {
        if (this.blocker) return;
        this.blocker = document.createElement("div");
        this.blocker.style.display = 'none';
        this.blocker.style.backgroundColor = "rgba(150,150,150,0.5)";
        this.blocker.style.position = "absolute";
        this.blocker.style.top = '0';
        this.blocker.style.left = '0';
        this.blocker.style.height = '100%';
        this.blocker.style.width = '100%';
        this.blocker.style.zIndex = '9999';
        $("body").append(this.blocker);
    }

    public static warteAdd() {
        this.counter += 1;
        this.generateBlocker();
        document.body.style.cursor = 'wait'
        this.blocker.style.display = "block";
    };

    public static warteSub() {
        this.counter -= 1;
        this.generateBlocker();
        if (this.counter <= 0) {
            this.counter = 0;
            document.body.style.cursor = ''
            this.blocker.style.display = "none";
        }
    }

    public static getCounter() {
        return this.counter;
    }

}