var helpers = require('./DroneHelpers.js')

const DB_NAME = 'database.csv';
DBdata = helpers.loadDatabase(DB_NAME);

console.log('found ' + DBdata.length + ' images')
var images = []
var classCounterX = [0, 0, 0, 0]
var classCounterY = [0, 0, 0, 0]
for (var i = 0; i < DBdata.length; i++) {
	var row = DBdata[i];
	// console.log(row);

	if (row[1] == -1) classCounterX[3]++;
	else if (row[1] < 213) classCounterX[0]++;
	else if (row[1] < 426) classCounterX[1]++;
	else classCounterX[2]++;

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