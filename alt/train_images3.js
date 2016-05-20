var synaptic = require('synaptic'); // this line is not needed in the browser
var Neuron = synaptic.Neuron,
	Layer = synaptic.Layer,
	Network = synaptic.Network,
	Trainer = synaptic.Trainer,
	Architect = synaptic.Architect;

var fs = require('fs')
	// var cv = require('opencv')
var PNG = require('pngjs').PNG;

// 16 , 703 , grey , ? minimale Daten -> ok
// 28 , 693 / 150 , rgb , mit neg , rate 0.3 -> ok
// 32 , 570 / 200 , rgb , ohne neg, rate 0.1 minimale Daten -> ok
// 22 , 1092 / " " " minimale Daten -> 50%

// 32 , 570 / 200, rgb mit allem, rate 0.02, 20 iter -> festgefahren

const TEILER = 20; // auch in follow_hand.js anpassen!
const MARGIN_DIVIDER = 5;  // auch in follow_hand.js anpassen!

const INPUT_LAYER = 825;
const HIDDEN_LAYER = 30;
const MAX_ITERATIONS = 100;

var t = new Date();
console.log('time now: ' + t.toGMTString())

/* 

resample with: (not necessary anymore)

sips -Z 160 *.png 

find records -name "*.png" | while read f ; do 
convert $f -type Grayscale $f; done

mindestens 459 x 300 + 300 x 3 Daten/Bilder, bzw. diese Nummer x2

VIELE BILDER (p), 16. Mai, CROSS_ENTROPY error function, margin=1/15:
693 / 10, Teiler 28, rgb, mit neg, rate 0.2, Daten standardisiert, 100 iter -> 7 aus 8!
" mit pp -> 6 aus 8 (nur negative falsch)
" mit 693 / 20 -> "
läuft relativ ok mit mehr Bildern (pp), auch veränderte Szenarien, Negative werden schlecht erkannt

Teiler 26: erkennt jetzt negative
Teiler 24: negative nicht mehr, auch sonst ein wenig ungenauer
Teiler 22: 1092, am besten mit hidden layer = 20
Teiler 20: 1305/20 -> 50%
T 26, 828/30, 20 Iter -> ca 75%
" mehr Bilder (500) -> 8/12, negative falsch
" aber 20 hidden -> 9/12, negative falsch
" 15 hidden -> 10/12, negative zT
" 10 hidden -> "
" mehr Bilder (747) -> 5/12
" 20 hidden -> 6/12, erkennt keine links
" 15 hidden -> 6/12, keine links
Teiler 22, 1092/20 -> 5/12
Teiler 26, margin=0, 1050/20 -> 3/12
margin=1/20, 897/20 -> 4/12
wieder margin=1/15, 828/20 -> 7/12
" hidden 15 -> 8/12
" hidden 10 -> 7/12

Teiler 20 ... 5/12
Margin 1/10 -> 7/12
margin 1/5 -> 8/12

*/

// input, hidden (...), output layer
var trainingSet = [];
var perceptron = new Architect.Perceptron(INPUT_LAYER, HIDDEN_LAYER, 3);
var trainer = new Trainer(perceptron);
var totalTestError = 0;
var numberTested = 0;
var testedSuccess = 0;
console.log('neural network initialized')
console.log(' ')

// path with images => output data
var trainingDataPath = [];

trainingDataPath.push(['0', [1, 0, 0]]);
trainingDataPath.push(['0.5', [0, 1, 0]]);
trainingDataPath.push(['1', [0, 0, 1]]);

trainingDataPath.push(['neg', [0, 0, 0]]);

trainingDataPath.push(['0p', [1, 0, 0]]);
trainingDataPath.push(['0.5p', [0, 1, 0]]);
trainingDataPath.push(['1p', [0, 0, 1]]);

trainingDataPath.push(['0pp', [1, 0, 0]]);
trainingDataPath.push(['0.5pp', [0, 1, 0]]);
trainingDataPath.push(['1pp', [0, 0, 1]]);
trainingDataPath.push(['neg_pp', [0, 0, 0]]);



function filterHiddenFiles(value) {
	return value[0] !== '.';
}


var inputArray = [];
trainingDataPath.forEach(function(val) {
	var imgs = fs.readdirSync('records/' + val[0]).filter(filterHiddenFiles);
	inputArray = inputArray.concat(imgs.map(function(imgName) {
		return [imgName, val[0], val[1]];
	}));
});


console.log('input array has ' + inputArray.length + ' rows')

// use training data file? 
if (true)
	computeImages(inputArray);
else {
	console.log('train directly with saved data')
	console.log(' - has the input changed? -')
	fs.readFile('trainingData.json', function(err, data) {
		trainingSet = JSON.parse(data);

		trainAndActivate();
	});
}


function computeImages(imageArray) {
	var img = imageArray.shift();
	var p1 = addImage(img[0], img[1], img[2]);

	p1.then(function() {
		if (imageArray.length > 0)
			computeImages(imageArray);
		else {
			// save training data
			fs.writeFile('trainingData.json', JSON.stringify(trainingSet), function(err) {
				if (err) console.log('error: ' + err);
				else console.log('training data saved')
			});

			trainAndActivate();
		}
	});
}

