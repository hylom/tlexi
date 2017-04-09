
var fs = require('fs');
var yaml = require('js-yaml');
var stringSplitter = require('./string-splitter');
var util = require('util');
var debug = require('./debug');

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
  var tlexi = this;
  //debug.trace(2, this.defs.modes);
  debug.trace(3, name);
  var mode = {};
  for (var key in this.defs.modes[name]) {
    mode[key] = this.defs.modes[name][key];
  }
  // load subModes
  if (mode.subModes && mode.subModes instanceof Array) {
    var tmp = mode.subModes;
    mode.subModes = {};
    tmp.forEach(function (subModeName) {
      if (tlexi.defs.subModes && tlexi.defs.subModes[subModeName]) {
        mode.subModes[subModeName] = tlexi.defs.subModes[subModeName];
      }
    });
  }

  var subMode;
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
  var currentMode = init ? this.loadMode(init) : undefined;
  var modeStack = [];
  var valueStack = [];
  var result = [];
  debug.trace(5, currentMode);

  stringSplitter.split(text, '\n', function (line) {
    line = line.replace('\r', '');
    var r = proc(line);
    if (r) {
      result.push(r);
    }
  });
  return result;

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
    debug.trace(0, line);
    debug.trace(0, currentMode);
    var rex;
    var mode;

    // check ignore
    //if (cond.ignore) {
    //  return undefined;
    //}

    // check exit
    if (currentMode.exit) {
      debug.trace(40, currentMode);
      var rex = new RegExp(currentMode.exit, 'g');
      if (rex.test(line)) {
        debug.trace(7, 'exit ' + currentMode.name);
        var ret = {
          element: currentMode.name,
          value: valueStack
        }
        currentMode = modeStack.pop();
        valueStack = [];
        return ret;
      }
    }
      
    // check regexp
    for (var elem in tlexi.defs.modes) {
      mode = tlexi.defs.modes[elem];
      if (!mode.regexp) continue;
      var rex = new RegExp(mode.regexp, 'g');
      m = rex.exec(line);
      if (m) {
        debug.trace(6, '"' + line + '" matches ' + rex);
        if (currentMode.name === elem) {
          continue;
        }
        debug.trace(8, 'enter: ' + elem);
        valueStack = [];
        if (currentMode) {
          modeStack.push(currentMode);
        }
        currentMode = tlexi.loadMode(elem);
        if (m.length > 1) {
          line =  m[1];
        } else {
          return '';
        }
      }
    }

    // apply filter
    if (currentMode.filter) {
      line = currentMode.filter.replace(/\$1/g, line)
    }

    // process subModes
    if (currentMode.subModes) {
      var baseTargets = [ line ];
      var subMode;

      debug.trace(23, currentMode);
      for (var modeName in currentMode.subModes) {
        debug.trace(31, "proc subMode: " + modeName);
        debug.trace(31, baseTargets);
        procSubMode(modeName, baseTargets);
      }

      function procSubMode(subModeName, targets) {
        var subMode = currentMode.subModes[subModeName];
        debug.trace(23, 'subModeName: ' + subModeName);
        debug.trace(23, 'subMode: ' + subMode);
        debug.trace(23, targets);
        rex = new RegExp(subMode.regexp);
        for (var i = 0; i < targets.length; i++) {
          debug.trace(30, targets[i]);
          var subTarget;
          if (typeof targets[i] === 'string') {
            if (targets[i].length == 0) {
              continue;
            }
            subTarget = targets[i];
          } else if (typeof targets[i] === 'object' &&
                     targets[i].value) {
            if (typeof targets[i].value === 'string') {
              targets[i].value = [targets[i].value];
            }
            debug.trace(34, "enter procSubMode")
            procSubMode(subModeName, targets[i].value);
            continue;
          } else {
            continue;
          }
          debug.trace(33, subTarget);
          var subResults = [];
          m = rex.exec(subTarget);
          if (!m) {
            debug.trace(20, 'unmatch ' + subMode.name);
          }
          while (m) {
            debug.trace(20, 'match ' + subMode.name);

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
          /*
          var newTarget = targets.slice(0, i);
          newTarget = newTarget.concat(subResults);
          newTarget = newTarget.concat(targets.slice(i+1));
          targets = newTarget;
          */
          debug.trace(33, subResults);
          targets.splice(i, 1);
          for (var j = 0; j < subResults.length; j++) {
            targets.splice(i+j, 0, subResults[j])
          }
        }
      }

      line = [];
      for (var i = 0; i < baseTargets.length; i++) {
        line = line.concat(baseTargets[i]);
      }
      debug.trace(21, line);
    }

    if (currentMode.singleLine) {
      var ret = {
        element: currentMode.name,
        value: line instanceof Array ? line : [ line ]
      }
      currentMode = modeStack.pop();
      return ret;
    }

    debug.trace(99, line);
    valueStack = valueStack.concat(line);
  }
};

exports.load = load;
