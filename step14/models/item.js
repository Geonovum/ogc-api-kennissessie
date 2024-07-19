const debug = require('debug')('models')

function get (callback) {
  
    debug(`item`)
    
    var content = {};

    return callback(undefined, content);
  }
  
  module.exports = {
    get,
  }