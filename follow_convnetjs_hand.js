const PIXEL_DIVIDER = 2; // früher "TEILER", übernehmen aus train_images
const MARGIN_DIVIDER = 0; // übernehmen aus train_images

const NETWORK_NAME = 'saves/nn_p2_m0_in166848_h1000_e0.1.json';



var arDrone = require('ar-drone');
var client = arDrone.createClient();
client.createRepl();
var fs = require('fs');
// var sys = require('sys')
var exec = require('child_process').exec;
var helpers = require('./DroneHelpers.js');


// var PNG = require('pngjs').PNG;
var PNG = require('png-js');
// var net = new fann.load(NETWORK_NAME);

console.log('battery: ' + client.battery())

var pngStream = client.getPngStream();
// var resStack = [];
// var oldRes;
var counter = 0;
pngStream.on('data', function(buffer) {
	console.log('on data ' + counter)
	fs.writeFile("./temp_img.png", buffer, function(err) {
		if (err) {
			return console.log(err);
		} else {
			var child = exec("sips -Z 80 temp_img.png", function(error, stdout, stderr) {
				if (error) {
					console.log('exec error: ' + error);
				} else {
					PNG.decode('temp_img.png', function(pixels) {
						// pixels is a 1d array of decoded pixel data

						console.log('loaded ' + counter)
						counter++
					});
				}
			});
		}
	});


});

function displayResult(res) {

	var log = '',
		logLeft = '',
		logRight = '';

	// Achtung: bewusst seitenverkehrt!

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