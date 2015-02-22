#!/usr/bin/env node
'use strict';
var meow = require('meow');
var depsParser = require('./');

var cli = meow({
  help: [
    'Usage: Fetch Deps and generate json dump file',
    '  deps-parser --fetch <dep1> <dep2> <dep3>',
    'Generate xls from prev json dump file',
    '  deps-parser --gen <jsondump>',
    '',
    'Example',
    '  deps-parser --fetch express',
    '  deps-parser --gen express.json'
  ].join('\n')
}, {
	boolean : ["fetch", "gen", "fetchDevDeps"]
});
console.log("Got flags:", cli.flags);
console.log("Got inputs:", cli.input);

if(cli.flags.fetch || cli.flags.gen) {
	if(cli.flags.fetch) {
		if(cli.input.length == 0) {
			console.log("No dependencies given to fetch");
		} else {
			depsParser.fetchFiles(cli.input, cli.flags);
		}
	}
	if(cli.flags.gen) {
		depsParser.genXLSX(cli.input[0], cli.flags);
	}
} else {
	console.error("Use --flags or --gen to get useful stuff");
}

