var MongoClient = require('mongodb').MongoClient;
const config = require('./config/server')

var _client
var _dbo

module.exports = {
    connect: async function() {
        _client = await  MongoClient.connect(config.mongodb.connectString, { useUnifiedTopology: true })
        _dbo = _client.db('FeaturesCoreDemo')
    },

    db: function() {
        return _dbo;
    }

}
