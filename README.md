# QuerschnittsEditor

Ermöglicht das Editieren von Querschnitte im WebEditor. Als Datenquelle 
wird hierfür der PublicWFS der TTSIB5 von NOVASIB verwendet. Der 
Editor ist nur in Zusammenhang mit dieser Software einsetzbar. 

## Kompilierien
Benötigt wird eine node.js und parcel.js Entwicklungs-Umgebung:
https://bitbucket.org/geowerkstatt-hamburg/masterportal/src/stable/doc/devdoc.md

Mit `npm install` und `npm run build` kann dann das Programm im Ordner `dist` erzeugt werden. Außerdem muss der Ordner `jsp` aus dem `src`-Ordner in den `dist`-Ordner kopiert werden.

## Installation
Das Verzeichnis `dist` wird in das Docroot des Glassfish 
oder TomCat (Java EE) kopiert. 
Danach muss in die `jsp/login.jsp`, `jsp/proxy.jsp` und `jsp/proxy_er.jsp` der Pfad zum 
publicWFS und zum publicWFS EBFF angegeben werden. Dieses Skript 
fungiert als Proxy für den WFS. Außerdem müssen in der `jsp/abschnittWFS.jsp` Zugangsdaten für einen lesenden Zugriff auf die TTSIB eingerichtet werden.

## Nutzung 
Ereignisräume müssen bisher über TTSIB/INFOSYS angelegt werden und die zu 
bearbeitenden Querschnitte hierüber in den Ereignisraum geladen werden. Nutzer des Programmes benötigen einen Zugang zum PublicWFS.
