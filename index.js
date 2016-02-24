// tlexi.js

var tlexi = require('./lib/tlexi');
var tlexc = require('./lib/tlexc');
var fs = require('fs');

function parse(text, inspector, converter) {
  if (typeof inspector === 'string') {
    if (inspector === 'jarkup') {
      var i = tlexi.load('./inspector/jarkup.yaml');
    }
  }
  if (typeof converter === 'string') {
    if (converter === 'html') {
      var c = tlexc.load('./converter/html.yaml');
    }
  }
  
  var t = i.parseText(text);
  var ret = c.parseTlex(t);

  return ret;
}

exports.parse = parse;
