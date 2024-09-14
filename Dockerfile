# This is our runtime container that will end up
# running on the device.
FROM --platform=linux/amd64 node:alpine AS build_amd64
FROM --platform=linux/arm64 node:alpine AS build_arm64

LABEL maintainer="Bart De Lathouwer <b.delathouwer@geonovum.nl>"

# Create app directory, our data will be in /usr/local/bin
WORKDIR /usr/local/bin/ocapi

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install

# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY src/ src/
COPY local*.yml ./

EXPOSE 8080

CMD [ "node", "src/index.js" ]