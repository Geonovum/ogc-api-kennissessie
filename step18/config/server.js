var config = module.exports

config.version = process.env.APIVERSION || '1.2.3'
config.mountPath = process.env.MOUNTPATH || "amstelveen"

config.express = {
  port: process.env.EXPRESS_PORT || 80,
}

config.limit = process.env.LIMIT || 1000

config.encodings = ['application/geo+json', 'application/json', 'text/html']
