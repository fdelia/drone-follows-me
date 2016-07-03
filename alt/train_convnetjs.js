const NUMBER_DB_DATA = 600
const MAX_EPOCHS = 2

const IMAGE_WIDTH = 128; // 128
const IMAGE_HEIGHT = 72; // 72
const DIVIDER_X = 1
const DIVIDER_Y = 1

const REGRESSION_OUTPUT = false

const DB_NAME = 'database.csv';

const OUTPUT_PARTS = 15; // number of ... (not active yet)


var readline = require('readline')
	// var ProgressBar = require('progress');
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

REGRESSION
Trainers, converges to:
adadelta ~60%
sgd 65%, sometimes 70%+
adagrad 50%

with the 3 conv layers + pools:
adadelta ~65% fluctuant ... 70% 
sgd 60%

2conv & fc-30 layer at the end: adadelta 70% at epoch 3 ... 75% at 6
3conv & fc-30 layer at the end: adadelta 70% ... +
3conv & 2fc-30: not converging
data augmentation: 3conv & fc30: 85% ??? (not repeatable, mistake in model?)
added (dark/bad?) images
4conv, fc-20, only with hand augmented: 55%
4conv, fc-20, no augmentation: ~65%

CLASSES
4conv, fc-100, no augment, learning rate 0.01: 65% ... 75% (epoch 5) ... 80% epoch 10 (gets all classes nearly equally good)
4conv, fc-200, no aug, filters 32 size 4 stride 2: 65% after 2 epochs, 70% after 3, 73% after 5 ... was regression used??
", with aug (fixed?): 

*/

// var p = []
// for (var i = 1; i <= 15; i++) {
// 	var s = i.toString()
// 	p.push(parseInt(s)) // r
// 	p.push(parseInt(s + s)) // g
// 	p.push(parseInt(s + s + s)) // b
// }
// // console.log(p)
// console.log(getImageParts(p, 5, 1))
// 	// console.log(getImagePart(p, 2, 1, 2, 2))
// process.exit(0)

layer_defs = [];
// layer_defs.push({type:'input', out_sx:128, out_sy:72, out_depth:3});
// layer_defs.push({type:'conv', sx:5, filters:8, stride:1, pad:2, activation:'relu'});
// layer_defs.push({type:'pool', sx:2, stride:2});
// layer_defs.push({type:'conv', sx:5, filters:16, stride:1, pad:2, activation:'relu'});
// layer_defs.push({type:'pool', sx:3, stride:3});
// layer_defs.push({type:'softmax', num_classes:10});



layer_defs.push({
	type: 'input',
	out_sx: IMAGE_WIDTH / DIVIDER_X,
	out_sy: IMAGE_HEIGHT / DIVIDER_Y,
	out_depth: 3
});
layer_defs.push({
	type: 'conv',
	sx: 5,
	filters: 12, // 32
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
	filters: 16, // 32
	stride: 1, // 2
	// pad: 2, // 
	activation: 'relu'
		// drop_prob: 0.7
});
layer_defs.push({
	type: 'pool',
	sx: 3, // 2
	stride: 3
});
// layer_defs.push({
// 	type: 'conv',
// 	sx: 4, // 4
// 	filters: 48, // 32
// 	stride: 4, // 1
// 	pad: 2,
// 	activation: 'relu',
// 	drop_prob: 0.5
// });
// layer_defs.push({
// 	type: 'pool',
// 	sx: 2, // 2
// 	stride: 2
// });
// layer_defs.push({
// 	type: 'fc',
// 	num_neurons: 100, // 100, 200
// 	activation: 'relu'
// });
// layer_defs.push({
// 	type: 'fc',
// 	num_neurons: 256, // wasn't there
// 	activation: 'relu'
// });

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
	l2_decay: 0.001, // 0.001
	batch_size: 4,
	learning_rate: 0.01 // 0.01
		// ,momentum: 0.9
}
var trainer = new convnetjs.SGDTrainer(net, trainer_options);
console.log(trainer_options)

