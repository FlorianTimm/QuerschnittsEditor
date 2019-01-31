# QuerschnittsEditor

Ermöglicht das Editieren von Querschnitte im WebEditor. Als Datenquelle wird hierfür der PublicWFS der TTSIB5 von NOVASIB verwendet. Der Editor ist nur in Zusammenhang mit dieser Software einsetzbar. 

# Installation
Das Verzeichnis wird in ein Unterverzeichnis des Docroot des Glassfish oder TomCat (Java EE) kopiert bzw. in den Docroot des INFOSYS-Glassfish. Danach muss in die js/config.js der Fahrt zum publicWFS und zum publicWFS EBFF angegeben werden. Es empfiehlt sich hierfür, ein JSP-Proxy anzulegen (proxy-temp.jsp). In der Vorlagendatei für den Proxy wird dann jeweils der Login zum WFS und die URL hierzu fest eingespeichert.

_ACHTUNG: DER PROXY ERMÖGLICHT SOMIT DEN VOLLEN ZUGRIFF OHNE WEITEREN PASSWORTSCHUTZ. GGF. IST DER ZUGANG ZUM PROXY ÜBER PASSWÖRTER ETC. ZU SICHERN_

# Nutzung 
Ereignisräume müssen bisher über TTSIB/INFOSYS angelegt werden und die zu bearbeitenden Querschnitte hierüber in den Ereignisraum geladen werden. Aktuell ist nur das Anpassen von vorhandenen Querschnittsflächen möglich.
