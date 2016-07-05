var fs = require('fs'),
	gm = require('gm').subClass({
		imageMagick: true
	});

var helpers = require('../DroneHelpers.js')

const DB_NAME = '../database.csv';
const IMAGE_WIDTH = 128; // 128
const IMAGE_HEIGHT = 72; // 72

