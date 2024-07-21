# Wat heeft Kontich te bieden qua geo bestanden? (Cont)

- Frituren
- Groepsopvang Babys En Peuters 
- Openlucht Sportveld 
- Sport lokaal 
- Water

(Met dank aan Michel Stuyts, GIS-coördinator. Zie ook op https://michelstuyts.be/ - https://stuyts.xyz)

## Stap 0:
Grote veranderingen:
- Service now starts in app.js (see modified launch.json)
- using a debug logger
- Controllers, Models & Views
- Routes naar Controllers
- Accepts (als middleware)

## Stap 1:
Zoals altijd, ga naar de step14 directory met je command prompt, en installeer express als het de eerste keer dat je node gaat opstarten in deze directory. `npm update`

## Code for `/collections/:collectionId/items/:featureId`

```javascript

...
// define the about route
router.get('/collections/:collectionId/items/:featureId', function (req, res) {
  console.log(req.params);
  res.send('collections/:collectionId/items/:featureId')
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
- http://localhost/kontich/collections/water/items
- http://localhost/kontich/collections/water/items?f=json
- http://localhost/kontich/collections/water/items?f=html
