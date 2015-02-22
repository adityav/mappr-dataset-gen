/*global describe, it */
'use strict';
var assert = require('assert');
var depsParser = require('../');

describe('deps-parser node module', function () {
  it('must have at least one test', function () {
    depsParser();
    assert(true, 'I was too lazy to write any tests. Shame on me.');
  });
});
