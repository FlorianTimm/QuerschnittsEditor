// SPDX-License-Identifier: GPL-3.0-or-later

import "./import_jquery.js";

/**
 * 
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.01.28
 * @license GPL-3.0-or-later
*/

$(function () {
    let hash = window.location.href.split('#');
    if (hash.length > 1 && hash[1] == "failed") {
        document.getElementById("login_fehler").innerText = "Login-Daten falsch";
    }
});