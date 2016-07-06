var fs = require('fs'),
	gm = require('gm').subClass({
		imageMagick: true
	});

var helpers = require('./DroneHelpers.js')

const DB_NAME = 'database.csv';
const IMAGE_WIDTH = 128; // 128
const IMAGE_HEIGHT = 72; // 72



var DBdata = []
var newDB = []
DBdata = helpers.loadDatabase(DB_NAME);
DBdata = shuffle(DBdata)

console.log('DBdata: ' + DBdata.length)

/*
 TODO: Argh, do this in python. Doesn't work as it should... 
 only crops a part of all images, then the funny error comes up
*/


// cropImage(DBdata)


// function cropImage(DBdata) {
// 	var row = DBdata.shift(),
// 		x, y, label

// 	if (row[1] >= 0) {
// 		x = row[1] / 5 - 20
// 		y = row[2] / 5 - 20
// 		if (x >= IMAGE_WIDTH - 40) x = IMAGE_WIDTH - 40 - 1
// 		if (y >= IMAGE_HEIGHT - 40) y = IMAGE_HEIGHT - 40 - 1
// 		if (x < 0) x = 0
// 		if (y < 0) y = 0
// 		label = 1
// 	} else {
// 		x = 44
// 		y = 16
// 		label = 0
// 	}

// 	console.log(row[0])

// 	return new Promise((resolve, reject) => {
// 		gm('records/' + row[0])
// 			.crop(40, 40, x, y)
// 			.write("records_crop/" + row[0], function(err) {
// 				if (err) console.log(err);
// 				newDB.push(row[0] + ';' + output) // do this here because GM is working async and then it doesn't work (?)
// 				if (newDB.length % 100 == 0) saveDB()

// 				if (label == 0) cropImageNoHand(filename).then(nextImage)
// 				else nextImage



// 				function nextImage() {
// 					cropImage(DBdata).then(() => {
// 						resolve()
// 					})
// 				}


// 			});
// 	})
// }

// function cropImageNoHand(filename) {
// 	x2 = 40
// 	y2 = 0

// 	console.log('2_' + filename)

// 	return new Promise((resolve, reject) => {

// 		gm('records/' + filename)
// 			.crop(40, 40, x2, y2)
// 			.write("records_crop/2_" + filename, function(err) {
// 				if (err) console.log(err);
// 				newDB.push('2_' + filename + ';' + 0)


// 				x2 = 56
// 				y2 = 12
// 				gm('records/' + filename)
// 					.crop(40, 40, x2, y2)
// 					.write("records_crop/2_2" + filename, function(err) {
// 						if (err) console.log(err);
// 						newDB.push('2_2' + filename + ';' + 0)



// 					});



// 			});
// 	})
// }



function saveDB() {
	// return 0
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

// process.exit(0)

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

	try {
		// fs.access('records/' + row[0], fs.F_OK, function(err) {
		// 	if (!err) {
		// 	} else {
		// 		console.log('not found: '+row[0])
		// 	}
		// });

		gm('records/' + row[0])
			.crop(40, 40, x, y)
			.write("records_crop/" + row[0], function(err) {
				if (err) console.log(err);
			});
		newDB.push(row[0] + ';' + output) // do this here because GM is working async and then it doesn't work (?)

		// images with face
		if (row[0].indexOf('img_14.4.5') == 0 || row[0].indexOf('img_14.5.0') == 0 || row[0].indexOf('img_14.5.1') == 0) {
			if (x < 94 && y > 20) {
				x2 = 88
				y2 = 0

				gm('records/' + row[0])
					.crop(40, 40, x2, y2)
					.write("records_crop/3_" + row[0], function(err) {
						if (err) console.log(err);
					});
				newDB.push('3_' + row[0] + ';' + 0)

				x2 = 68
				y2 = 0

				gm('records/' + row[0])
					.crop(40, 40, x2, y2)
					.write("records_crop/3_2" + row[0], function(err) {
						if (err) console.log(err);
					});
				newDB.push('3_2' + row[0] + ';' + 0)
			}

			if (x > 76 && y > 30) {
				x2 = 40
				y2 = 0

				gm('records/' + row[0])
					.crop(40, 40, x2, y2)
					.write("records_crop/3_3" + row[0], function(err) {
						if (err) console.log(err);
					});
				newDB.push('3_3' + row[0] + ';' + 0)
			}
		}

		if (x < 64 && y < 30) {
			x2 = 64
			y2 = 18

			gm('records/' + row[0])
				.crop(40, 40, x2, y2)
				.write("records_crop/2_3" + row[0], function(err) {
					if (err) console.log(err);
				});
			newDB.push('2_3' + row[0] + ';' + 0)
		}
		if (x < 64 && y < 30) {
			x2 = 64
			y2 = 32

			gm('records/' + row[0])
				.crop(40, 40, x2, y2)
				.write("records_crop/2_4" + row[0], function(err) {
					if (err) console.log(err);
					else newDB.push('2_4' + row[0] + ';' + 0)
				});
		}
	} catch (e) {
		// always after 554 images there happens an TypeError: Cannot read property 'once' of undefined (in gm/lib/command.js:227)
		console.log(e)
		console.log(row)
		// dumpError(e)
		// console.log('in newDB: ' + newDB.length)
		saveDB()
		process.exit(0)
	}
	// console.log(newDB.length)

	// stupid gm error "Error: spawn convert EAGAIN"
	if (i % 100 == 0) saveDB()
}


function dumpError(err) {
	if (typeof err === 'object') {
		if (err.message) {
			console.log('\nMessage: ' + err.message)
		}
		if (err.stack) {
			console.log('\nStacktrace:')
			console.log('====================')
			console.log(err.stack);
		}
	} else {
		console.log('dumpError :: argument is not an object');
	}
}