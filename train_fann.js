const PIXEL_DIVIDER = 16; // früher "TEILER", auch in follow_hand.js anpassen!
const MARGIN_DIVIDER = 0; // auch in follow_hand.js anpassen!
const SECTOR_WIDTH = 32;

const INPUT_LAYER = 2760;
const HIDDEN_LAYER = 300;
// const MAX_ITERATIONS = 0; // should go up to 10k-100k, maybe with learning rate 0.1
const DESIRED_ERROR = 0.0005;

const DB_NAME = 'database.csv';
const TRAINING_DATA_NAME = 'saves/trainingData_p' + PIXEL_DIVIDER + '_m' + MARGIN_DIVIDER + '.json';
const NETWORK_NAME = 'saves/nn' + '_p' + PIXEL_DIVIDER + '_m' + MARGIN_DIVIDER + '_in' + INPUT_LAYER + '_h' + HIDDEN_LAYER + '_e' + DESIRED_ERROR + '.json';

// const TRAINING_DATA_NAME = 'saves/trainingData_s' + SECTOR_WIDTH + '_m' + MARGIN_DIVIDER + '.json';
// const NETWORK_NAME = 'saves/nn' + '_s' + SECTOR_WIDTH + '_m' + MARGIN_DIVIDER + '_in' + INPUT_LAYER + '_h' + HIDDEN_LAYER + '_e' + DESIRED_ERROR + '.json';


var synaptic = require('synaptic');
var Neuron = synaptic.Neuron,
	Layer = synaptic.Layer,
	Network = synaptic.Network,
	Trainer = synaptic.Trainer,
	Architect = synaptic.Architect;
var fann = require('fann');

var fs = require('fs')
var helpers = require('./DroneHelpers.js');
// var cv = require('opencv')
// var PNG = require('pngjs').PNG;
var PNG2 = require('png-js');

var t = new Date();
console.log('time now: ' + t.toGMTString());


// TODO
// check if low light images aren't disturbing 
// use cross-entropy error function
// add learning rate to the params
// add pruning



var trainingSet = [];
var testedSet = [];
// var perceptron = new Architect.Perceptron(INPUT_LAYER, HIDDEN_LAYER, 3);
// var trainer = new Trainer(perceptron);
var net = new fann.standard(INPUT_LAYER, HIDDEN_LAYER, 3); // input, hidden (...), output layer
net.learning_rate = 0.3;
console.log('neural network initialized\n ');

var DBdata = helpers.loadDatabase(DB_NAME);
DBdata = shuffle(DBdata); // we want to have different test data every time
// DBdata = DBdata.slice(0, 310); // Test
var TestData = DBdata.splice(-300);
console.log('test rows spliced: ' + TestData.length);

// load training data if it exists for this configs
fs.access(TRAINING_DATA_NAME, fs.F_OK, function(err) {
	// console.log('NOT USING SAVED TRAINING DATA FOR NOW');
	if (!err) {
		// load training data and start training directly
		fs.readFile(TRAINING_DATA_NAME, function(err, data) {
			console.log('found saved training data');
			trainingSet = JSON.parse(data);
			trainNetwork();
			saveNetwork();
			testNetwork(TestData);
		});
	} else {
		if (true) {
			DBdata = shuffle(DBdata);
			console.log('shuffle shuffle db data, hm hm hm');
		}
		// load images to training set
		imagesToTrainingSet(DBdata);
	}
});


function imagesToTrainingSet(db_array) {
	if (db_array.length % 100 == 0) console.log('   ' + db_array.length + ' images left to add');
	var row = db_array.shift();
	var outputValues = getOutputValues(row);
	var p1 = addImage(row[0], outputValues);

	p1.then(function() {
		if (db_array.length > 0)
			imagesToTrainingSet(db_array);
		else {
			// save new training data
			// console.log('Training data will not be saved for the moment because of data shuffling');
			var p1 = saveTrainingData();
			p1.then(function() {
				console.log('start training');
				trainNetwork();
				saveNetwork();
				testNetwork(TestData);
			});
		}
	});
}

// function getOutputValues(row) {
// 	var parts = 3;
// 	// var output = Array(parts).fill(0); // needs --harmony
// 	var output = [0,0,0];
// 	if (row[1] == -1) return output; //output = [0, 0, 0];
// 	else {
// 		var partLength = 640 / parts;
// 		for (var i = 0; i < parts; i++) {
// 			if (row[1] >= i * partLength && row[1] < (i + 1) * partLength) {
// 				output[i] = 1;
// 				break;
// 			}
// 		}
// 	}

// 	return output;
// }

function getOutputValues(row) {
	if (row[1] == -1) return [0,0,0];

	var x1 = Math.max(1 - (row[1] / 320), 0);
	var x2 = 1 - Math.abs(row[1] - 320) / 320;
	var x3 = Math.max(1 - (Math.abs(row[1] - 640) / 320), 0);
	// console.log([x1,x2,x3]); console.log(' ');
	return [x1, x2, x3];
}


var showedInputdataLength = false; // stupid
function addImage(imageName, outputValues) {
	var path = 'records/' + imageName;

	var promise = new Promise(function(resolve, reject) {
		fs.access(path, fs.F_OK, function(err) {
			if (err) {
				console.log('file not found: ' + path);
				resolve();
			} else {
				PNG2.decode(path, function(pixels) {
					var self = {
						data: pixels,
						height: 360,
						width: 640
					}
					var inputData = helpers.getInputData(self, PIXEL_DIVIDER, MARGIN_DIVIDER);
					// var inputData = helpers.getInputData2(self, SECTOR_WIDTH, MARGIN_DIVIDER);
					inputData = helpers.standardizeData(inputData);
					if (!showedInputdataLength) {
						console.log('   (length input data: ' + inputData.length + ' must be = # input layer neurons)');
						showedInputdataLength = true;
					}

					trainingSet.push([inputData, outputValues]);
					resolve();
				});
			}
		});
	});

	return promise;
}

