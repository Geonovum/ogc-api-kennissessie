# Wat heeft Kontich te bieden qua geo bestanden?

- Frituren
- Groepsopvang Babys En Peuters 
- Openlucht Sportveld 
- Sport lokaal 
- Water

(Met dank aan Michel Stuyts, (voormalig) GIS-coördinator. Zie ook op https://michelstuyts.be/ - https://stuyts.xyz)

## Stap 1:
Zoals altijd, ga naar de step8 directory met je command prompt, en installeer express als het de eerste keer dat je node gaat opstarten in deze directory. `npm update`

## Lezen van de Datasets

```javascript
var path = require('path');
var fs = require('fs');

var files = fs.readdirSync(path.join(__dirname, "data")).filter(fn => fn.endsWith('.geojson'));
for (i = 0; i < files.length; i++)
  files[i] = files[i].replace(/\.[^/.]+$/, "");
```

## Code voor `/collections`

```javascript

...
// define the about route
router.get('/collections', function (req, res) {

  var urlParts = url.parse(req.url, true);
  if (null == urlParts.query.f) {
    res.send(make.collections("html", files));
  }
  else if ("json" == urlParts.query.f) {
    res.json(make.collections("json", files));
  }
  else if ("html" == urlParts.query.f)
    res.send(make.collections("html", files));
  else
    res.json(400, "{'code': 'InvalidParameterValue', 'description': 'Invalid format'}")

})

...

```

## Testen:
```
node index.js
```

`Example app listening at http://localhost:80`

In je browser of via PostMan

Landing Page:
- http://localhost/kontich/collections
- http://localhost/kontich/collections?f=json
- http://localhost/kontich/collections?f=html

Resultaat:

in JSON
```json
{
  "links": [
    {
      "href": "http://localhost/kontich/collections",
      "rel": "self",
      "type": "application/json",
      "title": "Metadata about the feature collections"
    }
  ],
  "collections": [
    {
      "name": "Groepsopvang_Babys_En_Peuters",
      "title": "Groepsopvang Babys En Peuters",
      "description": "GroepsopvangBabysEnPeuters",
      "links": [
        {
          "href": "https://localhost/kontich/collections/GroepsopvangBabysEnPeuters/items",
          "rel": "item",
          "type": "application/json",
          "title": "Groepsopvang Babys En Peuters"
        }
      ]
    },
    {
      "name": "Openlucht_Sportvelden",
      "title": "Openlucht Sportvelden",
      "description": "",
      "links": [
        {
          "href": "https://localhost/kontich/collections/OpenluchtSportvelden/items",
          "rel": "item",
          "type": "application/json",
          "title": "Openlucht Sportvelden"
        }
      ]
    },
    {
      "name": "Sport_Lokalen",
      "title": "Sport Lokalen",
      "description": "",
      "links": [
        {
          "href": "https://localhost/kontich/collections/SportLokalen/items",
          "rel": "item",
          "type": "application/json",
          "title": "Sport Lokalen"
        }
      ]
    },
    {
      "name": "septemberkermis",
      "title": "September Kermis",
      "description": "",
      "links": [
        {
          "href": "https://localhost/kontich/collections/septemberkermis/items",
          "rel": "item",
          "type": "application/json",
          "title": "September Kermis"
        }
      ]
    },
    {
      "name": "groendienst",
      "title": "Groendienst",
      "description": "",
      "links": [
        {
          "href": "https://localhost/kontich/collections/Groendienst/items",
          "rel": "item",
          "type": "application/json",
          "title": "Groendienst"
        }
      ]
    },
  ]
}
```

in HTML:

> Collections in this service

Name | Description
------ | -------------
[Groepsopvang Babys En Peuters](http://localhost/kontich/collections/GroepsopvangBabysEnPeuters/items)|Groepsopvang Babys En Peuters uit de Informatie Vlaanderen API voor de gemeente Kontich
[Openlucht Sportvelden](http://localhost/kontich/collections/OpenluchtSportvelden/items)|Openlucht Sportvelden uit de Informatie Vlaanderen API voor de gemeente Kontich
[Sport lokalen](http://localhost/kontich/collections/SportLokalen/items)|Sport lokalen uit de Informatie Vlaanderen API voor de gemeente Kontich
[September kermis](http://localhost/kontich/collections/septemberkermis/items)|Septemberkermis uit de Informatie Vlaanderen API voor de gemeente Kontich
[Groendienst](http://localhost/kontich/collections/Groendienst/items)|Groendienst uit de Informatie Vlaanderen API voor de gemeente Kontich

## Klaar voor de volgende stap
https://github.com/geonovum/ogc-api-kennissessie/blob/master/step9/README.md

