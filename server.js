const DB_NAME = 'database.csv';



var fs = require('fs');
var express = require('express');
var app = express();
var helpers = require('./DroneHelpers.js');

app.use(express.static(__dirname + '/'));
app.listen(process.env.PORT || 3000)

app.get('/set/', function(req, res) {
	console.log(' ')
	console.log(req.query);
	// Attention: asynchronous, could load same image again!
	if (req.query.imageName && req.query.x !== undefined && req.query.y !== undefined) addToDatabase([req.query.imageName, req.query.x, req.query.y])
	// console.log('add image with params to database, send next picture');

	var DB = helpers.loadDatabase(DB_NAME);
	var imagesInDB = DB.map(function(entry) {
		return entry[0];
	});
	var imagesInRecord = fs.readdirSync('records/').filter(hiddenFilesAndDirs);

	// remove images which are in DB
	var imagesNotInDB = imagesInRecord.filter(notInDB);

	console.log('progress: ' + (Math.round(imagesInDB.length / imagesInRecord.length * 1000) / 10) + ' %  ' + 'images left: ' + imagesNotInDB.length)
		// console.log('images left: ' + imagesNotInDB.length);
		// var newImage = imagesNotInDB[Math.floor(Math.random() * imagesNotInDB.length)];

	// var newImage = imagesNotInDB[0];
	// // if save is too slow, don't use the same image again
	// if (newImage == req.query.imageName) newImage = imagesNotInDB[1];
	// res.redirect('/server/index.html?imageName=' + newImage + '&newImages='+newImages.join(','));

	if (!req.query.hasImages) {
		// load new images
		var newImages = [];
		for (var i = 0; i < 20; i++) {
			// if save is too slow, don't use the same image again
			if (imagesNotInDB[i] && imagesNotInDB[i] != req.query.imageName) newImages.push(imagesNotInDB[i]);
		}
		res.redirect('/server/index.html?newImages=' + newImages.join(','));
	}



	function notInDB(name) {
		return imagesInDB.indexOf(name) == -1;
	}

	function hiddenFilesAndDirs(name) {
		if (name[0] == '.') return false;
		if (name.indexOf('.png') > 0) return true;
		return false;
	}
});

// function loadDatabase() {
// 	var lines = fs.readFileSync(DB_NAME, 'utf8').split('\n');
// 	console.log('found ' + lines.length + ' rows in database');

// 	var data = lines.map(function(line) {
// 		return line.split(';');
// 	});

// 	return data;
// }

function addToDatabase(entries) {
	if (!entries[0]) {
		console.log('error, entries are: ');
		console.log(entries);
		return;
	}
	fs.appendFile(DB_NAME, entries.join(';') + '\n', function(err) {
		if (err) console.log(err);
		else console.log(' saved img ' + entries[0]);
	});
}