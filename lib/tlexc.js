// tlexc.js - TLEX converter

var template = require('./template');
var fs = require('fs');
var yaml = require('js-yaml');
var debug = require('./debug');
var util = require('util');

function load(filename, callback) {
  var data = fs.readFileSync(filename);
  var tlexc = createTlexConverter(yaml.safeLoad(data));
  return tlexc;
}

function createTlexConverter(defs) {
  return new TlexConverter(defs);
};

var TlexConverter = function (defs) {
  this.defs = defs;
  debug.trace(1, util.inspect(defs, {depth: 10}));
};

function parseTerm(rule, item, value) {
  var templ = rule.value || rule;
  var result = templ.replace(/\$1/g, value);
  debug.trace(103, result);

  if (item.property) {
    debug.trace(103, item.property);
    result = template.execute(result, item.property);
    debug.trace(104, result);
  }
  return result;
}

TlexConverter.prototype.parseTlex = function (tlex) {
  var tlexc = this;
  var ret = '';

  debug.trace(100, tlexc);

  tlex.forEach(function (item) {
    debug.trace(101, item);
    debug.trace(101, proc(item));
    ret += proc(item);
  });
  return ret;

  function proc(item) {
    var result = '';
    for (var name in tlexc.defs.elements) {
      debug.trace(102, name);
      if (name === item.element) {
        return parseTerm(tlexc.defs.elements[name], item, getValue(item));
      }
    }
    return '';
  }

  function getValue(item) {
    var result = '';
    debug.trace(1000, item.value)
    if (item.value instanceof Array) {
      item.value.forEach(function (itemValue) {
        if (typeof itemValue === 'string') {
          result += itemValue;
        } else {
          result += proc(itemValue);
        }
      });
    } else {
      result += item.value
    }
    debug.trace(1001, result)
    return result;
  }



  return result;
}

exports.load = load;
exports.createTlexConverter = createTlexConverter;
