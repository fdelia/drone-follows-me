const DB_NAME = 'database.csv';

var sizeOf = require('image-size');
var fs = require('fs');
var express = require('express');
var app = express();
var helpers = require('./DroneHelpers.js');

app.use(express.static(__dirname + '/'));
app.listen(process.env.PORT || 3000)

var DB = helpers.loadDatabase(DB_NAME);
var imagesInRecord = fs.readdirSync('records/').filter(hiddenFilesAndDirs);


app.get('/set/', function(req, res) {
	// console.log(' ')
	// console.log(req.query);

	// Attention: asynchronous, could load same image again!
	if (req.query.imageName && req.query.x !== undefined && req.query.y !== undefined)
		addToDatabase([req.query.imageName, req.query.x, req.query.y])

	var imagesInDB = DB.map(function(entry) {
		return entry[0];
	});

	// remove images which are in DB
	var imagesNotInDB = imagesInRecord.filter(notInDB).filter(existsAndCorrectShape);

	console.log('images left: ' + imagesNotInDB.length)

	if (!req.query.hasImages) {
		// load new images
		var newImages = [];
		for (var i = 0; i < 20; i++) {
			// if save is too slow, don't use the same image again
			if (imagesNotInDB[i] && imagesNotInDB[i] != req.query.imageName) newImages.push(imagesNotInDB[i]);
		}
		res.redirect('/server/index.html?newImages=' + newImages.join(','));
	}


	function existsAndCorrectShape(name){
		var dim = sizeOf("./records/" + name);
		var dimCorrect = (dim.width == 640 && dim.height == 360);

		if (! dimCorrect) console.log('wrong dimensions: ' + name);

		return dimCorrect;
	}

	function notInDB(name) {
		return imagesInDB.indexOf(name) == -1;
	}

});


function hiddenFilesAndDirs(name) {
	if (name[0] == '.') return false;
	if (name.indexOf('.png') > 0) return true;
	return false;
}

function addToDatabase(entries) {
	if (!entries[0]) {
		console.log('error, entries are: ');
		console.log(entries);
		return;
	}

	// if (entries[1] >= 0) {
	// 	console.log('ATTENTION: saving as "label 2"/fist!')
	// 	entries.push('fist')
	// }

	DB.push(entries) // global var

	fs.appendFile(DB_NAME, entries.join(';') + '\n', function(err) {
		if (err) console.log(err);
		else console.log(' saved img ' + entries[0]);
	});
}