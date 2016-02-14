
var fs = require('fs');
var yaml = require('js-yaml');
var stringSplitter = require('./string-splitter');
var util = require('util');

function debugPrint(id, str) {
  if (process.env.DEBUG) {
    if (str === undefined) {
      str = id;
      str = util.inspect(str, 10);
      process.stderr.write(str + "\n");
    } else {
      str = util.inspect(str, 10);
      process.stderr.write(id + ': ' + str + "\n");
    }
  }
}

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
  debugPrint(1, util.inspect(defs, {depth: 10}));
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
  //debugPrint(2, this.defs.modes);
  debugPrint(3, name);
  var mode = this.defs.modes[name];
  debugPrint(4, mode);
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
  debugPrint(5, mode);

  stringSplitter.split(text, '\n', function (line) {
    var r = proc(line);
    if (r) {
      console.log(r);
    }
  });

  function parseVars(m, str) {
    var ret = str;
    var r = /\$([0-9]+)/.exec(str);
    while(r) {
      var index = Number(r[1]);
      ret = ret.replace(new RegExp('$' + index, 'g'), m[index]);
      r = /\$([0-9]+)/.exec(ret);
    }
    return ret;
  }

  function proc(line) {
    var rex;
    var cond;

    // check conds
    for (var name in mode.cond) {
      cond = mode.cond[name];
      var rex = new RegExp(cond.regexp);
      var elem = mode.name;

      m = rex.exec(line);
      if (m) {
        debugPrint(6, '"' + line + '" matches ' + rex);

        if (name === 'exit') {
          debugPrint(7, 'exit ' + mode.name);
          var ret = {
            element: mode.name,
            value: valueStack
          }
          mode = modeStack.pop();
          valueStack = [];
          return ret;
        } 

        if (cond.to) {
          debugPrint(8, 'enter: ' + cond.to);
          valueStack = [];
          modeStack.push(mode);
          mode = tlexi.loadMode(cond.to);
          if (m.length > 1) {
            //valueStack.push(proc(m[1]));
            return proc(m[1]);
          }
          //valueStack(proc(line));
          return proc(line);
        }

        if (cond.ignore) {
          return undefined;
        }

        if (cond.element) {
          var elem = cond.var;
          var ret = {
            name: elem.name || name
          }
          if (elem.value) {
            ret.value = [ parseVars(m, elem.vlaue) ];
          } else {
            ret.value = m[0];
          }
          if (elem.property) {
            ret.property = {};
            for (var propName in elem.property) {
              ret.property[propName] = parseVars(m, elem.property[propName]);
            }
          }
          debugPrint(9, ret);
        }

      }
    }
    if (mode.singleLine) {
      var ret = {
        element: mode.name,
        value: [line]
      }
      mode = modeStack.pop();
      return ret;
    }
    valueStack.push(line);
  }
};

exports.load = load;
