'use strict';

var cv = require('opencv')

var images = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg']

for (var iii = 0; iii < images.length; iii++) {
	recognizeHand('img/' + images[iii]);
}



var lowThresh = 0;
var highThresh = 100;
var nIters = 2;
var minArea = 2000;
var maxArea = 1200;

var GREEN = [0, 255, 0]; // B, G, R
var WHITE = [255, 255, 255]; // B, G, R
var RED = [0, 0, 255]; // B, G, R


function recognizeHand(imageName) {
	console.log(' ');
	console.log(imageName);

	cv.readImage(imageName, function(err, im) {
		if (err) throw err;
		width = im.width()
		height = im.height()
		if (width < 1 || height < 1) throw new Error('Image has no size');

		var org = im.copy();
		console.log(cv);
		// cv.BackgroundSubtractor.createMOG
		
		// im.cvtColor('CV_BGR2GRAY');
		im.gaussianBlur([7, 7])

		var lower_threshold = [50, 50, 120];
		var upper_threshold = [130, 130, 255];
		im.inRange(lower_threshold, upper_threshold);


		var copy = im.copy();
		var contours = copy.findContours();
		// console.log('contours: '+contours.size())

		for (var c = 0; c < contours.size(); ++c) {
			if (contours.area(c) <= 5000) continue;

			console.log("Contour " + c + ' , area: ' + contours.area(c));
			// console.log(contours.boundingRect(c));

			var arcLength = contours.arcLength(c, true);
			contours.approxPolyDP(c, 0.01 * arcLength, true);
			console.log(arcLength);


			org.drawContour(contours, c, GREEN);
			im.drawContour(contours, c, GREEN);

		}


		org.save(imageName + ' c.jpg');

	});
}