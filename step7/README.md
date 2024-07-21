# Landing Page in JSON & HTML

De Landing Page in Step6 was enkel beschikbaar in JSON, in deze les maken we die ook beschikbaar in HTML

## Stap 1:
Zoals altijd, ga naar de step7 directory met je command prompt, en installeer express als het de eerste keer dat je node gaat opstarten in deze directory. `npm update`

We gaan swig-templates gebruiken om de html landingPage te maken (swig zit nu in `package.json`)

## Code voor `/` (Landing Page)

```javascript
...
var make = require('./landingPage');
...
// define the home page route
router.get('/', function (req, res) {
  
  var contentType = "";
  var accept = req.headers.accept;
  if ("application/json" == accept)
    contentType = "json";
  else if ("text/html" == accept)
    contentType = "html";

  var urlParts = url.parse(req.url, true);
  if (null != urlParts.query.f)
  {
    if ("json" == urlParts.query.f)
      contentType = "json";
    else if ("html" == urlParts.query.f)
      contentType = "html";
    else {
      res.json(400, "{'code': 'InvalidParameterValue', 'description': 'Invalid format'}");
      return;
    }
  }

  if (contentType == "")
    contentType = "html";

  if ("json" == contentType)
    res.json(make.landingPage(contentType))
  else if ("html" == contentType)
    res.send(make.landingPage(contentType))

})
```

De javascript module [landingPage](https://github.com/geonovum/ogc-api-kennissessie/tree/master/step7/landingPage.js) maakt het JSON of HTML antwoord.


## Testen:
Run de app

`Example app listening at http://localhost:80`

In je browser of Insomnia via PostMan

Landing Page:
- http://localhost/kontich
- http://localhost/kontich?f=json

Resultaat:

> `{"title":"Kontich","description":"Access to data about buildings in the city of Kontich via a Web API that conforms to the OGC API Features specification.","links":[{"href":"http://localhost/kontich/","rel":"self","type":"application/json","title":"this document"},{"href":"http://localhost/kontich/api","rel":"service-desc","type":"application/vnd.oai.openapi+json;version=3.0","title":"the API definition"},{"href":"http://localhost/kontich/api.html","rel":"service-doc","type":"text/html","title":"the API documentation"},{"href":"http://localhost/kontich/conformance","rel":"conformance","type":"application/json","title":"OGC API conformance classes implemented by this server"},{"href":"http://localhost/kontich/collections","rel":"data","type":"application/json","title":"Information about the feature collections"}]}`

Landing Page:
http://localhost/kontich?f=html

## Klaar voor de volgende stap
https://github.com/geonovum/ogc-api-kennissessie/blob/master/step8/README.md
