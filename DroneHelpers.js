var fs = require('fs');
var PNG = require('png-js');
var convnetjs = require('convnetjs')
const IMAGE_WIDTH = 128;
const IMAGE_HEIGHT = 72;
const OUTPUT_PARTS = 3; // number of ...


var Obj = {}

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

	// console.log('found ' + lines.length + ' images in database');
	return data;
}

Obj.augmentData = function(data, useRegression) {
	var dataLengthBefore = data.length;
	for (var i = 0; i < dataLengthBefore; i++) {
		// if (this.isZeroArray(data[i][1])) continue;

		data.push(this.flipHorizontally(data[i], useRegression))
			// data.push(this.flipVertically(data[i]))

		// continue;


		// var row = data[i]
		// if (row[1][0] == 0) {
		// 	// move left part to right
		// 	var t = [];
		// 	for (var dc = 0; dc < 3; dc++) {
		// 		for (var xc = 0; xc < 80 / 3; xc++) {
		// 			for (var yc = 0; yc < IMAGE_HEIGHT; yc++) {
		// 				var ix = (IMAGE_WIDTH * yc + xc) * 3 + dc;
		// 				t[ix] = row[0].w.splice(ix, 1)
		// 			}
		// 		}
		// 	}
		// 	console.log(row[0].w.length)

		// 	row[0].w = row[0].w.concat(t)
		// 	var tt = row[1].shift()
		// 	row[1] = row[1].push(tt) // tt is 0

		// 	console.log(row[0].w.length)
		// 	console.log(' ')
		// }
	}

	console.log('augmented data: ' + (data.length - dataLengthBefore))
	return data
}

Obj.flipHorizontally = function(row, useRegression) {
	// flip horizontally  x => IMAGE_LENGTH - x
	// var t = {};
	var newVol = new convnetjs.Vol(IMAGE_WIDTH, IMAGE_HEIGHT, 3)
	for (var dc = 0; dc < 3; dc++) {
		for (var xc = 0; xc < IMAGE_WIDTH; xc++) {
			for (var yc = 0; yc < IMAGE_HEIGHT; yc++) {
				var ix = (IMAGE_WIDTH * yc + xc) * 3 + dc;
				// var ixN = (IMAGE_WIDTH * yc + (IMAGE_WIDTH - 1 - xc)) * 3 + dc;
				// t[ixN] = row[0].w[ix]

				newVol.set(yc, IMAGE_WIDTH - 1 - xc, dc, row[0].w[ix]);
			}
		}
	}

	// var t_arr = []
	// for (var i = 0; i < IMAGE_WIDTH * (IMAGE_HEIGHT) * 3; i++) {
	// 	t_arr[i] = t[i]
	// }
	// row[0].w = t_arr
	// console.log(row)
	row[0] = newVol

	// switch left and right
	if (useRegression) row[1].reverse()
	else {
		// if (row[1] == 0) row[1] = OUTPUT_PARTS - 1
		// else if (row[1] == OUTPUT_PARTS - 1) row[1] = 0

		// var switchNumbers = {
		// 	1: 10,
		// 	2: 11,
		// 	3: 12,
		// 	4: 7,
		// 	5: 8,
		// 	6: 9
		// }

		var switchNumbers = {
			1: 13,
			2: 14,
			3: 15,
			4: 10,
			5: 11,
			6: 12,
			7: 7,
			8: 8,
			9: 9
		}

		// reverse
		for (var i = 1; i <= 30; i++) {
			if (!switchNumbers.hasOwnProperty(i)) break;
			switchNumbers[switchNumbers[i]] = i;
		}

		row[1] = switchNumbers[row[1]]


		// switch (row[1]) {
		// 	case 1: row[1] = 10; break;
		// 	case 2: row[1] = 11; break;
		// 	case 3: row[1] = 12; break;
		// 	case 4: row[1] = 7; break;
		// 	case 5: row[1] = 8; break;
		// 	case 6: row[1] = 9; break;

		// 	case 7: row[1] = 4; break;
		// 	case 8: row[1] = 5; break;
		// 	case 9: row[1] = 6; break;
		// 	case 10: row[1] = 1; break;
		// 	case 11: row[1] = 2; break;
		// 	case 12: row[1] = 3; break;
		// }
		// row[1] = OUTPUT_PARTS - 1 - row[1]
	}

	// console.log(row)
	return row
}

