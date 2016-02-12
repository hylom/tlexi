// tlexi.js

var tlexi = require('lib/tlexi');
var commander = require('commander');

commander.option('-p, --parser <file>', 'parser file')
  .parse(process.argv);

if (!commander.parser) {
  console.log('you must give -p option');
  process.exit(1);
}


