# Wat heeft Kontich te bieden qua geo bestanden? (Cont)

- Frituren
- Groepsopvang Babys En Peuters 
- Openlucht Sportveld 
- Sport lokaal 
- Water

(Met dank aan Michel Stuyts, GIS-coördinator. Zie ook op https://michelstuyts.be/ - https://stuyts.xyz)

## Stap 1:
Zoals altijd, ga naar de step11 directory met je command prompt, en installeer express als het de eerste keer dat je node gaat opstarten in deze directory. `npm update`

## Code for `/collections/:collectionId/items`

```javascript

...
router.get('/collections/:collectionId/items', function (req, res) {
  if (null == dataDict[req.params.collectionId])
  {
    res.status(404).send("The requested URL " + req.url + " was not found on this server");
    return;
  }

  var urlParts = url.parse(req.url, true);
  if (null == urlParts.query.f) 
    res.send(make.items("html", req.params.collectionId, dataDict[req.params.collectionId]));
  else if ("json" == urlParts.query.f) 
    res.json(make.items("json", req.params.collectionId, dataDict[req.params.collectionId]));
  else if ("html" == urlParts.query.f)
    res.send(make.items("html", req.params.collectionId, dataDict[req.params.collectionId]));
  else
    res.json(400, "{'code': 'InvalidParameterValue', 'description': 'Invalid format'}") 
})

...

```

## Testen, eindelijk een kaartje!
```
node index.js
```

`Example app listening at http://localhost:80`

In je browser of via PostMan

Landing Page:
- http://localhost/kontich/collections/groendienst/items
- http://localhost/kontich/collections/groendienst/items?f=json
- http://localhost/kontich/collections/groendienst/items?f=html

## Klaar voor de volgende stap
https://github.com/geonovum/ogc-api-kennissessie/blob/master/step12/README.md

