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
  var templ = rule.template || rule;

  if (rule.filter) {
    var filterRule = rule.filter;
    var v = value[1];
    if (rule.regexp) {
      var r = new RegExp(rule.regexp);
      var m = r.exec(value);
      if (m && m.length > 1) {
        v = m[1];
      } else {
        v = '';
      }
    }
    value[1] = filterRule.replace(/\$1/g, v[1]);
  }

  var result = templ.replace(/\$0/g, value[0]);
  var result = result.replace(/\$1/g, value[1]);
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

  function applyFilter(str, filter) {
    var filters = tlexc.defs.filters[filter];
    debug.trace(110, str)
    debug.trace(110, filters)
    var ret = str;
    if (filters) {
      filters.forEach(function (item) {
        var rex = new RegExp(item.regexp, 'g');
        ret = ret.replace(rex, item.replace);
      });
    }
    return ret;
  }

  function getValue(item) {
    var result = [];
    var t;
    result[0]  = '';
    result[1] = '';
    debug.trace(1000, item.value)
    if (item.value instanceof Array) {
      item.value.forEach(function (itemValue) {
        if (typeof itemValue === 'string') {
          if (itemValue.length > 0) {
            result[0] += itemValue;
            result[1] += applyFilter(itemValue, 'value');
          }
        } else {
          t = proc(itemValue);
          result[0] += t;
          result[1] += t;
        }
      });
    } else {
      result[0] += item.value
      result[1] += applyFilter(item.value, 'value');
    }
    debug.trace(1001, result)
    return result;
  }

  return result;
}

exports.load = load;
exports.createTlexConverter = createTlexConverter;
