const NUMBER_DB_DATA = 1000
const MAX_EPOCHS = 2

const IMAGE_WIDTH = 40; // 128
const IMAGE_HEIGHT = 40; // 72

const REGRESSION_OUTPUT = false
const DB_NAME = 'records_crop/_DB.csv';
const OUTPUT_PARTS = 1; // number of ... (not active yet)

var readline = require('readline')
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



/*

This is a case study to check if the concept works.

*/



layer_defs = [];
layer_defs.push({
	type: 'input',
	out_sx: IMAGE_WIDTH,
	out_sy: IMAGE_HEIGHT,
	out_depth: 3 // vol 3
});
layer_defs.push({
	type: 'conv',
	sx: 5,
	filters: 960,
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
	type: 'conv',
	sx: 3,
	filters: 720,
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
	type: 'conv',
	sx: 3,
	filters: 600, // 32
	stride: 1, // 2
	pad: 2, // 
	activation: 'relu'
		// drop_prob: 0.5
});
layer_defs.push({
	type: 'pool',
	sx: 2, // 2
	stride: 2 // 2
});
layer_defs.push({
	type: 'conv',
	sx: 3, // 4
	filters: 480, // 32
	stride: 1, // 2
	pad: 2, // 
	activation: 'relu'
		// drop_prob: 0.7
});
layer_defs.push({
	type: 'pool',
	sx: 3, // 2
	stride: 3
});
layer_defs.push({
	type: 'fc',
	num_neurons: 300, // 100, 200
	activation: 'relu'
});
layer_defs.push({
	type: 'fc',
	num_neurons: 300, // wasn't there
	activation: 'relu'
});

if (REGRESSION_OUTPUT)
	layer_defs.push({
		type: 'regression',
		num_neurons: OUTPUT_PARTS
	});
else
	layer_defs.push({
		type: 'softmax',
		num_classes: OUTPUT_PARTS + 1 // 4
	});

// if (REGRESSION_OUTPUT) console.log('output: regression')
// else console.log('output: classes')

console.log(layer_defs)

net = new convnetjs.Net();
net.makeLayers(layer_defs);
// loadNetwork('saves/net_e5.txt')

var trainer_options = {
	method: 'adadelta',
	// l1_decay: 0.001,
	l2_decay: 0.0001, // 0.001
	batch_size: 10,
	learning_rate: 0.01 // 0.01
		// ,momentum: 0.9
}
var trainer = new convnetjs.SGDTrainer(net, trainer_options);
console.log(trainer_options)

loadDB()
console.log('load image data')
loadImages(DBdata).then(function() {
	TestData = ImageData.splice(-1 * Math.round(ImageData.length / 6))

	ImageData = helpers.augmentData(ImageData, REGRESSION_OUTPUT)
	ImageData = shuffle(ImageData)

	console.log('\nTraining rows: ' + ImageData.length + ', Test rows: ' + TestData.length)

	var stats, totalLoss = 0;
	for (var e = 0; e < MAX_EPOCHS; e++) {
		console.log('\nepoch: ' + (e + 1) + ' of ' + MAX_EPOCHS + ' * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *')
		ImageData = shuffle(ImageData)

		// console.time('first-100')
		for (var i = 0; i < ImageData.length; i++) {
			// try {
			stats = trainer.train(ImageData[i][0], ImageData[i][1]);
			// console.log(ImageData[i][1])
			console.log(stats)
			if (! isFinite(stats.loss)) {
				// console.log(ImageData[i])
				console.log('loss == infinite at ' + i)
					// break
			}

			// augmentation, do it here to save memory
			var t = helpers.flipHorizontally(ImageData[i], false, IMAGE_WIDTH, IMAGE_HEIGHT)
				// console.log(t)
			stats = trainer.train(t[0], t[1])

			// t = helpers.flipVertically(ImageData[i])
			// stats = trainer.train(t[0], t[1])

			// } catch (e) {
			// 	console.log(e)
			// 		// console.log(ImageData[i][0])
			// }
			// if (i == 100)
			// 	console.timeEnd('first-100')

			if ((i + 1) % 5 == 0) {
				readline.cursorTo(process.stdout, 0)
				process.stdout.write('    ' + (i + 1) + ' / ' + ImageData.length + ' images done   ...  ' + stats.loss + '')
			}
			if ((i + 1) % 1000 == 0 && i > 0) {
				readline.cursorTo(process.stdout, 0)
				console.log('    ' + (i + 1) + ' / ' + ImageData.length + ' images done   ...  ' + stats.loss + '')
			}
			if (i % 10 == 0 && i > 0) totalLoss += stats.loss
			if (i % 10 == 0 && i > 0) {
				console.log(' ')
				testNetwork(false);
				console.log('   avg loss: ' + totalLoss / 100)
				totalLoss = 0
			}
			// if (stats.loss > 100){
			// 	console.log('\nstopping: loss too high')
			// 	break
			// }
		}

		console.log(' ');
		// if (e % 1 == 0)
		testNetwork();

		saveNetwork('net_e' + (e + 1) + '.txt');
	}

	// testNetwork();

});