function trainAndActivate() {
	console.log(' ')
	var t = new Date();
	// console.log('time now: ' + t.toGMTString())
	console.log('training set length: ' + trainingSet.length)
	console.log('train now...')

	trainer.train(trainingSet, {
		// rate: 0.02,
		iterations: MAX_ITERATIONS,
		// shuffle: true,
		cost: Trainer.cost.CROSS_ENTROPY,
		log: 1
	});
	console.log('   training finished.')
	console.log(' ')


	saveNetwork();


	activateImage('records/0p/img_172.png', [1, 0, 0]);
	activateImage('records/0p/img_314.png', [1, 0, 0]);
	activateImage('records/0pp/img_64.png', [1, 0, 0]);
	activateImage('records/0pp/img_14.5.1.428.png', [1, 0, 0]);

	activateImage('records/0.5p/img_126.png', [0, 1, 0]);
	activateImage('records/0.5p/img_330.png', [0, 1, 0]);
	activateImage('records/0.5pp/img_14.4.56.395.png', [0, 1, 0]);

	activateImage('records/1p/img_94.png', [0, 0, 1]);
	activateImage('records/1p/img_250.png', [0, 0, 1]);
	activateImage('records/1pp/img_14.4.59.410.png', [0, 0, 1]);

	activateImage('records/neg/img_6.png', [0, 0, 0]);
	activateImage('records/neg/img_370.png', [0, 0, 0]);

	activateImage('records/img_12.53.2.62.png', [0, 1, 0]);
	activateImage('records/img_14.4.24.198.png', [0, 1, 0]);
	// activateImage('records/img_37.png');
	activateImage('records/img_115.png', [0.2, 0.8, 0]);
	activateImage('records/img_119.png', [0, 0.8, 0.2]);
	activateImage('records/img_199.png', [0, 0, 0]);
	activateImage('records/img_84_29.png', [0, 0, 0]);

	// timeout bc. asynchronous activation
	setTimeout(function() {
		console.log(' ')
		console.log('Teiler, Input, Hidden, Margin, max Iterations')
		console.log(TEILER + ', ' + INPUT_LAYER + '/' + HIDDEN_LAYER + ', ' + MARGIN_DIVIDER + ', ' + MAX_ITERATIONS+ '   success: ' + testedSuccess + ' / ' + numberTested + '  ,  ' + Math.round(testedSuccess / numberTested * 100) + ' %')
		// console.log('success: ' + testedSuccess + ' / ' + numberTested + '  ,  ' + Math.round(testedSuccess / numberTested * 100) + ' %')
		console.log('average error: ' + Math.round(totalTestError / numberTested * 10) / 10)
	}, 2000);
}

function saveNetwork() {
	var data = JSON.stringify(perceptron.toJSON());

	fs.writeFile('perceptron.json', data, function(err) {
		if (err) console.log('error: ' + err);
		else console.log('network saved')
	})
}

function getInputData(self) {
	var newData = [];

	// cut some margin out
	var margin = Math.round(self.height / MARGIN_DIVIDER);

	for (var y = margin; y < self.height - margin; y++) {
		for (var x = margin; x < self.width - margin; x++) {
			var idx = (self.width * y + x) << 2;

			if (x % TEILER == 0 && y % TEILER == 0) {
				newData.push(self.data[idx]);
				newData.push(self.data[idx + 1]);
				newData.push(self.data[idx + 2]);
				// newData.push((toInterval(self.data[idx]) + toInterval(self.data[idx + 1]) + toInterval(self.data[idx + 2])) / 3)
				// newData.push(Math.round((self.data[idx] + self.data[idx + 1] + self.data[idx + 2]) / 3));
			}

		}
	}
	// self.pack().pipe(fs.createWriteStream('out.png'));
	return newData;
}

function standardizeData(data) {
	var avg = average(data);
	for (var i = 0; i < data.length; i++) {
		data[i] = (data[i] - avg) / 255;
	}
	return data;
}

var showedInputdataLength = false; // stupid
function addImage(imageName, dirName, outputValue) {
	var path = 'records/' + dirName + '/' + imageName;

	var promise = new Promise(function(resolve, reject) {
		fs.createReadStream(path)
			.pipe(new PNG({
				filterType: 4
			}))
			.on('parsed', function() {
				// console.log('add: ' + path + ' : ' + outputValue);

				var inputData = getInputData(this);
				inputData = standardizeData(inputData);
				if (!showedInputdataLength) {
					console.log('   length input data: ' + inputData.length)
					showedInputdataLength = true;
				}

				trainingSet.push({
					input: inputData,
					output: outputValue
				});
				resolve();
			});
	});

	return promise;

}

function toInterval(num) {
	return Math.round(num / 255 * 1000) / 1000;
}


function activateImage(path, optimalResult) {

	fs.createReadStream(path)
		.pipe(new PNG({
			filterType: 4
		}))
		.on('parsed', function() {
			console.log(' ')
			console.log('activate: ' + path)

			var inputData = getInputData(this);
			inputData = standardizeData(inputData);
			var res = perceptron.activate(inputData);

			if (optimalResult) {
				var error = 0;
				error += Math.abs(res[0] - optimalResult[0]);
				error += Math.abs(res[1] - optimalResult[1]);
				error += Math.abs(res[2] - optimalResult[2]);

				totalTestError += error;
				numberTested++;
				// if (error < 0.3) testedSuccess++;
				if (isMax(optimalResult) == isMax(res)) testedSuccess++;

			}

			var RRR = 10;
			res = [Math.round(res[0] * RRR) / RRR, Math.round(res[1] * RRR) / RRR, Math.round(res[2] * RRR) / RRR]
			console.log(res);

			if (optimalResult) {
				console.log('  error: ' + error);
				if (isMax(optimalResult) == isMax(res)) console.log('  OK  ')
			}

		});
}

function isMax(array) {
	for (var i = 0; i < array.length; i++)
		if (array[i] == Math.max.apply(null, array)) return i;
	return false;
}


function average(arr) {
	var tot = 0;
	for (var i = 0; i < arr.length; i++) tot += arr[i];
	return tot / arr.length;
}