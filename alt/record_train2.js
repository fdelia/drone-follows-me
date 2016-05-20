var synaptic = require('synaptic'); // this line is not needed in the browser
var Neuron = synaptic.Neuron,
	Layer = synaptic.Layer,
	Network = synaptic.Network,
	Trainer = synaptic.Trainer,
	Architect = synaptic.Architect;

var fs = require('fs')
var cv = require('opencv')
var PNG = require('pngjs').PNG;

const TEILER = 4;

var t = new Date();
console.log('time now: ' + t.toGMTString())

/* resample with:

 sips -Z 160 *.png 

find records -name "*.png" | while read f ; do 
convert $f -type Grayscale $f; done

 */


// input, hidden (...), output layer
// var perceptron = new Architect.Perceptron(2760, 40, 3);
var perceptron = new Architect.Perceptron(240, 200, 3);
var trainingSet = [];
var trainer = new Trainer(perceptron);
console.log('neural network initialized')
console.log(' ')


// var negativeImgs = fs.readdirSync('records/negative')
// var positiveImgs = fs.readdirSync('records/positive')

// var negativeImgs = fs.readdirSync('records/negative').filter(filterHiddenFiles);
var leftImgs = fs.readdirSync('records/0').filter(filterHiddenFiles);
var centerImgs = fs.readdirSync('records/0.5').filter(filterHiddenFiles);
var rightImgs = fs.readdirSync('records/1').filter(filterHiddenFiles);

function filterHiddenFiles(value) {
	return value[0] !== '.';
}



// negativeImgs = negativeImgs.slice(0, 15)
// positiveImgs = positiveImgs.slice(0, 15)

var inputArray = [];

// var inputArray = negativeImgs.map(function(value) {
// 	return [value, 0];
// });
inputArray = inputArray.concat(leftImgs.map(function(value) {
	return [value, 0, [1, 0, 0]];
}));
inputArray = inputArray.concat(centerImgs.map(function(value) {
	return [value, 0.5, [0, 1, 0]];
}));
inputArray = inputArray.concat(rightImgs.map(function(value) {
	return [value, 1, [0, 0, 1]];
}));


// inputArray = [['img_18.png', 0], ['img_39.png', 0.5], ['img_82.png', 1]]


console.log('input array has ' + inputArray.length + ' rows')

addImages(inputArray);


function addImages(imageArray) {
	var img = imageArray.shift();
	var p1 = addImage(img[0], img[1], img[2]);

	p1.then(function() {
		if (imageArray.length > 0)
			addImages(imageArray);
		else {
			console.log(' ')
			var t = new Date();
			console.log('time now: ' + t.toGMTString())
			console.log('training set length: ' + trainingSet.length)
			console.log('now train...')
			trainer.train(trainingSet, {
				// rate: 0.1,
				iterations: 30,
				shuffle: true,
				// cost: Trainer.cost.MSE,
				log: 1
			});
			console.log('   training finished.')
			console.log(' ')


			// activateImage('records/negative/img_158.png')
			// activateImage('records/positive/img_97.png')

			// activateImage('records/left/img_18.png');
			// activateImage('records/left/img_100.png');

			// activateImage('records/center/img_97.png');
			// activateImage('records/center/img_335.png');

			activateImage('records/0/img_131.png');
			activateImage('records/0.5/img_115.png');
			activateImage('records/1/img_89.png');

			console.log('finished!')

		}
	});
}


function addImage(imageName, dirName, outputValue) {
	var path = '';
	// if (outputValue == 0) path = 'records/left/';
	// if (outputValue == 0.5) path = 'records/center/';
	// if (outputValue == 1) path = 'records/right/';
	// if (positive) path = 'records/positive/' + imageName;
	// else path = 'records/negative/' + imageName;

	path += 'records/' + dirName + '/' + imageName;

	var promise = new Promise(function(resolve, reject) {


		fs.createReadStream(path)
			.pipe(new PNG({
				filterType: 4
			}))
			.on('parsed', function() {
				console.log('add: ' + path + ' : ' + outputValue);
				var newData = [];
				var matrixR = [],
					matrixG = [],
					matrixB = [],
					matrixO = [];

				// console.log('this.data: '+this.data.length)

console.log(this.height + ' / '+this.width);

				for (var y = 0; y < this.height; y++) {
					for (var x = 0; x < this.width; x++) {
						var idx = (this.width * y + x) << 2;

						if (x % TEILER == 0 && y % TEILER == 0) {
							// newData.push(this.data[idx])
							// newData.push(this.data[idx + 1])
							// newData.push(this.data[idx + 2])
							// newData.push(this.data[idx + 3])

							// console.log((this.data[idx]));
							// console.log((this.data[idx+1]));
							// console.log((this.data[idx+2]));

							matrixR.push((this.data[idx]));
							matrixG.push((this.data[idx + 1]));
							matrixB.push((this.data[idx + 2]));
							// matrixO.push(this.data[idx + 3])
							newData.push((toInterval(this.data[idx]) + toInterval(this.data[idx + 1]) + toInterval(this.data[idx + 2])) / 3)
						}

						// // invert color 
						// this.data[idx] = 255 - this.data[idx];
						// this.data[idx+1] = 255 - this.data[idx+1];
						// this.data[idx+2] = 255 - this.data[idx+2];

						// // and reduce opacity 
						// this.data[idx+3] = this.data[idx+3] >> 1;
					}
				}

				// this.pack().pipe(fs.createWriteStream('out.png'));

				// matrixO not needed?
				var inputData = matrixR.concat(matrixG).concat(matrixB);
				// Grayscale
				var inputData = matrixR;
				// inputData = newData;
				console.log('   length input data: ' + inputData.length)

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


function activateImage(path) {
	console.log('activate: ' + path)

	fs.createReadStream(path)
		.pipe(new PNG({
			filterType: 4
		}))
		.on('parsed', function() {
			var newData = [];
			var matrixR = [],
				matrixG = [],
				matrixB = [],
				matrixO = [];

			for (var y = 0; y < this.height; y++) {
				for (var x = 0; x < this.width; x++) {
					var idx = (this.width * y + x) << 2;

					if (x % TEILER == 0 && y % TEILER == 0) {
						// newData.push(this.data[idx])
						// newData.push(this.data[idx + 1])
						// newData.push(this.data[idx + 2])
						// newData.push(this.data[idx + 3])

						matrixR.push((this.data[idx]));
						matrixG.push((this.data[idx + 1]));
						matrixB.push((this.data[idx + 2]));
						// matrixO.push(this.data[idx + 3])
						newData.push((toInterval(this.data[idx]) + toInterval(this.data[idx + 1]) + toInterval(this.data[idx + 2])) / 3)
					}


				}
			}

			var inputData = matrixR.concat(matrixG).concat(matrixB);
			// Grayscale
			var inputData = matrixR;
			// inputData = newData;
			var res = perceptron.activate(inputData);
			console.log(res);

		});
}


function average(arr) {
	var tot = 0;
	for (var i = 0; i < arr.length; i++) tot += arr[i];
	return tot / arr.length;
}