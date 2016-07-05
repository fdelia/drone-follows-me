var helpers = require('./DroneHelpers.js')

const DB_NAME = 'database.csv';
DBdata = helpers.loadDatabase(DB_NAME);

console.log('found ' + DBdata.length + ' images')
var images = []
var classCounterX = [0, 0, 0, 0]
var classCounterY = [0, 0, 0, 0]
var testCounter = 0;
for (var i = 0; i < DBdata.length; i++) {
	var row = DBdata[i];
	// console.log(row);

	var output = getOutputValues(row)

	if(isZeroArray(output)) classCounterX[3]++;
	else {
		classCounterX[isMax(output)]++;
	}

	// if (row[1]<160 && row[1] != -1) testCounter++;
	// if (isZeroArray(output) && row[2] != -1){
	// 	console.log(row)
	// }

	if (row[2] == -1) classCounterY[3]++;
	else if (row[2] < 106) classCounterY[0]++;
	else if (row[2] < 213) classCounterY[1]++;
	else classCounterY[2]++;

	if (row[1] == -1 && row[2] != -1) {
		console.log('this image entry is wrong: ')
		console.log(row)
	}

	if (images.indexOf(row[0]) >= 0) {
		console.log('double image found: ' + row[0])
	} else
		images.push(row[0]);
}

console.log('X: left, center, right, no hand')
console.log(classCounterX)

console.log('Y: top, center, bottom, no hand')
console.log(classCounterY)

console.log('Test counter: '+testCounter)





// DBsmall = helpers.loadDatabase('records_crop/_DB.csv')
// var classCounter = [0, 0]
// for (var i=0; i< DBsmall.length; i++){
// 	var row = DBsmall[i];
// 	if (row[1] == '0') classCounter[0]++;
// 	else classCounter[1]++;
// }

// console.log('\ncropped images:')
// console.log('no hand, hand')
// console.log(classCounter)



function getOutputValues(row) {
	if (row[1] == -1) return [0, 0, 0];

	// var x0 = Math.max(1 - (row[1] / 320), 0);
	// var x1 = 1 - Math.abs(row[1] - 320) / 320;
	// var x2 = Math.max(1 - (Math.abs(row[1] - 640) / 320), 0);
	// return [x1, x2, x3];

	var output = [];
	for (var x = 0; x < 3; x++) {
		output[x] = Math.max(0, 1 - Math.abs(row[1] - x / 2 * 640) / 320)
	}
	return output;
}

function isMax(array) {
	for (var i = 0; i < array.length; i++)
		if (array[i] == Math.max.apply(null, array)) return i;
	return false;
}

function isZeroArray(array){
	for (var i=0; i<array.length; i++)
		if (array[i] !== 0) return false;

	return true;
}