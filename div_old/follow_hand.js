const PIXEL_DIVIDER = 22; // früher "TEILER", übernehmen aus train_images
const MARGIN_DIVIDER = 20; // übernehmen aus train_images

// const INPUT_LAYER = 897;
// const HIDDEN_LAYER = 20;
// const MAX_ITERATIONS = 100;

// const DB_NAME = 'database.csv';
// const TRAINING_DATA_NAME = 'saves/trainingData_p' + PIXEL_DIVIDER + '_m' + MARGIN_DIVIDER + '.json';
// const NETWORK_NAME = 'saves/perceptron' + '_p' + PIXEL_DIVIDER + '_m' + MARGIN_DIVIDER + '_in' + INPUT_LAYER + '_h' + HIDDEN_LAYER + '_it' + MAX_ITERATIONS + '.json';
const NETWORK_NAME = 'saves/perceptron_p22_m20_in1260_h25_it50.json';



var arDrone = require('ar-drone');
var client = arDrone.createClient();
client.createRepl();
var fs = require('fs');
var helpers = require('./DroneHelpers.js');

var synaptic = require('synaptic');
var Neuron = synaptic.Neuron,
	Layer = synaptic.Layer,
	Network = synaptic.Network,
	Trainer = synaptic.Trainer,
	Architect = synaptic.Architect;

// var PNG = require('pngjs').PNG;
var PNG = require('png-js');


var network_data = JSON.parse(fs.readFileSync(NETWORK_NAME));
var perceptron = Network.fromJSON(network_data);

console.log('battery: ' + client.battery())

var pngStream = client.getPngStream();
pngStream.on('data', function(buffer) {
	// fs.writeFile("./temp_img.png", buffer, function(err) {
	// 	if (err) {
	// 		return console.log(err);
	// 	} else {}
	// });
	// console.log(' ---');

	var png = new PNG(buffer);
	png.decode(function(pixels) {
		// console.log(pixels[100]);
		// console.log('l: ' + pixels.length)
		var self = {
			data: pixels,
			height: 360,
			width: 640
		}

		var inputData = helpers.getInputData(self, PIXEL_DIVIDER, MARGIN_DIVIDER);
		inputData = helpers.standardizeData(inputData);

		var res = perceptron.activate(inputData);

		displayResult(res);
	});
	// PNG2.decode(png, function(pixels){
	// 	console.log(pixels);
	// 	console.log('l: '+pixels.length)
	// });

	// return;

	// fs.createReadStream("./temp_img.png")
	// 	.pipe(new PNG({
	// 		filterType: 4
	// 	}))
	// 	.on('parsed', function() {
	// 		// console.log('   ++++++++');
	// 		// console.log('  '+this.data[100]);
	// 		var inputData = helpers.getInputData(this, PIXEL_DIVIDER, MARGIN_DIVIDER);
	// 		inputData = helpers.standardizeData(inputData)

	// 		var res = perceptron.activate(inputData);
	// 		// console.log(res);
	// 		displayResult(res);
	// 	});
	// });
});

function displayResult(res) {

	var log = '',
		logLeft = '',
		logRight = '';

	// Achtung: bewusst seitenverkehrt!
	// console.log(res);

	// for (var i = 1; i <= 5; i++) {
	// 	if (i < Math.ceil(res[2] / 2)) logLeft += ' ';
	// 	else logLeft += 'o';
	// 	if (i < Math.floor(res[2] / 2)) logRight += ' ';
	// 	else logRight += 'o';
	// }
	// log = logLeft + logRight + '.';
	// logLeft = '';
	// logRight = '';
	// for (var i = 1; i <= 5; i++) {
	// 	if (i < Math.ceil(res[1] / 2)) logLeft += ' ';
	// 	else logLeft += 'o';
	// 	if (i < Math.floor(res[1] / 2)) logRight += ' ';
	// 	else logRight += 'o';
	// }
	// log = log + logLeft + logRight + '.';
	// logLeft = '';
	// logRight = '';
	// for (var i = 1; i <= 5; i++) {
	// 	if (i < Math.ceil(res[0] / 2)) logLeft += ' ';
	// 	else logLeft += 'o';
	// 	if (i < Math.floor(res[0] / 2)) logRight += ' ';
	// 	else logRight += 'o';
	// }
	// log = log + logLeft + logRight;



	for (var i = 1; i <= 10; i++) {
		if (i < Math.round(res[2] * 10)) log += 'o';
		else log += ' ';
	}
	log += '.';
	for (var i = 1; i <= 10; i++) {
		if (i < Math.round(res[1] * 10)) log += 'o';
		else log += ' ';
	}
	log += '.';
	for (var i = 1; i <= 10; i++) {
		if (i < Math.round(res[0] * 10)) log += 'o';
		else log += ' ';
	}

	console.log(log);

}