var config = module.exports

config.express = {
  port: process.env.EXPRESS_PORT || 80,
}

config.limit = process.env.LIMIT || 1000

config.encodings = ['application/geo+json', 'application/json', 'text/html']
