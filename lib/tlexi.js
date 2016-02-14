
var fs = require('fs');
var yaml = require('js-yaml');
var stringSplitter = require('./string-splitter');
var util = require('util');

function load(filename, callback) {
  var data = fs.readFileSync(filename);
  var tlexi = createTlexInspector(yaml.safeLoad(data));
  return tlexi;
}

function createTlexInspector(defs) {
  return new TlexInspector(defs);
};

var TlexInspector = function (defs) {
  this.defs = defs;
  //console.log(util.inspect(defs, {depth: 10}));
};

function mergeObject(base, target) {
  for (var key in target) {
    if (util.isArray(base[key])) {
      base[key] = base[key].concat(target[key]);
    }　else if (util.isObject(base[key])) {
      mergeObject(base[key], target[key]);
    } else {
      base[key] = target[key];
    }
  }
}

TlexInspector.prototype.loadMode = function (name) {
  //console.log(this.defs.modes);
  //console.log(name);
  var mode = this.defs.modes[name];
  //console.log(mode);
  if (mode.extends) {
    if (util.isArray(mode.extends)) {
      subMode = mode.extends;
    } else {
      subMode = [mode.extends];
    }
    for (var i = 0; i < subMode.length; i++) {
      var m = this.loadMode(mode.extends[i]);
      mergeObject(mode, m);
    }
  }
  mode.name = name;
  return mode;
};

TlexInspector.prototype.parseText = function (text) {
  var tlexi = this;
  var init = this.defs.initialMode;
  var mode = this.loadMode(init);
  var modeStack = [];
  var valueStack = [];
  var result = [];
  //console.log(mode);

  stringSplitter.split(text, '\n', function (line) {
    var r = proc(line);
    if (r) {
      console.log(r);
    }
  });

  function proc(line) {
    var rex;

    // check conds
    for (var name in mode.cond) {
      var rex = new RegExp(mode.cond[name].regexp);
      m = rex.exec(line);
      if (m) {
        //console.log('"' + line + '" matches ' + rex);
        if (name === 'exit') {
          //console.log('exit ' + mode.name);
          var ret = {
            name: mode.name,
            value: valueStack
          }
          mode = modeStack.pop();
          valueStack = [];
          return ret;
        } else if (mode.cond[name].to) {
          //console.log('enter: ' + mode.cond[name].to);
          valueStack = [];
          modeStack.push(mode);
          mode = tlexi.loadMode(mode.cond[name].to);
          if (m.length > 1) {
            //valueStack.push(proc(m[1]));
            return proc(m[1]);
          } else {
            //valueStack(proc(line));
            return proc(line);
          }
        } else if (mode.cond[name].ignore) {
          return undefined;
        }
      }
    }
    if (mode.singleLine) {
      var ret = {
        name: mode.name,
        value: [line]
      }
      mode = modeStack.pop();
      return ret;
    }
    valueStack.push(line);
  }
};

exports.load = load;
