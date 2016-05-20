var opencv = require('opencv')

var arDrone = require('ar-drone');
var client = arDrone.createClient();
client.createRepl();

console.log('battery: ' + client.battery())
console.log(' ')

const FACE_MOV_MARGIN = 0.05;


var facesArchive = [];
var noFacesCounter = 0;

// TODO sometimes NaN emerges
function getAvgs(arch, maxBack) {
	if (maxBack == 0) maxBack = 10;
	maxBack = maxBack < arch.length ? maxBack : arch.length;
	var faceAvgsWidths = [];

	if (arch.length > 0) {
		for (var f=0; f<arch[0].length; f++){
			faceAvgsWidths[f] = 0;
		}
		
		for (var i=0; i<maxBack; i++){
			for (var f=0; f<arch[i].length; f++){
				var face = arch[i][f];
				// console.log(' face '+f); console.log(face);

				// faceAvgsWidths[f] += face.width;
				faceAvgsWidths[f] += face.height; // trying with heights
			}
		}

		for (var f=0; f<arch[0].length; f++){
			faceAvgsWidths[f] /= maxBack;
			faceAvgsWidths[f] = Math.round(faceAvgsWidths[f]);
		}


	}
	return faceAvgsWidths;
}



var pngStream = client.getPngStream();
pngStream.on('data', function(data) {
	// console.log(data);

	require("fs").writeFile("out.png", data, 'base64', function(err) {
		if (err) console.log(err);

		// opencv.readImage("./out.png", function(err, im) {
		opencv.readImage(data, function(err, im) {
			if (!im) console.log('image not found by opencv')

			im.detectObject(opencv.FACE_CASCADE, {}, function(err, faces) {
				// console.log('faces: '+faces)

				if (!faces || faces.length === 0){
					noFacesCounter++;	
					if (noFacesCounter >= 3) facesArchive = []; // reset faces

					console.log('no faces found');
				} 
				else {
					noFacesCounter = 0;

					// calculate average widths/heights and compare them
					var faceOldAvgs = getAvgs(facesArchive, 10);

					facesArchive.unshift(faces);
					if (facesArchive.length > 15) facesArchive.pop(); // remove oldest

					var faceNewAvgs = getAvgs(facesArchive, 3);

					if (faceOldAvgs.length && faceNewAvgs.length){
						for (var f=0; f<faceNewAvgs.length; f++){
							var widthOld = faceOldAvgs[f], widthNew = faceNewAvgs[f];

							if (widthNew * (1+FACE_MOV_MARGIN) < widthOld){
								// console.log(f + ' ist weiter weg')
								console.log('     -----')
							}

							if (widthNew > widthOld * (1+FACE_MOV_MARGIN)){
								// console.log(f + ' ist näher')
								console.log('+++++')
							}
						}
					}



					for (var i = 0; i < faces.length; i++) {
						var x = faces[i]
							// console.log(x);
						im.ellipse(x.x + x.width / 2, x.y + x.height / 2, x.width / 2, x.height / 2);
					}

					
				}

				im.save('./out2.png');
			});
		})

	});
});