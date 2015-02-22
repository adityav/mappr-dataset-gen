#  [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-url]][daviddm-image]

> Parser module dependencies to generate mappr.io dataset

There are 2 modes. --fetch and --gen.

`--fetch` fetches dataset for given dependencies and generate a json file.

`--gen` generates an xlsx file for the given json dump.

## Install
Doesn't work.
```sh
$ npm install --save deps-parser
```


## Usage
clone the repository and install the dependencies using `npm install`.

To generate dep Dataset for `express`. we can do

```
./cli.js --fetch express
./cli.js --gen express.json
```
a express.xlsx file should be created in the current directory

### Flags
`--fetchDevDeps` - fetches dev dependencies in addition to regular dependencies. We careful. Express project has 36 dependencies, while dev dependencies are 2873!

### Dev
```js
var deps-parser = require('deps-parser');
```

```sh
$ npm install --global deps-parser
$ deps-parser --help
```


## License

MIT © [Aditya]()


[npm-url]: https://npmjs.org/package/deps-parser
[npm-image]: https://badge.fury.io/js/deps-parser.svg
[travis-url]: https://travis-ci.org/adityav/deps-parser
[travis-image]: https://travis-ci.org/adityav/deps-parser.svg?branch=master
[daviddm-url]: https://david-dm.org/adityav/deps-parser.svg?theme=shields.io
[daviddm-image]: https://david-dm.org/adityav/deps-parser
