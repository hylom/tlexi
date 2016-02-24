// tlexi.js

var tlexi = require('./lib/tlexi');
var tlexc = require('./lib/tlexc');
var fs = require('fs');
var path = require('path');

function parse(text, inspector, converter) {
  var base_dir = path.dirname(module.filename);
  
  if (typeof inspector === 'string') {
    if (inspector === 'jarkup') {
      var i = tlexi.load(path.join(base_dir, 'inspector/jarkup.yaml'));
    }
  }
  if (typeof converter === 'string') {
    if (converter === 'html') {
      var c = tlexc.load(path.join(base_dir, 'converter/html.yaml'));
    }
  }
  
  var t = i.parseText(text);
  var ret = c.parseTlex(t);

  return ret;
}

exports.parse = parse;