loadDB()
console.log('load image data')
loadImages(DBdata).then(function() {
	// console.log(ImageData[0][0].w)
	TestData = ImageData.splice(-1 * Math.round(ImageData.length / 8))

	// ImageData = helpers.augmentData(ImageData, REGRESSION_OUTPUT)
	ImageData = shuffle(ImageData)

	console.log('\nTraining rows: ' + ImageData.length + ', Test rows: ' + TestData.length)

	// console.log('\ntraining')
	var stats, totalLoss = 0;
	for (var e = 0; e < MAX_EPOCHS; e++) {
		console.log('\nepoch: ' + (e + 1) + ' of ' + MAX_EPOCHS + ' * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *')
		ImageData = shuffle(ImageData)

		// var bar = new ProgressBar('  training [:bar] :percent :etas', {
		// 	complete: '=',
		// 	incomplete: ' ',
		// 	width: 30,
		// 	total: ImageData.length
		// });
		console.time('first-100')
		for (var i = 0; i < ImageData.length; i++) {
			// try {
			stats = trainer.train(ImageData[i][0], ImageData[i][1]);

			// augmentation, do it here to save memory
			// var t = helpers.flipHorizontally(ImageData[i])
			// stats = trainer.train(t[0], t[1])

			// t = helpers.flipVertically(ImageData[i])
			// stats = trainer.train(t[0], t[1])

			// } catch (e) {
			// 	console.log(e)
			// 		// console.log(ImageData[i][0])
			// }
			if (i == 100)
				console.timeEnd('first-100')

			if ((i + 1) % 10 == 0) {
				// bar.tick(i)
				readline.cursorTo(process.stdout, 0)
				process.stdout.write('    ' + (i + 1) + ' / ' + ImageData.length + ' images done   ...  ' + stats.loss + '')
			}
			if ((i + 1) % 1000 == 0 && i > 0) {
				readline.cursorTo(process.stdout, 0)
				console.log('    ' + (i + 1) + ' / ' + ImageData.length + ' images done   ...  ' + stats.loss + '')
			}
			if (i % 10 == 0 && i > 0) totalLoss += stats.loss
			if (i % 1000 == 0 && i > 0) {
				console.log(' ')
				testNetwork(true);
				console.log('   avg loss: ' + totalLoss / 100)
				totalLoss = 0
			}
		}

		console.log(' ');
		// if (e % 1 == 0)
		testNetwork();

		saveNetwork('net_e' + (e + 1) + '.txt');
	}

	testNetwork();

});

function testNetwork(testPart) {
	var testPart = typeof testPart !== 'undefined' ? testPart : false;
	console.log('\ntesting')

	var wrongCounter = 0;
	var correctClassCounter = Array(OUTPUT_PARTS + 1).fill(0)
	var totalClassCounter = Array(OUTPUT_PARTS + 1).fill(0)
	var resClassCounter = Array(OUTPUT_PARTS + 1).fill(0)

	var firstRes;
	var displayedMsg;
	// var bar = new ProgressBar('  testing [:bar] :percent :etas', {
	// 		complete: '=',
	// 		incomplete: ' ',
	// 		width: 30,
	// 		total: TestData.length
	// 	});

	var divider = 1
	if (testPart) {
		TestData = shuffle(TestData) // because of slow performance, test only a part
		divider = 2
	}

	for (var i = 0; i < TestData.length / divider; i++) {
		var res = net.forward(TestData[i][0])
			// if (i%10==0) bar.tick(i)
		var classIsMax = '';

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
			process.stdout.write('    ' + (i) + ' / ' + TestData.length + '')
		}
	}

	console.log('\nCorrect: ' + Math.round((1 - wrongCounter / TestData.length) * 100) + ' %')

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


// function getClass(row) {
// 	if (row[1] == -1) return (OUTPUT_PARTS); // no hand // 3
// 	// if (row[1] <= 640 / OUTPUT_PARTS * 1) return 0; // left
// 	// if (row[1] <= 640 / OUTPUT_PARTS * 2) return 1; // center
// 	// return 2; // right

// 	for (var i = 1; i <= OUTPUT_PARTS; i++) {
// 		if (row[1] <= 640 / OUTPUT_PARTS * i) return (i - 1);
// 	}
// }

// function getClass(row) {
// 	if (row[1] == -1) return 0; // no hand
// 	else return 1; // hand
// }

