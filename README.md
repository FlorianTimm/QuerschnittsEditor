# QuerschnittsEditor

Ermöglicht das Editieren von Querschnitte im WebEditor. Als Datenquelle 
wird hierfür der PublicWFS der TTSIB5 von NOVASIB verwendet. Der 
Editor ist nur in Zusammenhang mit dieser Software einsetzbar. 

## Installation
Das Verzeichnis wird in ein Unterverzeichnis des Docroot des Glassfish 
oder TomCat (Java EE) kopiert bzw. in den Docroot des INFOSYS-Glassfish. 
Danach muss in die jsp/login.jsp, jsp/proxy.jsp und jsp/proxy_er.jsp der Pfad zum 
publicWFS und zum publicWFS EBFF angegeben werden. Dieses Skript 
fungiert als Proxy für den WFS.

## Nutzung 
Ereignisräume müssen bisher über TTSIB/INFOSYS angelegt werden und die zu 
bearbeitenden Querschnitte hierüber in den Ereignisraum geladen werden. 
Aktuell ist nur das Anpassen von vorhandenen Querschnittsflächen möglich.