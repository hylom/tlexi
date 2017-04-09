// tlexi.js

var tlexi = require('./index');
var commander = require('commander');
var fs = require('fs');
var util = require('util');
var debug = require('./lib/debug');

commander.version('0.1.3')
  .option('-i, --inspector <inspector>', 'inspector name')
  .option('-c, --converter <converter>', 'converter name')
  .option('-t, --trace', 'trace output for debug')
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
  if (commander.trace) {
    process.env.DEBUG = 'TRACE';
  }
  var text = fs.readFileSync(commander.filename, 'utf8');
  var ret = tlexi.parse(text, commander.inspector, commander.converter);
  console.log(ret);
}

main();
