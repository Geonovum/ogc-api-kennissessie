# Wat heeft amstelveen te bieden qua geo bestanden?

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
Run de app

`Example app listening at http://localhost:80`

In je browser of via PostMan

Landing Page:
- http://localhost/amstelveen/collections
- http://localhost/amstelveen/collections?f=json
- http://localhost/amstelveen/collections?f=html

Resultaat:

in JSON
```json
{
  "links": [
    {
      "href": "http://localhost/amstelveen/collections",
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
          "href": "https://localhost/amstelveen/collections/GroepsopvangBabysEnPeuters/items",
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
          "href": "https://localhost/amstelveen/collections/OpenluchtSportvelden/items",
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
          "href": "https://localhost/amstelveen/collections/SportLokalen/items",
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
          "href": "https://localhost/amstelveen/collections/septemberkermis/items",
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
          "href": "https://localhost/amstelveen/collections/Groendienst/items",
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
[Groepsopvang Babys En Peuters](http://localhost/amstelveen/collections/GroepsopvangBabysEnPeuters/items)|Groepsopvang Babys En Peuters uit de Informatie Vlaanderen API voor de gemeente amstelveen
[Openlucht Sportvelden](http://localhost/amstelveen/collections/OpenluchtSportvelden/items)|Openlucht Sportvelden uit de Informatie Vlaanderen API voor de gemeente amstelveen
[Sport lokalen](http://localhost/amstelveen/collections/SportLokalen/items)|Sport lokalen uit de Informatie Vlaanderen API voor de gemeente amstelveen
[September kermis](http://localhost/amstelveen/collections/septemberkermis/items)|Septemberkermis uit de Informatie Vlaanderen API voor de gemeente amstelveen
[Groendienst](http://localhost/amstelveen/collections/Groendienst/items)|Groendienst uit de Informatie Vlaanderen API voor de gemeente amstelveen

## Klaar voor de volgende stap
Klaar voor [Stap9](./../step9/README.md)!
