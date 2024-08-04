# This is our runtime container that will end up
# running on the device.
# Note: M1 uses it own directive
FROM --platform=linux/amd64 node:alpine 
# FROM node:alpine

# Create app directory, our data will be in /usr/src/data
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 8080

CMD [ "node", "src/index.js" ]