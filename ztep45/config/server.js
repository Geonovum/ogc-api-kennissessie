var config = module.exports

config.express = {
  port: process.env.EXPRESS_PORT || 80,
}

config.encodings = ['application/geo+json', 'application/json', 'text/html']

config.mongodb = {
  connectString: process.env.MONGODB_HOST || 'mongodb+srv://lathoub:N61u9K0Go3a5iGof@cluster0.kgrbq.mongodb.net/'
}