function getClass(row) {
	var x = row[1],
		y = row[2];
	if (x == -1) return 0; // no hand
	if (x <= 128) { // left side
		if (y <= 120) return 1
		if (y <= 240) return 6
		if (y <= 360) return 11
	}
	if (x <= 256) {
		if (y <= 120) return 2
		if (y <= 240) return 7
		if (y <= 360) return 12
	}
	if (x <= 384) { // center
		if (y <= 120) return 3
		if (y <= 240) return 8
		if (y <= 360) return 13
	}
	if (x <= 512) {
		if (y <= 120) return 4
		if (y <= 240) return 9
		if (y <= 360) return 14
	}
	if (x <= 640) { // right side
		if (y <= 120) return 5
		if (y <= 240) return 10
		if (y <= 360) return 15
	}
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
	var path = 'records/' + imageName;

	var promise = new Promise(function(resolve, reject) {
		fs.access(path, fs.F_OK, function(err) {
			// hook TEST if the networks works better if only pictures with a hand on it are used
			// if (outputValues.toString() == [0, 0, 0].toString()) {
			// 	// console.log('no hand on this picture, leave out')
			// 	resolve()
			// } else {

			if (err) {
				console.log('file not found: ' + path);
				resolve();
			} else {
				PNG2.decode(path, function(pixels) {
					// whole picture as input
					if (DIVIDER_X <= 1 && DIVIDER_Y <= 1) {
						var inputData = getInputData(pixels)
						ImageData.push([inputData, outputValues]);
					}
					// picute parts as input
					else {
						pixels = Object.keys(pixels).map(function(k) {
							return pixels[k]
						});
						// remove alpha channel, remove every 4th element
						for (var i = 3; i < pixels.length; i += 3) {
							pixels.splice(i, 1)
						}

						var widthX = IMAGE_WIDTH / DIVIDER_X
						var widthY = IMAGE_HEIGHT / DIVIDER_Y
						var imageParts = getImageParts(pixels, DIVIDER_X, DIVIDER_Y)

						for (var i = 0; i < imageParts.length; i++) {
							var output = outputValues == (i + 1) ? 1 : 0
							if (output == 0 && i < 4) continue;

							var inputData = getInputData2(imageParts[i], widthX, widthY)
							ImageData.push([inputData, output]);
						}
					}

					resolve();
				});
			}
			// }
		});
	});

	return promise;
}

function getInputData(data) {
	var x = new convnetjs.Vol(IMAGE_WIDTH, IMAGE_HEIGHT, 3)

	for (var dc = 0; dc < 3; dc++) {
		for (var xc = 0; xc < IMAGE_WIDTH; xc++) {
			for (var yc = 0; yc < IMAGE_HEIGHT; yc++) {
				// var ix = ((W * k) + i) * 4 + dc;
				var ix = (IMAGE_WIDTH * yc + xc) * 4 + dc;

				// standardize here
				x.set(yc, xc, dc, (data[ix] / 255.0 - 0.5) * 2);
			}
		}
	}

	return x;
}

function getInputData2(data, widthX, widthY) {
	var x = new convnetjs.Vol(widthX, widthY, 3)

	for (var dc = 0; dc < 3; dc++) {
		for (var xc = 0; xc < widthX; xc++) {
			for (var yc = 0; yc < widthY; yc++) {
				var ix = (IMAGE_WIDTH * yc + xc) * 3 + dc;

				// standardize here
				x.set(yc, xc, dc, (data[ix] / 255.0 - 0.5) * 2);
			}
		}
	}

	return x;
}

function getImageParts(pixels, partsX, partsY) {
	var widthX = Math.floor(IMAGE_WIDTH / partsX)
	var widthY = Math.floor(IMAGE_HEIGHT / partsY)
	if (widthX == 0 || widthY == 0) {
		console.trace('parts to small, please check image height/width and number of parts on X and Y axis')
		return []
	}
	if (IMAGE_WIDTH * IMAGE_HEIGHT * 3 > pixels.length) {
		console.trace('not enough pixels for given image height and width?')
	}
	var parts = []

	for (var yp = 0; yp < partsY; yp++) {
		for (var xp = 0; xp < partsX; xp++) {
			// var pNr = yp * partsX + xp
			parts.push(getImagePart(pixels, xp * widthX, yp * widthY, widthX, widthY))
		}
	}

	return parts
}


function getImagePart(pixels, startX, startY, widthX, widthY) {
	var newPixels = []
	widthX = Math.min(startX + widthX, IMAGE_WIDTH) - startX
	widthY = Math.min(startY + widthY, IMAGE_HEIGHT) - startY

	for (var yc = startY; yc < startY + widthY; yc++) {
		for (var xc = startX; xc < startX + widthX; xc++) {
			for (var dc = 0; dc < 3; dc++) {
				var ix = (IMAGE_WIDTH * yc + xc) * 3 + dc;
				newPixels.push(pixels[ix])
			}
		}
	}

	return newPixels
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