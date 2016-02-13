//exports

function split(str, separator, callback) {
  var rex = new RegExp(separator, "gm");
  var res = rex.exec(str);
  var counter = 0;
  while (res) {
    callback(str.substring(counter, res.index));
    counter = res.index + separator.length;
    res = rex.exec(str);
  }
  callback(str.substring(counter, str.length));
};

exports.split = split;
