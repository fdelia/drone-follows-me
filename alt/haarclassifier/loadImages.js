const DB_NAME = '../records_crop/_DB.csv';
var helpers = require('../DroneHelpers.js')
var fs = require('fs')

DBdata = helpers.loadDatabase(DB_NAME);

DBdata.forEach((v) =>{
	var label = v[1]
	var filename = v[0]
	var pathFrom = '../records_crop/'+filename
	var pathTo = './images/'+label+'/'+filename

	fs.access(pathFrom, fs.R_OK, (err) => {
		if (! err){
			fs.createReadStream(pathFrom).pipe(fs.createWriteStream(pathTo))
		} else
			console.log('cound not read '+filename)
	})
})