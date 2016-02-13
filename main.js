// tlexi.js

var tlexi = require('./lib/tlexi');
var commander = require('commander');
var fs = require('fs');

commander.version('0.0.1')
  .option('-p, --parser <file>', 'parser file')
  .arguments('<filename>')
  .action( function (filename) {
    commander.filename = filename;
  })
  .parse(process.argv)

if (!commander.parser) {
  commander.outputHelp();
  console.log('error: you must give -p option');
  process.exit(1);
}

if (!commander.filename) {
  commander.outputHelp();
  process.exit(1);
}

function main() {
  var t = tlexi.load(commander.parser);
  var text = fs.readFileSync(commander.filename, 'utf8');
  t.parseText(text);
}

main();
