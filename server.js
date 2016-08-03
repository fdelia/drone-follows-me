const DB_NAME = 'database.csv';

var sizeOf = require('image-size');
var fs = require('fs');
var express = require('express');
var app = express();
var path = require('path');
var helpers = require('./DroneHelpers.js');

// Attention: this server in the "drone" main directory, not in server/
// It's insecure and pretty special... please consider that!
app.use(express.static(__dirname + '/'));

var DB = helpers.loadDatabase(DB_NAME);
var imagesInRecord = fs.readdirSync('records/').filter(hiddenFilesAndDirs);

var imageCounter = 0;

app.get('/saveImageCoords/', function(req, res) {
	console.log(req.query);

	// Attention: asynchronous, could load same image again!
	if (req.query.imageName && req.query.x !== undefined && req.query.y !== undefined)
		addToDatabase([req.query.imageName, req.query.x, req.query.y]).then((val) => {
			res.json(imageCounter);
		});
});

app.get('/getImageNames/', function(req, res) {
	console.log(req.query);
	if (!req.query.number || req.query.number < 1) req.query.number = 10;

	var imagesInDB = DB.map(function(entry) {
		return entry[0];
	});

	function notInDB(name) {
		return imagesInDB.indexOf(name) == -1;
	}

	function existsAndCorrectShape(name) {
		var dim = sizeOf("./records/" + name);
		var dimCorrect = (dim.width == 640 && dim.height == 360);

		if (!dimCorrect) console.log('wrong dimensions: ' + name);

		return dimCorrect;
	}

	var imagesNotInDB = imagesInRecord.filter(notInDB).filter(existsAndCorrectShape);

	console.log('\nloading images...');
	console.log('images left: ' + imagesNotInDB.length);
	console.log(' ');
	imageCounter = imagesNotInDB.length;

	var newImages = [];
	for (var i = 0; i < req.query.number; i++) {
		// if save is too slow, don't use the same image again
		if (imagesNotInDB[i]) newImages.push(imagesNotInDB[i]);
	}

	res.json(newImages);
});


function hiddenFilesAndDirs(name) {
	if (name[0] == '.') return false;
	if (name.indexOf('.png') > 0) return true;
	return false;
}

function addToDatabase(entries) {
	return new Promise((resolve, reject) => {

		if (!entries[0]) {
			console.log('error, entries are: ');
			console.log(entries);
			reject();
		}

		// if (entries[1] >= 0) {
		// 	console.log('ATTENTION: saving as "label 2"/fist!')
		// 	entries.push('fist')
		// }

		DB.push(entries) // global var
		imageCounter--;

		fs.appendFile(DB_NAME, entries.join(';') + '\n', function(err) {
			if (err) {
				console.log(err);
				reject();
			}
			else {
				console.log(' saved img ' + entries[0]);
				resolve();
			}
		});

	});
}


app.listen(process.env.PORT || 3000)