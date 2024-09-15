# This is our runtime container that will end up
# running on the device.
FROM --platform=linux/amd64 node:alpine AS build_amd64
FROM --platform=linux/arm64 node:alpine AS build_arm64

# Create app directory, all program files will be here
# (data (content) files will be mounted later)
WORKDIR /usr/local/bin/okapi

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

ENV PORT=8080

EXPOSE ${PORT}

CMD [ "node", "src/index.js" ]
