var arDrone = require('ar-drone');
var client = arDrone.createClient();
client.createRepl();
var fs = require('fs');


console.log('battery: ' + client.battery())

var imgCounter = 1;

var pngStream = client.getPngStream();
pngStream.on('data', function(data) {
	var d = new Date();
	var cc = d.getYear().toString() + '.' + d.getMonth().toString() + '.' + d.getDate().toString() + '_' + d.getHours().toString() + '.' + d.getMinutes().toString() + '.' + d.getSeconds().toString() + '.' + imgCounter;
	fs.writeFile("./records/img_" + cc + '.png', data, function(err) {
		if (err) {
			return console.log(err);
		} else {
			// console.log("png saved");
			if (imgCounter == 1) console.log('\n***\n*** START! ***\n***')
			imgCounter++;
		}

	});
});