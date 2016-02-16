

function execute(template, value) {
  var terms = [];
  var rex = /(\$[0-9A-Za-z_]+|\$\$)/;
  var r = rex.exec(template);
  if (!r) {
    return template;
  }
  while(r) {
    var key = r[1];
    terms.push(template.substring(0, r.index));
    terms.push(template.substr(r.index, r[1].length));
    template = template.substr(r.index + r[1].length);
    r = rex.exec(template);
  }

  var results = [];
  terms.forEach(function (term) {
    if (term === '$$') {
      results.push('$');
      return;
    }
    if (term[0] === '$') {
      var key = term.substr(1);
      if (value[key]) {
        results.push(value[key]);
      } else {
        results.push(term);
      }
      return;
    }
    results.push(term);
    return;
  });
  return results.join('');
}


function test() {
  var t = "$value $element $bar $hoge $$$value";
  var val = {element: "elem", value: "val"};
  return execute(t, val);
}

exports.execute = execute;