function trainNetwork() {
	console.log(' \ntraining set length: ' + trainingSet.length + ' ... train now ...');

	net.train(trainingSet, {
		error: DESIRED_ERROR,
		epochs_between_reports: 10,
		epochs: 1000
	});

}


function testNetwork(test_array) {
	if (test_array.length % 100 == 0) console.log('   ' + test_array.length + ' images left to test');
	var row = test_array.shift();
	var outputValues = getOutputValues(row);
	var p1 = testImage(row[0], outputValues);

	p1.then(function() {
		if (test_array.length > 0)
			testNetwork(test_array);
		else {
			// empty records_wrong

			var testedSuccess = 0;
			var totalTestError = 0;

			console.log('Results (rounded), OptimalResults, Difference, Image name, Accepted as success?');
			testedSet.forEach(function(testedImg) {
				// round results to ...
				var RRR = 100;
				var res = testedImg.res.map(function(r) {
					return Math.round(r * RRR) / RRR;
				});

				// console.log('tested ' + testedImg.imageName + '   ' + res + '   ' + testedImg.optimalValues + '   ' + (testedImg.success ? ' OK' : ''));
				if (!testedImg.success) {
					console.log('' + res + '   ' + testedImg.optimalValues + '    ' + testedImg.error + '   ' + testedImg.imageName + '   ' + (testedImg.success ? ' OK' : ''));
					// copy to records_wrong/ for inspection
					fs.createReadStream('records/' + testedImg.imageName).pipe(fs.createWriteStream('records_wrong/' + testedImg.imageName));
				}

				if (testedImg.success) testedSuccess++;
				totalTestError += testedImg.error;
			});

			var summary = PIXEL_DIVIDER + ', ' + INPUT_LAYER + '/' + HIDDEN_LAYER + ', ' + MARGIN_DIVIDER + ', ' + DESIRED_ERROR + '   success: ' + testedSuccess + ' / ' + testedSet.length + '  ,  ' + Math.round(testedSuccess / testedSet.length * 100) + ' %  (avg. err: ' + Math.round(totalTestError / testedSet.length * 10) / 10 + '), FANN';
			// var summary = 's'+ SECTOR_WIDTH + ', ' + INPUT_LAYER + '/' + HIDDEN_LAYER + ', ' + MARGIN_DIVIDER + ', ' + DESIRED_ERROR + '   success: ' + testedSuccess + ' / ' + testedSet.length + '  ,  ' + Math.round(testedSuccess / testedSet.length * 100) + ' %  (avg. err: ' + Math.round(totalTestError / testedSet.length * 10) / 10 + '), FANN';
			console.log('\nPixel divider, Input, Hidden, Margin, desired error');
			console.log(summary);
			// console.log('average error: ' + Math.round(totalTestError / testedSet.length * 10) / 10)

			fs.appendFile('stats.txt', '\n' + summary, function(err) {
				if (err) console.log(err);
				else console.log(' saved stats ');
			});
		}
	});
}



function testImage(imageName, optimalValues) {
	var path = 'records/' + imageName;

	var promise = new Promise(function(resolve, reject) {
		if (!optimalValues) { // should not happen actually
			console.log('error: missing optimal values for ' + imageName);
			resolve();
		}
		fs.access(path, fs.F_OK, function(err) {
			if (err) {
				console.log('file not found: ' + path);
				resolve();
			} else {
				PNG2.decode(path, function(pixels) {
					var self = {
						data: pixels,
						height: 360,
						width: 640
					}

					var inputData = helpers.getInputData(self, PIXEL_DIVIDER, MARGIN_DIVIDER);
					// var inputData = helpers.getInputData2(self, SECTOR_WIDTH, MARGIN_DIVIDER);
					inputData = helpers.standardizeData(inputData);
					var res = net.run(inputData);

					var testRow = {};
					testRow.res = res;
					testRow.imageName = imageName;
					testRow.optimalValues = optimalValues;

					testRow.error = 0;
					for (var i = 0; i < res.length; i++) {
						testRow.error += Math.abs(res[i] - optimalValues[i]);
					}

					// TODO not sure what to take here, more research needed
					if (testRow.error < 0.3) testRow.success = true;
					else if (optimalValues != [0, 0, 0] && isMax(optimalValues) == isMax(res) && testRow.error < 0.8) testRow.success = true;

					testedSet.push(testRow);
					resolve();
				});
			}
		});
	});

	return promise;
}



function saveTrainingData() {
	var promise = new Promise(function(resolve, reject) {
		fs.writeFile(TRAINING_DATA_NAME, JSON.stringify(trainingSet), function(err) {
			if (err) console.log('error: ' + err);
			else console.log('training data saved')
			resolve();
		});
	});

	return promise;
}

function saveNetwork() {
	net.save(NETWORK_NAME);
	console.log('network saved')
		// var data = JSON.stringify(perceptron.toJSON());

	// fs.writeFile(NETWORK_NAME, data, function(err) {
	// 	if (err) console.log('error: ' + err);
	// 	else console.log('network saved')
	// });
}



// HELPERS

function toInterval(num) {
	return Math.round(num / 255 * 1000) / 1000;
}



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