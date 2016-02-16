// tlexi.js

var tlexi = require('./lib/tlexi');
var tlexc = require('./lib/tlexc');
var commander = require('commander');
var fs = require('fs');
var util = require('util');

commander.version('0.0.1')
  .option('-i, --inspector <file>', 'inspector file')
  .option('-c, --converter <file>', 'converter file')
  .arguments('<filename>')
  .action( function (filename) {
    commander.filename = filename;
  })
  .parse(process.argv)

if (!commander.inspector) {
  commander.outputHelp();
  console.log('error: you must give -i and -c option');
  process.exit(1);
}

if (!commander.filename) {
  commander.outputHelp();
  process.exit(1);
}

function main() {
  var i = tlexi.load(commander.inspector);
  var text = fs.readFileSync(commander.filename, 'utf8');
  var ret;
  var t = i.parseText(text);

  //console.log(t);

  if (commander.converter) {
    var c = tlexc.load(commander.converter);
    t = c.parseTlex(t);
  }
  console.log(util.inspect(t, {depth:10}));
}

main();
