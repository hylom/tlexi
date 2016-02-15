var debug = module.exports = exports = {};
var util = require('util');

debug.put = function(id, obj) {
  if (obj === undefined) {
    console.error(id);
    this.put(id);
  } else {
    obj = util.inspect(obj, 10);
    console.error(id + ': ' + obj);
  }
}

debug.trace = function (id, str) {
  if (process.env.DEBUG === 'TRACE') debug.put(id, str);
}

debug.debug = function (id, str) {
  if (process.env.DEBUG) debug.put(id, str);
}

