const PIXEL_DIVIDER = 16; // früher "TEILER", auch in follow_hand.js anpassen!
const MARGIN_DIVIDER = 20; // auch in follow_hand.js anpassen!

const INPUT_LAYER = 2220;
const HIDDEN_LAYER = 35;
const MAX_ITERATIONS = 10; // should go up to 10k-100k, maybe with learning rate 0.1

const DB_NAME = 'database.csv';
const TRAINING_DATA_NAME = 'saves/trainingData_p' + PIXEL_DIVIDER + '_m' + MARGIN_DIVIDER + '.json';
const NETWORK_NAME = 'saves/perceptron' + '_p' + PIXEL_DIVIDER + '_m' + MARGIN_DIVIDER + '_in' + INPUT_LAYER + '_h' + HIDDEN_LAYER + '_it' + MAX_ITERATIONS + '.json';


var synaptic = require('synaptic'); // this line is not needed in the browser
var Neuron = synaptic.Neuron,
	Layer = synaptic.Layer,
	Network = synaptic.Network,
	Trainer = synaptic.Trainer,
	Architect = synaptic.Architect;

var fs = require('fs')
var helpers = require('./DroneHelpers.js');
// var cv = require('opencv')
// var PNG = require('pngjs').PNG;
var PNG2 = require('png-js');

var t = new Date();
console.log('time now: ' + t.toGMTString());


// TODO
// switch to openNN for computations
// check if low light images aren't disturbing 
// add learning rate to the params
// add pruning
// (add db-shuffle mode (which doesnt take the saved training data))



// input, hidden (...), output layer
var trainingSet = [];
var testedSet = [];
var perceptron = new Architect.Perceptron(INPUT_LAYER, HIDDEN_LAYER, 3);
var trainer = new Trainer(perceptron);
console.log('neural network initialized\n ')


var DBdata = helpers.loadDatabase(DB_NAME);
DBdata = shuffle(DBdata); // we want to have different test data every time
console.log('shuffle shuffle db data, hm hm hm');

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
		// load images to training set
		imagesToTrainingSet(DBdata);
	}
});


function imagesToTrainingSet(db_array) {
	if (db_array.length % 500 == 0) console.log('   ' + db_array.length + ' images left to add');
	var row = db_array.shift();
	var outputValues = getOutputValues(row);
	var p1 = addImage(row[0], outputValues);

	p1.then(function() {
		if (db_array.length > 0)
			imagesToTrainingSet(db_array);
		else {
			// save new training data
			console.log('Training data will not be safed for the moment because of data shuffling');
			// saveTrainingData();
			trainNetwork();
			saveNetwork();
			testNetwork(TestData);
		}
	});
}

// function getOutputValues(row) {
// 	var output = [0, 0, 0];
// 	if (row[1] <= 213 && row[1] >= 0) output[0] = 1; // left
// 	else if (row[1] <= 426 && row[1] > 213) output[1] = 1; // center
// 	else if (row[1] > 426 && row[1] <= 640) output[2] = 1; // right
// 	// else (row[1]==-1) no hand

// 	// if (row[1] == -1) output = [0, 0, 0];
// 	// else {
// 	// 	var parts = 3;
// 	// 	var partLength = 640 / parts;
// 	// 	for (var i = 0; i < parts; i++) {
// 	// 		if (row[1] >= i * partLength && row[1] < (i + 1) * partLength) {
// 	// 			output[i] = 1;
// 	// 			break;
// 	// 		}
// 	// 	}
// 	// }

// 	return output;
// 	// return [row[1] / 640, row[2] / 360];
// }

function getOutputValues(row) {
	var output = [0, 0, 0];
	if (row[1] == -1) output = [0, 0, 0];
	else {
		var parts = 3;
		var partLength = 640 / parts;
		for (var i = 0; i < parts; i++) {
			if (row[1] >= i * partLength && row[1] < (i + 1) * partLength) {
				output[i] = 1;
				break;
			}
		}
	}

	return output;
}


var showedInputdataLength = false; // stupid
function addImage(imageName, outputValues) {
	var path = 'records/' + imageName;

	var promise = new Promise(function(resolve, reject) {
		PNG2.decode(path, function(pixels) {
			var self = {
				data: pixels,
				height: 360,
				width: 640
			}
			var inputData = helpers.getInputData(self, PIXEL_DIVIDER, MARGIN_DIVIDER);
			inputData = helpers.standardizeData(inputData);
			if (!showedInputdataLength) {
				console.log('   (length input data: ' + inputData.length + ' must be = # input layer neurons)');
				showedInputdataLength = true;
			}

			trainingSet.push({
				input: inputData,
				output: outputValues
			});
			resolve();
		});
		// fs.createReadStream(path)
		// 	.pipe(new PNG({
		// 		filterType: 4
		// 	}))
		// 	.on('parsed', function() {
		// 		var inputData = helpers.getInputData(this, PIXEL_DIVIDER, MARGIN_DIVIDER);
		// 		inputData = helpers.standardizeData(inputData);
		// 		if (!showedInputdataLength) {
		// 			console.log('   (length input data: ' + inputData.length + ' must be = # input layer neurons)');
		// 			showedInputdataLength = true;
		// 		}

		// 		trainingSet.push({
		// 			input: inputData,
		// 			output: outputValues
		// 		});
		// 		resolve();
		// 	});
	});

	return promise;
}

