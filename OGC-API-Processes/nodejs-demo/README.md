# OGC API Processes NodeJS Demo server


De nodejs demo in deze repository is een implementatie van zowel een OGC API Features server als een OGC API Processes server.

De Source code staat in de src folder.

Deze kan met node uitgevoerd worden zoals in de [instructies](./../../README.md) staat beschreven.

Er zijn 3 verschillende processes geimplementeerd.
Dit laat zien dat het aangeroepen proces op verschillende manieren geimplementeerd kan worden. In alle gevallen is het launch.js script de 'glue' tussen de OGC-API Processes NodeJS server en het betreffende proces. 

### addNumbers
- Shell script add.sh

Afhankelijk van het OS wordt een batch file of een shell script aangeroepen.

### countFeatures
- nodejs script count.js

### echoService
- Shell script echo.sh

Afhankelijk van het OS wordt een batch file of een shell script aangeroepen.

Neemt één string als input en geeft dezelfde string terug als output. Werkt synchroon of asynchroon.
