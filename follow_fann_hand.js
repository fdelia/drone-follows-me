const PIXEL_DIVIDER = 22; // früher "TEILER", übernehmen aus train_images
const MARGIN_DIVIDER = 20; // übernehmen aus train_images

const NETWORK_NAME = 'saves/nn_p20_m0_in1728_h100_e0.0005.json';



var arDrone = require('ar-drone');
var client = arDrone.createClient();
client.createRepl();
var fs = require('fs');
var helpers = require('./DroneHelpers.js');
var fann = require('fann');

var synaptic = require('synaptic');
var Neuron = synaptic.Neuron,
	Layer = synaptic.Layer,
	Network = synaptic.Network,
	Trainer = synaptic.Trainer,
	Architect = synaptic.Architect;

// var PNG = require('pngjs').PNG;
var PNG = require('png-js');
var net = new fann.load(NETWORK_NAME);

console.log('battery: ' + client.battery())

var pngStream = client.getPngStream();
var resStack = [];
var oldRes;
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

		var inputData = helpers.getInputData(self, PIXEL_DIVIDER);
		inputData = helpers.standardizeData(inputData);

		// var res = perceptron.activate(inputData);
		var res = net.run(inputData);


		// resStack.push(res);
		// if (resStack.lenght > 3) resStack.shift();
		// var sums = resStack.reduce(function(prev, cur, ind, arr) {
		// 	return [prev[0] + cur[0], prev[1] + cur[1], prev[2] + cur[2]];
		// });
		// sums = sums.map(function(i) {
		// 	return i / resStack.length;
		// });


		// displayResult(res);
		if (oldRes) displayResult([(res[0] + oldRes[0]) / 2, (res[1] + oldRes[1]) / 2, (res[2] + oldRes[2]) / 2]);
		oldRes = res;
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