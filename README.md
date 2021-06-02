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

Alternativ kann der fertig konfigurierte `dist`-Ordner auch als war-Datei gespeichert werden, die dann im Glassfish-Admin hochgeladen oder im TomCat webapp-Verzeichnis abgelegt werden kann. Hierzu wird das Progamm jar aus einer Java-Installation benötigt:
```
cd .\dist
jar.exe -cvf ..\querschnitt.war *
```

## Nutzung 
Eine ausführliche Anleitung für Nutzer findet sich unter [./etc/manual/QuerschnittsEditor.pdf](./etc/manual/QuerschnittsEditor.pdf).

### Nutzerrechte
Für die Verwendung benötigen die PublicWFS-Nutzer mindestens die folgenden Rechte:

#### Lesend/Schreibend:
* Projekt
* Otaufstvor
* Otvzeichlp
* Otstrauspkt
* Otschicht
* Otnabeschild
* Otdokument
Für die Linienfunktion muss natürlich die entsprechende Objektklasse und deren Klartexte freigeschaltet werden.

#### Lesend:
* VI_Strassennetz
* Otwegenummer

#### Lesend (Klartexte):
* Itallglage
* Itvzstvoznr
* Itvzlagefb
* Itvzlesbarkeit
* Itvzbeleucht
* Itvzart
* Itvzgroesse
* Itbesstrbezug
* Iterfart
* Itquelle
* Itquerart
* Itquerober
* Itobjdetailgrad
* Itstrauspktart
* Itaufstvorart
* Itdokart

#### Module:
* TT-SIB WFS Ereignisraumverwaltung
* Öffentlicher WFS
