# OGC API kennissessie
Repository ten behoeve van kennisdeling voor het bouwen van een OGC API Features & Processes node app.

Dit is geen operationele service.

## Start de server lokaal

1. Installeer de dependencies van de server met Node en `node install`.
2. Start de server op één van de volgende manieren:

   1. Vanaf de commandline: `node --env-file=.env src/index.js`
   2. In Visual Studio Code: er is een [.vscode/launch.json](.vscode/launch.json) bestand meegeleverd, waarmee met een **druk op F5** de server start.
     
3. De server start, maar mogelijk is poort 80 niet beschikbaar.
   1. Wijzig dan in het bestand [`.env`](.env) de regel `PORT=80` naar een niet-gepriviligeerd, hoger poortnummer, bijv. `PORT=8085`.

4. Open in een webbrower de service op `http://localhost/{ID}/v{APIVERSION}`.
   1. Bijv. als het poortnummer is verhoogd: http://localhost:8085/demoservice/v1/

## Start the server on Docker

1. Ports:
   1. Use a free `port` on your host computer. If you don't know if a port ia availble try:  `8085` - this is good choice for a test webservice (and are probably free)

2. Volumes
   1. Point to the data files (datasets and processes) on your host computer (eg `/Users/willibrordus/Documents/GitHub/ogc-api-kennissessie/data`)
   2. Specify the `Container path`: an **existing path** in the container that will be used as a mounting point. Eg `/homes/node`
      
3. Environment variables
   1. Let the server know where we mounted the data in the container: so set `DATA_PATH` to `/homes/node`
