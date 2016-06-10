const PIXEL_DIVIDER = 2; // früher "TEILER", übernehmen aus train_images
const MARGIN_DIVIDER = 0; // übernehmen aus train_images

const NETWORK_NAME = 'saves/net_e5_testthis_s1_.txt';
const IMAGE_WIDTH = 640;
const IMAGE_HEIGHT = 360;
const AVG_LINES = 5
const AVG_COLS = 5



var arDrone = require('ar-drone');
var client = arDrone.createClient();
client.createRepl();
var fs = require('fs');
// var sys = require('sys')
var exec = require('child_process').exec;
var helpers = require('./DroneHelpers.js');
var convnetjs = require('convnetjs')
var PNG = require('png-js');



var netFile = JSON.parse(fs.readFileSync(NETWORK_NAME))
var net = new convnetjs.Net()
net.fromJSON(netFile)



console.log('battery: ' + client.battery())

var pngStream = client.getPngStream();
// var resStack = [];
// var oldRes;
var counter = 0;
pngStream.on('data', function(buffer) {
	// console.log('on data ' + counter)
	// fs.writeFile("./temp_img.png", buffer, function(err) {
	// 	if (err) {
	// 		return console.log(err);
	// 	} else {



	// var child = exec("sips -Z 80 temp_img.png", function(error, stdout, stderr) {
	// 	if (error) {
	// 		console.log('exec error: ' + error);
	// 	} else {
	// PNG.decode(buffer, function(pixels) {
	var png = new PNG(buffer);
	png.decode(function(pixels) {
		// console.log(pixels.length)
		// pixels is a 1d array of decoded pixel data
		var x = getInputData(pixels);
		// console.log(x.w.length)
		// console.log('loaded ' + counter)
		// counter++
		var resX = net.forward(x)
		var res = resX.w

		// console.log(res)
			// displayResult(res)
		// displayResultsForClasses(res)

		var arr = Object.keys(res).map(function(k){return res[k]})
		for (var i=0; i<=15; i++){
			arr[i] = Math.round(arr[i]*100)/100
		}
		console.log(arr)
	});
	// }
	// });
	// }
	// });


});


function getInputData(data) {
	var x = new convnetjs.Vol(IMAGE_WIDTH / AVG_COLS, IMAGE_HEIGHT / AVG_LINES, 3)

	for (var dc = 0; dc < 3; dc++) {
		for (var xc = 0; xc < IMAGE_WIDTH; xc += AVG_LINES) {
			for (var yc = 0; yc < IMAGE_HEIGHT; yc += AVG_COLS) {
				// var ix = ((W * k) + i) * 4 + dc;
				var ix = (IMAGE_WIDTH * yc + xc) * 4 + dc;

				x.set(yc, xc, dc, (data[ix] / 255.0 - 0.5) * 2);
			}
		}
	}

	return x;
}

function displayResultsForClasses(res){
	// standardize to max
	var arr = Object.keys(res).map(function(k){return res[k]})
	var max = Math.max.apply(null, arr)

	for (i=1;i<=3;i++){
		var str = ''
		for (j=0;j<=12;j+=3){
			var val = res[i+j] / max
			if (val <= 0.3) str += ' '
			else if (val < 0.7) str += '.'
			else str += 'o'

			str += ' '
		}
		console.log(str)
	}
	console.log(' ')
}


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