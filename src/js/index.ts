import "./import_jquery.js";

$(function () {
    let hash = window.location.href.split('#');
    if (hash.length > 1 && hash[1] == "failed") {
        document.getElementById("login_fehler").innerText = "Login-Daten falsch";
    }
});