function trainNetwork() {
	console.log(' \ntraining set length: ' + trainingSet.length + ' ... train now ...')
		// trainingSet = shuffle(trainingSet);

	trainer.train(trainingSet, {
		// rate: 0.02,
		iterations: MAX_ITERATIONS,
		shuffle: true,
		cost: Trainer.cost.CROSS_ENTROPY,
		log: 1
	});
	console.log('   training finished.\n ')
}

function testNetwork(test_array) {
	var row = test_array.shift();
	var outputValues = getOutputValues(row);
	var p1 = testImage(row[0], outputValues);

	p1.then(function() {
		if (test_array.length > 0)
			testNetwork(test_array);
		else {
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
				/*if (!testedImg.success)*/
				console.log('' + res + '   ' + testedImg.optimalValues + '    ' + testedImg.error + '   ' + testedImg.imageName + '   ' + (testedImg.success ? ' OK' : ''));

				if (testedImg.success) testedSuccess++;
				totalTestError += testedImg.error;
			});

			var summary = PIXEL_DIVIDER + ', ' + INPUT_LAYER + '/' + HIDDEN_LAYER + ', ' + MARGIN_DIVIDER + ', ' + MAX_ITERATIONS + '   success: ' + testedSuccess + ' / ' + testedSet.length + '  ,  ' + Math.round(testedSuccess / testedSet.length * 100) + ' %  (avg. err: ' + Math.round(totalTestError / testedSet.length * 10) / 10 + ')';
			console.log('\nPixel divider, Input, Hidden, Margin, max Iterations');
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
		PNG2.decode(path, function(pixels) {
			var self = {
				data: pixels,
				height: 360,
				width: 640
			}

			var inputData = helpers.getInputData(self, PIXEL_DIVIDER, MARGIN_DIVIDER);
			inputData = helpers.standardizeData(inputData);
			var res = perceptron.activate(inputData);

			var testRow = {};
			testRow.res = res;
			testRow.imageName = imageName;
			testRow.optimalValues = optimalValues;

			testRow.error = 0;
			testRow.error += Math.abs(res[0] - optimalValues[0]);
			testRow.error += Math.abs(res[1] - optimalValues[1]);
			testRow.error += Math.abs(res[2] - optimalValues[2]);


			// TODO not sure what to take here, more research needed
			if (testRow.error < 0.3) testRow.success = true;
			else if (optimalValues != [0, 0, 0] && isMax(optimalValues) == isMax(res) && testRow.error < 0.8) testRow.success = true;

			testedSet.push(testRow);
			resolve();

		});
		// fs.createReadStream(path)
		// 	.pipe(new PNG({
		// 		filterType: 4
		// 	}))
		// 	.on('parsed', function() {
		// 		// console.log('test: ' + path);

		// 		var inputData = helpers.getInputData(this, PIXEL_DIVIDER, MARGIN_DIVIDER);
		// 		inputData = helpers.standardizeData(inputData);
		// 		var res = perceptron.activate(inputData);

		// 		// console.log(res);
		// 		// console.log(optimalValues);
		// 		var testRow = {};
		// 		testRow.res = res;
		// 		testRow.imageName = imageName;
		// 		testRow.optimalValues = optimalValues;

		// 		testRow.error = 0;
		// 		testRow.error += Math.abs(res[0] - optimalValues[0]);
		// 		testRow.error += Math.abs(res[1] - optimalValues[1]);
		// 		testRow.error += Math.abs(res[2] - optimalValues[2]);

		// 		// testRow.error += (res[0] - optimalValues[0]) * (res[0] - optimalValues[0])
		// 		// testRow.error += (res[1] - optimalValues[1]) * (res[1] - optimalValues[1])
		// 		// testRow.error += (res[2] - optimalValues[2]) * (res[2] - optimalValues[2])
		// 		// testRow.error /= 3;

		// 		// console.log(optimalValues + '   ' + (res) + '     ' + testRow.error + '    ' + imageName)

		// 		// TODO not sure what to take here, more research needed
		// 		if (testRow.error < 0.3) testRow.success = true;
		// 		else if (optimalValues != [0, 0, 0] && isMax(optimalValues) == isMax(res) && testRow.error < 0.8) testRow.success = true;

		// 		testedSet.push(testRow);
		// 		resolve();
		// 	});
	});

	return promise;
}



function saveTrainingData() {
	fs.writeFile(TRAINING_DATA_NAME, JSON.stringify(trainingSet), function(err) {
		if (err) console.log('error: ' + err);
		else console.log('training data saved')
	});
}

function saveNetwork() {
	var data = JSON.stringify(perceptron.toJSON());

	fs.writeFile(NETWORK_NAME, data, function(err) {
		if (err) console.log('error: ' + err);
		else console.log('network saved')
	})
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


// function average(arr) {
// 	var tot = 0;
// 	for (var i = 0; i < arr.length; i++) tot += arr[i];
// 	return tot / arr.length;
// }