function testNetwork(testPart) {
	var testPart = typeof testPart !== 'undefined' ? testPart : false;
	console.log('\n')

	var wrongCounter = 0;
	var correctClassCounter = Array(OUTPUT_PARTS + 1).fill(0)
	var totalClassCounter = Array(OUTPUT_PARTS + 1).fill(0)
	var resClassCounter = Array(OUTPUT_PARTS + 1).fill(0)

	var firstRes;
	var displayedMsg;
	var divider = 1
	if (testPart) {
		TestData = shuffle(TestData) // because of slow performance, test only a part
		divider = 2
	}

	var sentMsg = 0
	for (var i = 0; i < TestData.length / divider; i++) {
		var res = net.forward(TestData[i][0])
		var classIsMax = '';
		if (res.w[0] === 1 && sentMsg < 1) {
			console.log('maybe overfit')
			sentMsg++
		}

		// linear regression part
		if (REGRESSION_OUTPUT) {
			if (!firstRes) firstRes = res
			else if (firstRes.w[0] == res.w[0] && firstRes.w[1] == res.w[1] && firstRes.w[2] == res.w[2] && !displayedMsg) {
				console.log('overfitting')
				displayedMsg = true
				break;
			}

			var err = Math.abs(res.w[0] - TestData[i][1][0])
			err += Math.abs(res.w[1] - TestData[i][1][1])
			err += Math.abs(res.w[2] - TestData[i][1][2])
			if (!isZeroArray(TestData[i][1]) && (isMax(TestData[i][1]) != isMax(res.w) || err > 0.8)) {
				wrongCounter++;
				classIsMax = 'no';
			} else if (isZeroArray(TestData[i][1]) && err > 0.4) {
				wrongCounter++;
				classIsMax = 'no';
			} else {
				classIsMax = 'yes';
				if (!isZeroArray(TestData[i][1])) correctClassCounter[isMax(TestData[i][1])]++;
				else correctClassCounter[OUTPUT_PARTS]++;
				// console.log(res.w)
				// console.log(TestData[i][1])
			}
			if (!isZeroArray(TestData[i][1])) totalClassCounter[isMax(TestData[i][1])]++;
			else totalClassCounter[OUTPUT_PARTS]++;
			// console.log('corr: ' + classIsMax + '  exp: ' + roundArray(TestData[i][1]) + '   ' + JSON.stringify(res.w))
		}

		// classes part
		else {
			// resClassCounter[isMax(res.w)]++
			// console.log(res.w)
			if (TestData[i][1] == isMax(res.w)) correctClassCounter[TestData[i][1]]++;
			else wrongCounter++;

			resClassCounter[isMax(res.w)]++;
			totalClassCounter[TestData[i][1]]++;
			// var classIsMax = TestData[i][1] == isMax(res.w) ? 'Yes' : 'No'
			// console.log('corr: ' + classIsMax + '  exp: ' + (TestData[i][1]) + '   ' + JSON.stringify(res.w))
		}

		if (i % 10 == 0) {
			readline.cursorTo(process.stdout, 0)
			process.stdout.write('  testing  ' + (i) + ' / ' + TestData.length + '')
		}
	}

	var tot = 0
	for (var i = 0; i < totalClassCounter.length; i++)
		tot += correctClassCounter[i] / totalClassCounter[i]
	console.log('\nCorrect: ' + Math.round((tot / totalClassCounter.length) * 100) + ' % (of classes)')
		// console.log('\nCorrect: ' + Math.round((1 - wrongCounter / TestData.length) * 100) + ' % (of images)')

	correctPro = []
	for (var i = 0; i < totalClassCounter.length; i++) {
		// console.log(' class correct: ' + Math.round(correctClassCounter[i] / totalClassCounter[i] * 100) + ' %  (of ' + totalClassCounter[i] + ')')
		correctPro[i] = Math.round(correctClassCounter[i] / totalClassCounter[i] * 100) / 100
	}
	console.log('predicted classes: ')
	console.log(resClassCounter)
	console.log('correct ones (in %/100): ')
	console.log(correctPro)
	console.log('# of test images: ')
	console.log(totalClassCounter)
}


