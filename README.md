# OGC API Knowledge Session

🐳 **Docker Image**: `lathoub/okapi:latest`

A comprehensive OGC API Features & Processes implementation in Node.js for educational purposes and knowledge sharing. This Docker image provides a complete OGC API server with support for both Features and Processes standards.

## 🚀 Quick Start with Docker

```bash
# Pull and run the image
docker pull lathoub/okapi:latest
docker run -p 8080:8080 -v ./data:/home/node/okapi/data lathoub/okapi:latest
```

Then visit: `http://localhost:8080/{ID}/v1/`

## 📋 What's Included

- **OGC API Features** (Part 1-9): Complete implementation with filtering, CRS support, property selection, and more
- **OGC API Processes**: Process execution capabilities with async support
- **Multi-platform support**: Runs on both AMD64 and ARM64 architectures

> **Note**: This is an educational repository for knowledge sharing, not intended for production use.

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

## 🐳 Docker Usage

### Using Docker Compose
```bash
# Clone the repository and run with Docker Compose
git clone <repository-url>
cd ogc-api-kennissessie
docker compose up
```

### Using the Docker Image Directly
```bash
# Run with custom data volume
docker run -p 8080:8080 -v /path/to/your/data:/home/node/okapi/data lathoub/okapi:latest

# Run with default sample data
docker run -p 8080:8080 lathoub/okapi:latest
```

### Environment Variables
- `PORT`: Server port (default: 8080)
- `NODE_ENV`: Environment mode (development/production)

### Supported Platforms
- `linux/amd64` (Intel/AMD processors)
- `linux/arm64` (Apple Silicon, ARM processors)

## 📚 Documentation


On the [wiki](https://github.com/Geonovum/ogc-api-kennissessie/wiki/Starting-the-service-on-Docker-Desktop)
