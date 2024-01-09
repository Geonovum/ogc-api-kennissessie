var MongoClient = require('mongodb').MongoClient;
const config = require('./config/server')

var _client
var _dbo

module.exports = {
    connect: function(callback) {
        MongoClient.connect(config.mongodb.connectString, { useUnifiedTopology: true }, function(err, client) {
            _client = client
            _dbo = _client.db('FeaturesCoreDemo')
            return callback( err )
        })
    },

    getCollections: function(path, callback) {
        _dbo.listCollections().toArray(function(err, collections) {
            if(err) callback(err, undefined)
            
            var names = [];
            collections.forEach(collection => { names.push(collection.name) });

            callback(undefined, names)
        })
    },

    db: function() {
        return _dbo;
    },

}



    /*
        
        var query = { name: "groendienst" };
        dbo.collection("Kontich").find({}).count(function (err, count) {
            if (err) throw err;
            console.log(count);
        });
    */
