var fs = require('fs'),
	gm = require('gm').subClass({
		imageMagick: true
	});

var helpers = require('./DroneHelpers.js')

const DB_NAME = 'database.csv';
const IMAGE_WIDTH = 128; // 128
const IMAGE_HEIGHT = 72; // 72
const DIVIDER_X = 5
const DIVIDER_Y = 3



var DBdata = []
var newDB = []
DBdata = helpers.loadDatabase(DB_NAME);
DBdata = shuffle(DBdata)

for (var i = 0; i < DBdata.length; i++) {
	var row = DBdata[i],
		x, y, output

	if (row[1] >= 0) {
		x = row[1] / 5 - 20
		y = row[2] / 5 - 20
		if (x >= IMAGE_WIDTH - 40) x = IMAGE_WIDTH - 40 - 1
		if (y >= IMAGE_HEIGHT - 40) y = IMAGE_HEIGHT - 40 - 1
		if (x < 0) x = 0
		if (y < 0) y = 0
		output = 1
	} else {
		x = 44
		y = 16
		output = 0
	}

	// console.log(row[0])
	try {
		gm('records/' + row[0])
			.crop(40, 40, x, y)
			.write("records_crop/" + row[0], function(err) {
				if (!err) console.log('done');
			});
		newDB.push(row[0] + ';' + output)

		if (x < 64 && y < 30) {
			x = 80
			y = 32

			gm('records/' + row[0])
				.crop(40, 40, x, y)
				.write("records_crop/2_" + row[0], function(err) {
					if (!err) console.log('done');
				});
			newDB.push('2_' + row[0] + ';' + 0)
		}
		if (x < 64 && y < 30) {
			x = 64
			y = 32

			gm('records/' + row[0])
				.crop(40, 40, x, y)
				.write("records_crop/2_" + row[0], function(err) {
					if (!err) console.log('done');
				});
			newDB.push('2_' + row[0] + ';' + 0)
		}
	} catch (e) {
		console.log(row)
		console.log(e)
	}
	// console.log(newDB.length)

	// stupid gm error "Error: spawn convert EAGAIN"
	if (i % 100 == 0) saveDB()
}

function saveDB() {
	var DBstr = newDB.join('\n')
	fs.writeFileSync('records_crop/_DB.csv', DBstr)
	console.log('save DB, having ' + newDB.length + ' rows')
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