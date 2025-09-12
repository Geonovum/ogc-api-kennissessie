# OGC API Knowledge Session

Repository for knowledge sharing on building an OGC API Features & Processes node app.

This is not an operational service.

## OGC API Features step by step

in the folder [OGC-API-Features](./OGC-API-Features/)

## OGC API Processes

in the folder [OGC-API-Processes](./OGC-API-Processes/)

## Start the server locally

1. Install the server dependencies with Node and `npm install`.
2. Start the server in one of the following ways:

   1. From the command line: `node --env-file=.env src/index.js`
   2. In Visual Studio Code: a [.vscode/launch.json](.vscode/launch.json) file is included, with which the server starts with a **press of F5**.

3. The server starts, but port 8080 may not be available.
   1. Then change in the [`.env`](.env) file the line `PORT=8080` to a non-privileged, higher port number, e.g. `PORT=8085`.

4. Open the service in a web browser at `http://localhost:8080/{ID}/v{APIVERSION}`.
   1. E.g. if the port number has been increased: [http://localhost:8080/{ID}/v1/](http://localhost:8080/{ID}/v1/)

## Start the service from Docker Desktop

1. Make sure Docker Desktop and Docker Compose are installed.
2. From the command line: in the folder `docker compose up`

go to http://localhost:8080/{ID}/v1/


On the [wiki](https://github.com/Geonovum/ogc-api-kennissessie/wiki/Starting-the-service-on-Docker-Desktop)
