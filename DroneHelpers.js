var fs = require('fs');
var PNG = require('png-js');


var Obj = {}

Obj.hey = function() {
	return 'hello';
}


Obj.loadDatabase = function(dbName) {
	var lines = fs.readFileSync(dbName, 'utf8').split('\n');

	lines = lines.filter(function(line) {
		return line.trim() != '';
	});

	var data = lines.map(function(line) {
		return line.split(';');
	});

	lines = lines.filter(function(line) {
		return line[0] != 'undefined';
	});

	console.log('found ' + lines.length + ' images in database');
	return data;
}

Obj.getSectors = function(pixels, sectorWidth, imageWidth, imageHeight) {
	var sectorsInHeight = Math.floor(imageHeight / sectorWidth);
	var sectorsInWidth = Math.floor(imageWidth / sectorWidth);
	var sectors = [],
		sectorPixels = [];
	var xStart = 0,
		yStart = 0;

	for (var i = 0; i < sectorsInWidth; i++) {
		for (var j = 0; j < sectorsInHeight; j++) {
			xStart = i * sectorWidth;
			yStart = j * sectorWidth;
			// console.log('sector ' + xStart + '/' + yStart + ' , w: ' + sectorWidth);

			// do this two sectors

			sectorPixels = []
			for (var x = xStart; x < xStart + sectorWidth; x++) {
				for (var y = yStart; y < yStart + sectorWidth; y++) {
					var idx = (imageWidth * y + x);
					// if (pixels[idx] !== undefined) // TODO
					sectorPixels.push(pixels[imageWidth * y + x]);

				}
			}
			sectors.push((this.average(sectorPixels)));

			// shifted sectors
			// xStart += Math.floor(sectorWidth);
			// yStart += Math.floor(sectorWidth);

			// sectorPixels = []
			// for (var x = xStart; x < xStart + sectorWidth; x++) {
			// 	for (var y = yStart; y < yStart + sectorWidth; y++) {
			// 		var idx = (imageWidth * y + x);
			// 		sectorPixels.push(pixels[imageWidth * y + x]);

			// 	}
			// }
			// sectors.push((this.average(sectorPixels)));

		}
	}

	return sectors;
}

// Obj.checkIfNumber = function(n) {
// 	if (isNaN(n)) console.log('found NaN, leave out');
// 	else return n;
// }


Obj.getInputData = function(self, pixelDivider, marginDivider) {
	var newData = [];
	var pixels = [];

	// cut some margin out
	if (marginDivider) var margin = Math.round(self.height / marginDivider);
	else margin = 0;

	for (var y = margin; y < self.height - margin; y++) {
		for (var x = margin; x < self.width - margin; x++) {
			var idx = (self.width * y + x) << 2;

			if (x % pixelDivider == 0 && y % pixelDivider == 0) {
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

Obj.getInputData2 = function(self, sectorWidth, marginDivider) {
	var pixels = [],
		red = [],
		green = [],
		blue = [];

	// cut some margin out
	if (marginDivider) var margin = Math.round(self.height / marginDivider);
	else margin = 0;

	// divide into colors (without alpha)
	for (var y = margin; y < self.height - margin; y++) {
		for (var x = margin; x < self.width - margin; x++) {
			var idx = (self.width * y + x) << 2;
			red.push(self.data[idx]);
			green.push(self.data[idx + 1]);
			blue.push(self.data[idx + 2]);
		}
	}

	var sectors = this.getSectors(red, sectorWidth, self.width, self.height);
	sectors = sectors.concat(this.getSectors(green, sectorWidth, self.width, self.height));
	sectors = sectors.concat(this.getSectors(blue, sectorWidth, self.width, self.height));

	return sectors;
}

var showedInputdataLength = false; // stupid
Obj.getInputDataFromImage = function(imageName, PIXEL_DIVIDER) {
	var path = 'records/' + imageName;

	var promise = new Promise(function(resolve, reject) {
		fs.access(path, fs.F_OK, function(err) {
			if (err) {
				console.log('file not found: ' + path);
				resolve(false);
			} else {
				PNG.decode(path, function(pixels) {
					var self = {
						data: pixels,
						height: 360,
						width: 640
					}
					var inputData = Obj.getInputData(self, PIXEL_DIVIDER, 0);
					// var inputData = helpers.getInputData2(self, SECTOR_WIDTH, 0);
					inputData = Obj.standardizeData(inputData);
					if (!showedInputdataLength) {
						console.log('   (length input data: ' + inputData.length + ' must be = # input layer neurons)');
						showedInputdataLength = true;
					}

					resolve(inputData);
				});
			}
		});
	});

	return promise;
}


Obj.standardizeData = function(data) {
	// var avg = this.average(data);
	var avg = 128;
	for (var i = 0; i < data.length; i++) {
		data[i] = (data[i] - avg) / 255;
	}
	return data;
}

Obj.average = function(arr) {
	var tot = 0;
	for (var i = 0; i < arr.length; i++) tot += arr[i];
	return tot / arr.length;
}



module.exports = Obj;