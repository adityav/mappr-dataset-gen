'use strict';

var _ = require("lodash"),
	assert = require("assert"),
	fs = require("fs"),
	XLSX = require("XLSX"),
	Promise = require("bluebird");

Promise.longStackTraces();
var npm = require("npm");
var onLoad = Promise.promisify(npm.load)({});

module.exports = {
	fetchFiles : function(deps, flags) {
		// Fetch deps
		onLoad.then(function(crap) {
			var ddb = new DepDatasetBuilder(deps, flags);
			ddb.buildDS().then(function(blah) {
				console.log(ddb.dataset);

				fs.writeFile(ddb.name + '.json', JSON.stringify(ddb), function(err, res) {
					if(err) console.error("Error occured in saving file", err);
					else {
						console.log("File saved!", ddb.name + '.json');
					}
				})
			});
		});
	},
	genXLSX : function (jsondumpName, flags) {
		var ds = JSON.parse(fs.readFileSync(jsondumpName, { encoding : "UTF-8"}));
		genXLSXFromDataset(ds);	
	}
}

function DepDatasetBuilder (baseDeps, opts) {
	this.dataset = {};
	this.name = baseDeps.join("_");
	this.depsToProcess = baseDeps;
	this.dataProps = ["id", "label", "name", "desc", "version", "license", "author",
	"repoUrl", "main", "homepage", "maintainers", "keywords",
	"contributors", "dependencies", "devDependencies", "createdAt", "modifiedAt"];
	this.fetchDevDeps = !!opts.fetchDevDeps;
}

DepDatasetBuilder.prototype.buildDS = function() {
	return this.buildDataset(this.depsToProcess);
};

DepDatasetBuilder.prototype.fetchDepInfo = function(depName) {
	return onLoad.then(function fetchInfo () {
		return new Promise(function (resolve, reject) {
			npm.commands.view([depName], true, function(err, res) {
				if(err) {
					console.warn("Error in fetching information for dep " + depName + ". Error :", err);
					resolve({
						name : depName
					});
				} else {
					resolve(_.values(res)[0]);
				}
			});
		});
	});
};

DepDatasetBuilder.prototype.buildDataset = function(depsToProcess) {
	var self = this;

	if(depsToProcess.length === 0) {
		console.log("Processing finished");
		return Promise.resolve(self);
	}
	var fetchP = _.map(depsToProcess, function (dep) {
		console.log("Fetching dep for " + dep + " ....");
		return self.fetchDepInfo(dep)
			.tap(function() { console.log("fetched info for " + dep); });
	}, {concurrency: 15});

	return Promise.all(fetchP).then(function (gotInfos) {
		var infos = _.compact(gotInfos);
		// Information for all deps in queue have been fetched
		var nodes = _.map(infos, function (depInfo) {
			var node = new Node(depInfo);
			self.dataset[node.name] = node;
			return node;
		});

		// process sub deps
		var newdepsToProcess = [];
		_.each(nodes, function (node) {

			var depsToFetch = node.dependencies;
			if(self.fetchDevDeps)
				depsToFetch.concat(node.devDependencies);
			var subDeps = _.filter(depsToFetch, function (subdep) {
				return newdepsToProcess.indexOf(subdep) === -1 && !self.dataset[subdep];
			});
			_.each(subDeps, function processDeps (dep) {
				newdepsToProcess.push(dep);
			}, self);
		});

		return self.buildDataset(newdepsToProcess);
	});
};

function Node (depInfo) {
	assert(depInfo, "Dep Info needs to be valid");
	this.id = depInfo.name;
	this.label = depInfo.name;
	this.name     = depInfo.name;
	this.desc     = depInfo.description;
	this.version  = depInfo.version;
	this.license  = depInfo.license;
	this.author   = depInfo.author;
	this.repoUrl = "";
	
	if(depInfo.repository)
		this.repoUrl  = depInfo.repository.url || "";
	else {
		console.log("No repo found for:", depInfo);
	}
	this.main = depInfo.main || "";
	this.homepage = depInfo.homepage;

	this.maintainers     = _.values(depInfo.maintainers) || [];
	this.keywords        = depInfo.keywords || [];
	this.contributors    = _.values(depInfo.contributors) || [];
	this.dependencies    = _.keys(depInfo.dependencies) || [];
	this.devDependencies = _.keys(depInfo.devDependencies) || [];

	if(depInfo.time) {
		this.createdAt  = depInfo.time.created;
		this.modifiedAt = depInfo.time.modified;
	} else {
		console.log("No time found for:", depInfo);
		this.createdAt  = "";
		this.modifiedAt = "";
	}
}
//
// Excel gen code
//

function genXLSXFromDataset (DepDataset) {
	var data = [];
	var dataPoints = DepDataset.dataProps;
	var dataset = DepDataset.dataset;
	// attrs
	data.push(dataPoints);

	_.each(dataset, function(datum, datumName) {
		var row = [];

		_.each(dataPoints, function (dp) {
			var item = datum[dp];
			if(_.isArray(item)) {
				if(dp === "contributors" || dp === "maintainers") {
					item = _.pluck(item,'name');
				}
				
				item = item.join(" | ");
			} else if(_.isObject(item)) {
				item = _.values(item).join(" | ");
			} else if(item == null) item = "";
			row.push(item);
		});

		data.push(row);
	});

	console.log("Number of rows:" + data.length);

	var ws_name = "SheetJS";

	var wb = new Workbook(), ws = sheet_from_array_of_arrays(data);
	 
	/* add worksheet to workbook */
	wb.SheetNames.push(ws_name);
	wb.Sheets[ws_name] = ws;
	 
	/* write file */
	XLSX.writeFile(wb, 'test.xlsx');
}

function sheet_from_array_of_arrays(data, opts) {
	var ws = {};
	var range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }};
	for(var R = 0; R != data.length; ++R) {
		for(var C = 0; C != data[R].length; ++C) {
			if(range.s.r > R) range.s.r = R;
			if(range.s.c > C) range.s.c = C;
			if(range.e.r < R) range.e.r = R;
			if(range.e.c < C) range.e.c = C;
			var cell = {v: data[R][C] };
			if(cell.v == null) continue;
			var cell_ref = XLSX.utils.encode_cell({c:C,r:R});
			
			if(typeof cell.v === 'number') cell.t = 'n';
			else if(typeof cell.v === 'boolean') cell.t = 'b';
			else if(cell.v instanceof Date) {
				cell.t = 'n'; cell.z = XLSX.SSF._table[14];
				cell.v = datenum(cell.v);
			}
			else cell.t = 's';
			
			ws[cell_ref] = cell;
		}
	}
	if(range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
	return ws;
}

function Workbook() {
	if(!(this instanceof Workbook)) return new Workbook();
	this.SheetNames = [];
	this.Sheets = {};
}
 
function Workbook() {
	if(!(this instanceof Workbook)) return new Workbook();
	this.SheetNames = [];
	this.Sheets = {};
}
 
