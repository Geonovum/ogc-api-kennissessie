# Stap 2

Installatie van Express, het gaat ons leven makkelijker maken om om te gaan met paden in http
Op de website van [Express](https://expressjs.com) vind je alle information over paden in http. Je hoeft niet naar de Express website te gaan om het te installeren, we installeren Express via de node package manager `npm`

> Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.


## Installer ExpressJS

Ga naar de directory van step2, en met een command prompt, typ:

```
npm install express --save
```

Na de installatie zie je:

```
...
+ express@4.17.1
added 50 packages from 37 contributors and audited 50 packages in 1.563s
found 0 vulnerabilities
```

## Start NodeJS (met ExpressJS)

ExpressJS wordt gekort tot Express, net als NodeJS verkort wordt tot Node

```
node index.js
```
Op je scherm:
```
Example app listening at http://localhost:80
```

## Testen in een browser:
http://localhost

> `Hello World!`

Echter, elk ander pad werkt nu niet meer
http://localhost/kontich

geeft:
> `Cannot GET /kontich`

en dat is prima (voor het moment)

## Klaar voor de volgende stap
https://github.com/geonovum/ogc-api-kennissessie/blob/master/step3/README.md