function loadDB() {
	DBdata = helpers.loadDatabase(DB_NAME);
	DBdata = shuffle(DBdata); // we want to have different test data every time
	if (NUMBER_DB_DATA < DBdata.length) DBdata = DBdata.splice(-NUMBER_DB_DATA);
}


function loadImages(db_array) {
	if (db_array.length % 100 == 0) {
		readline.cursorTo(process.stdout, 0)
		process.stdout.write('   ' + db_array.length + ' images left');
	}
	var row = db_array.shift();
	if (REGRESSION_OUTPUT)
		var p1 = loadImage(row[0], getOutputValues(row));
	else
		var p1 = loadImage(row[0], getClass(row));

	var promise = new Promise(function(resolve, reject) {
		p1.then(function() {
			if (db_array.length > 0)
				loadImages(db_array).then(function() {
					resolve();
				});
			else {
				console.log(' ')
				resolve();
			}
		});

	});

	return promise;
}


function getClass(row) {
	return row[1]
}

function getOutputValues(row) {
	if (row[1] == -1) return Array(OUTPUT_PARTS).fill(0)

	var output = [];
	for (var x = 0; x < OUTPUT_PARTS; x++) {
		output[x] = Math.max(0, 1 - Math.abs(row[1] - x / (OUTPUT_PARTS - 1) * 640) / 640 * (OUTPUT_PARTS - 1))
	}
	return output
}

function loadImage(imageName, outputValues) {
	var path = 'records_crop/' + imageName;

	var promise = new Promise(function(resolve, reject) {
		fs.access(path, fs.F_OK, function(err) {
			if (err) {
				console.log('file not found: ' + path);
				console.log(err)
				resolve();
			} else {
				PNG2.decode(path, function(pixels) {
					// console.log(imageName)
					var inputData = getInputData(pixels)
						// console.log(inputData.w)
					ImageData.push([inputData, outputValues]);
					resolve();
				});
			}
		});
	});

	return promise;
}

function getInputData(data) {
	var x = new convnetjs.Vol(IMAGE_WIDTH, IMAGE_HEIGHT, 3) // vol 3
	var r, g, b

	for (var xc = 0; xc < IMAGE_WIDTH; xc++) {
		for (var yc = 0; yc < IMAGE_HEIGHT; yc++) {
			for (var dc = 0; dc < 3; dc++) {
				// var ix = ((W * k) + i) * 4 + dc;
				var ix = (IMAGE_WIDTH * yc + xc) * 4 + dc;
				// if (isNaN(data[ix])){
				//  console.trace('NaN')
				//  return
				// }

				// standardize here
				x.set(yc, xc, dc, (data[ix] / 255.0 - 0.5) * 1);

				// if (dc == 0) r = data[ix]
				// if (dc == 1) g = data[ix]
				// if (dc == 2) b = data[ix]
			}

			// var Y = 0.2126 * r + 0.7152 * g + 0.0722 * b
			// x.set(yc, xc, 3, (Y / 255.0 - 0.5) * 1);
		}
	}

	return x;
}


function saveNetwork(name) {
	var json = net.toJSON();
	var str = JSON.stringify(json);

	fs.writeFileSync('saves/' + name, str)
	var promise = new Promise(function(resolve, reject) {
		// fs.writeFile('saves/' + name, str, function(err) {
		// 	if (err) return console.log(err)
		// 	else console.log('network saved as ' + name)
		// 	resolve()
		// });

		resolve()
	});

	return promise
}

function loadNetwork(name) {
	var str = fs.readFileSync(name)
	var json = JSON.parse(str)
	net.fromJSON(json)
	console.log('network "' + name + '" loaded')
}


// HELPERS


function isMax(array) {
	for (var i = 0; i < array.length; i++)
		if (array[i] == Math.max.apply(null, array)) return i;
	return false;
}

function roundArray(array) {
	var newArray = [];
	for (var i = 0; i < array.length; i++)
		newArray.push(Math.round(array[i] * 100) / 100)
	return newArray
}

function isZeroArray(array) {
	for (var i = 0; i < array.length; i++)
		if (array[i] !== 0) return false;

	return true;
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