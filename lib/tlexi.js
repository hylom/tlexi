
var fs = require('fs');
var yaml = require('js-yaml');

function load(filename, callback) {
  fs.readFile(filename, function (err, data) {
    if (err) return callback(err);
    var tlexi = createTlexInspector(yaml.safeLoad(data));
    callback(null, tlexi);
  });
}

function createTlexInspector(defs) {
  return new TlexInspector(defs);
};

var TlexInspector = function (defs) {
  this.defs = defs;
};

TlexInspector.prototype.parseText = function (text) {
};

//exports = {};