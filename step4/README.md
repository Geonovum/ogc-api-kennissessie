# Stap 4

In deze stap leer je het gebruik van Node `app.use`. Om niet alle code in dezelfde file te moeten zetten, gaan we alle code voor 'birds' in een apart script zetten: die maakt het overzichtelijker en makkelijk om te onderhouden.

## 1: Klaar

Niets nieuw: start een command prompt in de diectory step4
(en eerst weer even Express installeren: `npm install express --save` en het de eerste keer is)

## 2: Go
```
node index.js
```

`Example app listening at http://localhost:80`

## 3: The Birds!

http://localhost/birds

Resultaat:
> `Birds home page`

http://localhost/birds/about

Resultaat:
> `About birds`

## Middleware
Express laat toe dat je Middleware gebruik: een sectie waarlangs eerst gaat, alvorens en pad te kiezen.
Nu gebruiken we het om te tijd te tonen, later gaat het handig zijn om bv security calls te maken.

## Klaar voor de volgende stap
https://github.com/geonovum/ogc-api-kennissessie/blob/master/step5/README.md
