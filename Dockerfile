FROM node:22-alpine

# Mounting point for data 
RUN mkdir -p /home/node/okapi/data

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

ENV VERSION=1.2.4
ENV DATA_PATH=/home/node/okapi/data

EXPOSE 8080

CMD [ "node", "src/index.js" ]
