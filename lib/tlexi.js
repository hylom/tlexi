
var fs = require('fs');
var yaml = require('js-yaml');
var stringSplitter = require('./string-splitter');
var util = require('util');

var debug = {};
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
  debug.trace(1, util.inspect(defs, {depth: 10}));
};

function mergeObject(base, target) {
  for (var key in target) {
    if (util.isArray(base[key])) {
      base[key] = base[key].concat(target[key]);
    }　else if (base[key] instanceof Object) {
      mergeObject(base[key], target[key]);
    } else {
      base[key] = target[key];
    }
  }
}

TlexInspector.prototype.loadMode = function (name) {
  //debug.trace(2, this.defs.modes);
  debug.trace(3, name);
  var mode = this.defs.modes[name];
  debug.trace(4, mode);
  if (mode.extends) {
    if (mode.extends instanceof Array) {
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
  debug.trace(5, mode);

  stringSplitter.split(text, '\n', function (line) {
    var r = proc(line);
    if (r) {
      console.log(r);
    }
  });

  function parseVars(m, str) {
    var ret = str;
    var rex = /\$([0-9]+)/;
    var r = rex.exec(str);
    debug.trace(30, m);
    while(r) {
      var index = Number(r[1]);
      var rex2 = new RegExp('\\$' + index, 'g');
      debug.trace(30, index);
      debug.trace(30, ret);
      debug.trace(30, m[index]);
      debug.trace(30, rex2);
      ret = ret.replace(rex2, m[index]);
      r = rex.exec(ret);
    }
    ret = ret.replace(/\$\$/g, '$');
    return ret;
  }

  function proc(line) {
    var rex;
    var cond;

    // check conds
    for (var name in mode.cond) {
      cond = mode.cond[name];
      var rex = new RegExp(cond.regexp, 'g');
      var elem = mode.name;

      m = rex.exec(line);
      if (m) {
        debug.trace(6, '"' + line + '" matches ' + rex);

        if (name === 'exit') {
          debug.trace(7, 'exit ' + mode.name);
          var ret = {
            element: mode.name,
            value: valueStack
          }
          mode = modeStack.pop();
          valueStack = [];
          return ret;
        } 

        if (cond.to) {
          debug.trace(8, 'enter: ' + cond.to);
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

      }
    }
    if (mode.subMode) {
      var targets = [ line ];
      var subMode;
      for (var subModeName in mode.subMode) {
        debug.trace(23, 'subMode: ' + subModeName);
        subMode = mode.subMode[subModeName];
        rex = new RegExp(subMode.regexp);
        for (var i = 0; i < targets.length; i++) {
          if (!util.isString(targets[i])) {
            continue;
          }
          var subTarget = targets[i];
          var subResults = [];
          m = rex.exec(subTarget);
          while (m) {
            debug.trace(20, 'match ' + subModeName);

            var parsed = { element: subMode.name || subModeName };
            if (subMode.value) {
              parsed.value = parseVars(m, subMode.value);
            } else {
              if (m.length == 1) {
                parsed.value = m[0];
              } else {
                parsed.value = m[1];
              }
            }
            if (subMode.property) {
              parsed.property = {};
              for (var propName in subMode.property) {
                parsed.property[propName] = parseVars(m, subMode.property[propName]);
              }
            }

            var term0 = targets[i].substr(0, m.index);
            var term1 = targets[i].substr(m.index + m[0].length);
            subResults.push(term0);
            subResults.push(parsed);
            subTarget = term1;
            m = rex.exec(subTarget);
          }
          subResults.push(subTarget);
          var newTarget = targets.slice(0, i);
          newTarget = newTarget.concat(subResults);
          newTarget = newTarget.concat(targets.slice(i+1));
          targets = newTarget;
        }
      }
      line = [];
      for (var i = 0; i < targets.length; i++) {
        line = line.concat(targets[i]);
      }
      debug.trace(21, line);
    }

    if (mode.singleLine) {
      var ret = {
        element: mode.name,
        value: util.isArray(line) ? line : [ line ]
      }
      mode = modeStack.pop();
      return ret;
    }

    valueStack = valueStack.concat(line);
  }
};

exports.load = load;