Obj.flipVertically = function(row) {
	// flip vertically
	// var t = [];
	var newVol = new convnetjs.Vol(IMAGE_WIDTH, IMAGE_HEIGHT, 3)
	for (var dc = 0; dc < 3; dc++) {
		for (var xc = 0; xc < IMAGE_WIDTH; xc++) {
			for (var yc = 0; yc < IMAGE_HEIGHT; yc++) {
				var ix = (IMAGE_WIDTH * yc + xc) * 3 + dc;
				// var ixN = (IMAGE_WIDTH * (IMAGE_HEIGHT - 1 - yc) + xc) * 3 + dc;
				// t[ixN] = row[0].w[ix]

				newVol.set(IMAGE_HEIGHT - 1 - yc, xc, dc, row[0].w[ix]);
			}
		}
	}
	// row[0].w = t
	row[0] = newVol

	return row
}


Obj.getInputData = function(self, pixelDivider) {
	var newData = [];
	// var pixels = [];

	// cut some margin out
	// if (marginDivider) var margin = Math.round(self.height / marginDivider);
	// else margin = 0;

	var margin = 0; // because of average
	var r, g, b;
	const AVG_LINES = 8
	const AVG_COLS = 8

	for (var y = margin; y < self.height - margin; y += AVG_LINES) {
		for (var x = margin; x < self.width - margin; x += AVG_COLS) {
			var idx = (self.width * y + x) << 2;

			function dt(idx_diff) {
				return self.data[idx + idx_diff];
			}


			newData.push(dt(0))
			newData.push(dt(1))
			newData.push(dt(2))


			// r = 0
			// g = 0
			// b = 0
			// for (var j = 0; j < AVG_LINES; j++) {
			// 	for (var k = 0; k < AVG_COLS; k++) {
			// 		r += dt(k + j * self.width * 4)
			// 		g += dt(k + 1 + j * self.width * 4)
			// 		b += dt(k + 2 + j * self.width * 4)
			// 	}

			// 	r /= AVG_COLS
			// 	g /= AVG_COLS
			// 	b /= AVG_COLS
			// }

			// r /= AVG_LINES
			// g /= AVG_LINES
			// b /= AVG_LINES

			// newData.push(r)
			// newData.push(g)
			// newData.push(b)

		}
	}

	// self.pack().pipe(fs.createWriteStream('out.png'));
	return newData;
}

Obj.getInputData2 = function(self, sectorWidth) {
	var pixels = [],
		red = [],
		green = [],
		blue = [];

	// cut some margin out
	// if (marginDivider) var margin = Math.round(self.height / marginDivider);
	// else margin = 0;
	var margin = 0;

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
	// var avg = 0;
	for (var i = 0; i < data.length; i++) {
		data[i] = (data[i] - avg) / 128;
	}
	return data;
}

Obj.average = function(arr) {
	var tot = 0;
	for (var i = 0; i < arr.length; i++) tot += arr[i];
	return tot / arr.length;
}

Array.prototype.max = function() {
	return Math.max.apply(null, this);
};


Obj.isMax = function(array) {
	for (var i = 0; i < array.length; i++)
		if (array[i] == Math.max.apply(null, array)) return i;
	return false;
}

Obj.isZeroArray = function(array) {
	for (var i = 0; i < array.length; i++)
		if (array[i] !== 0) return false;

	return true;
}

Obj.getUndefinedIndexes = function(array) {
	var indexes = []
	for (var i = 0; i < array.length; i++)
		if (array[i] === undefined) indexes.push(i)

	return indexes
}


module.exports = Obj;