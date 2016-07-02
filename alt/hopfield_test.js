var fs = require('fs')
var helpers = require('./DroneHelpers.js');
var PNG2 = require('png-js');
var synaptic = require('synaptic'); // this line is not needed in the browser
var Neuron = synaptic.Neuron,
	Layer = synaptic.Layer,
	Network = synaptic.Network,
	Trainer = synaptic.Trainer,
	Architect = synaptic.Architect;
var PNG = require('pngjs').PNG;

const DB_NAME = 'database.csv';
const PIXEL_DIVIDER = 40;
var hopfield = new Architect.Hopfield(432);

var DBdata = helpers.loadDatabase(DB_NAME);
var testData = DBdata.splice(0, 1);
DBdata = DBdata.slice(0, 100);

trainImages(DBdata);

function trainImages(db_array) {
	var row = db_array.shift();
	var p1 = helpers.getInputDataFromImage(row[0], PIXEL_DIVIDER);

	p1.then(function(inputData) {
		console.log('learning ' + row[0]);
		hopfield.learn(inputData);

		if (db_array.length > 0) trainImages(db_array);
		else {
			console.log(' ');
			console.log('start feeding...');
			feedImages(testData);
		}
	});

}

function feedImages(db_array) {
	var row = db_array.shift();

	fs.createReadStream('records/' + row[0])
		.pipe(new PNG({
			filterType: 4
		}))
		.on('parsed', function() {
			// var self = {
			// 			data: this.data,
			// 			height: 360,
			// 			width: 640
			// 		}
			var inputData = helpers.getInputData(this, PIXEL_DIVIDER, 0);
			inputData = helpers.standardizeData(inputData);

			var res = hopfield.feed(inputData);

			var pixels = [];
			for (var i = 0; i < res.length; i++) {
				pixels.push(Math.round(res[i] * 255 + 128));
				if (i % 3 == 0) pixels.push(255); // readd alpha channel
			}

			console.log('pixels: ' + pixels.length);
			console.log(pixels);
			this.data = pixels;
			this.height = 9;
			this.width = 16;

			this.pack().pipe(fs.createWriteStream('out.png'));
		});
}