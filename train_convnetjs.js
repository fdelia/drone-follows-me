const MARGIN_DIVIDER = 0; // obsolete auch in follow_hand.js anpassen!
const PIXEL_DIVIDER = 1; // obsolete früher "TEILER", auch in follow_hand.js anpassen!

const NUMBER_DB_DATA = 200;

const AVG_LINES = 8
const AVG_COLS = 8


// const INPUT_LAYER = 4770;
// const HIDDEN_LAYER = 50;
// const DESIRED_ERROR = 0.01; // high error to avoid overfitting?
// const MAX_EPOCHS = 100;
// const LEARNING_RATE = 0.01;

const DB_NAME = 'database.csv';
// const TRAINING_DATA_NAME = 'saves/trainingData_p' + PIXEL_DIVIDER + '_m' + MARGIN_DIVIDER + '.json';
// const NETWORK_NAME = 'saves/convnetjs' + '_p' + PIXEL_DIVIDER + '_m' + MARGIN_DIVIDER + '_in' + INPUT_LAYER + '_h' + HIDDEN_LAYER + '_e' + DESIRED_ERROR + '.json';


var convnetjs = require('convnetjs')
var fs = require('fs')
var helpers = require('./DroneHelpers.js')
var PNG2 = require('png-js')

var t = new Date();
console.log('time now: ' + t.toGMTString());


var DBdata = [],
	TestData = [],
	ImageData = [];
var net;


layer_defs = [];
// layer_defs.push({
// 	type: 'input',
// 	out_sx: 64, // 640, was 24
// 	out_sy: 32, // 360, was 24
// 	out_depth: 3
// });
// layer_defs.push({
// 	type: 'conv',
// 	sx: 12, // 5
// 	filters: 60, // 8
// 	stride: 1,
// 	pad: 2,
// 	activation: 'relu'
// });
// layer_defs.push({
// 	type: 'pool',
// 	sx: 2,
// 	stride: 2
// });
// layer_defs.push({
// 	type: 'conv',
// 	sx: 5, // 5?
// 	filters: 20, // 16?
// 	stride: 1,
// 	pad: 2,
// 	activation: 'relu'
// });
// layer_defs.push({
// 	type: 'pool',
// 	sx: 2,
// 	stride: 2
// });
// layer_defs.push({
// 	type: 'softmax',
// 	num_classes: 4
// });

layer_defs.push({
	type: 'input',
	out_sx: 640 / AVG_COLS,
	out_sy: 320 / AVG_LINES,
	out_depth: 3
});
layer_defs.push({
	type: 'conv',
	sx: 5,
	filters: 20, // 16
	stride: 1,
	pad: 2,
	activation: 'relu'
});
layer_defs.push({
	type: 'pool',
	sx: 2,
	stride: 2
});
// layer_defs.push({
// 	type: 'conv',
// 	sx: 5,
// 	filters: 20,
// 	stride: 1,
// 	pad: 2,
// 	activation: 'relu'
// });
// layer_defs.push({
// 	type: 'pool',
// 	sx: 2,
// 	stride: 2
// });
layer_defs.push({
	type: 'conv',
	sx: 5,
	filters: 20,
	stride: 1,
	pad: 2,
	activation: 'relu'
});
layer_defs.push({
	type: 'pool',
	sx: 2,
	stride: 2
});
layer_defs.push({
	type: 'softmax',
	num_classes: 2
});

// layer_defs.push({type:'regression', num_neurons: 3});

net = new convnetjs.Net();
net.makeLayers(layer_defs);
var trainer = new convnetjs.Trainer(net, {
	method: 'adadelta',
	// l1_decay: 0.001,
	l2_decay: 0.0001,
	batch_size: 4,
	learning_rate: 0.1 // 0.01
	// momentum: 0.9
});

loadDB()
loadImages(DBdata).then(function() {
	TestData = ImageData.splice(-1 * Math.round(ImageData.length / 4))
		// console.log(ImageData[0])
	console.log('Training rows: ' + ImageData.length + ', Test rows: ' + TestData.length)

	console.log('\nstart training')
	var stats;
	for (var e = 0; e < 10; e++) {
		console.log('epoch: ' + (e + 1))

		for (var i = 0; i < ImageData.length; i++) {
			var x = ImageData[i][0];
			stats = trainer.train(x, ImageData[i][1]);
			if ((i + 1) % 10 == 0 && i > 0) console.log('    ' + (i + 1) + ' / ' + ImageData.length + ' images')
		}

		// console.log(stats);
	}

	console.log('\nstart testing')
	var wrongCounter = 0;
	for (var i = 0; i < TestData.length; i++) {
		var res = net.forward(TestData[i][0])
		if (TestData[i][1] != isMax(res.w)) wrongCounter++;
		var classIsMax = TestData[i][1] == isMax(res.w) ? 'Yes' : 'No'
			// console.log('class: ' + TestData[i][1] + ' score: ' + res.w[TestData[i][1]] + ' isMax: ' + classIsMax + '   ' + JSON.stringify(res.w))
		console.log('class: ' + TestData[i][1] + '  isMax: ' + classIsMax + '   ' + JSON.stringify(res.w))
	}

	console.log('Success: ' + Math.round((1 - wrongCounter / TestData.length) * 100) + ' %')



	process.exit(0)

});


function loadDB() {
	DBdata = helpers.loadDatabase(DB_NAME);
	DBdata = shuffle(DBdata); // we want to have different test data every time
	if (NUMBER_DB_DATA < DBdata.length) DBdata = DBdata.splice(-NUMBER_DB_DATA);
}


function loadImages(db_array) {
	if (db_array.length % 100 == 0) console.log('   ' + db_array.length + ' images left to add');
	var row = db_array.shift();
	var p1 = loadImage(row[0], getClass(row));
	// var p1 = loadImage(row[0], getOutputValues(row));

	var promise = new Promise(function(resolve, reject) {
		p1.then(function() {
			if (db_array.length > 0)
				loadImages(db_array).then(function() {
					resolve();
				});
			else {
				resolve();
			}
		});

	});

	return promise;
}


// function getClass(row) {
// 	if (row[1] == -1) return 0;
// 	// else return 1;
// 	if (row[1] <= 213) return 1;
// 	if (row[1] <= 426) return 2;
// 	return 3;
// }

function getClass(row) {
	if (row[1] == -1) return 0;
	else return 1;
}

function getOutputValues(row) {
	if (row[1] == -1) return [0, 0, 0];

	var x1 = Math.max(1 - (row[1] / 320), 0);
	var x2 = 1 - Math.abs(row[1] - 320) / 320;
	var x3 = Math.max(1 - (Math.abs(row[1] - 640) / 320), 0);
	return [x1, x2, x3];
}

var showedInputdataLength = false; // stupid
function loadImage(imageName, outputValues) {
	var path = 'records/' + imageName;

	var promise = new Promise(function(resolve, reject) {
		fs.access(path, fs.F_OK, function(err) {
			if (err) {
				console.log('file not found: ' + path);
				resolve();
			} else {
				PNG2.decode(path, function(pixels) {
					var inputData = getInputData(pixels);

					if (!showedInputdataLength) {
						console.log('   (length input data: ' + inputData.w.length + ' must be = # input layer neurons)');
						showedInputdataLength = true;
					}

					ImageData.push([inputData, outputValues]);
					resolve();
				});
			}
		});
	});

	return promise;
}

function getInputData(data) {
	// for (var y = margin; y < 360 - margin; y += AVG_LINES) {
	// 	for (var x = margin; x < 640 - margin; x += AVG_COLS) {
	// 		var idx = (640 * y + x) << 2;

	// 		function dt(idx_diff) {
	// 			return data[idx + idx_diff];
	// 		}

	// 		// standardize
	// 		newData.push(dt(0) / 128 - 1)
	// 		newData.push(dt(1) / 128 - 1)
	// 		newData.push(dt(2) / 128 - 1)
	// 	}
	// }

	var x = new convnetjs.Vol(640 / AVG_COLS, 320 / AVG_LINES, 3)

	for (var dc = 0; dc < 3; dc++) {
		// var i = 0;
		for (var xc = 0; xc < 640; xc+=AVG_LINES) {
			for (var yc = 0; yc < 320; yc+=AVG_COLS) {
				// var ix = ((W * k) + i) * 4 + dc;
				var ix = (640 * yc + xc) * 4 + dc;
				x.set(yc, xc, dc, data[ix] / 255.0 - 0.5);
				// i++;
			}
		}
	}

	return x;
}



function saveNetwork() {
	net.save(NETWORK_NAME);
	console.log('network saved')
}



// HELPERS


function isMax(array) {
	for (var i = 0; i < array.length; i++)
		if (array[i] == Math.max.apply(null, array)) return i;
	return false;
}


function shuffle(array) {
	var currentIndex = array.length,
		temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}