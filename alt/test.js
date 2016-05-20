function getAvgs(arch, maxBack) {
	if (maxBack == 0) maxBack = 10;
	maxBack = maxBack < arch.length ? maxBack : arch.length;

	var faceAvgsWidths = [];
	console.log('archive: ' + arch.length)

	if (arch.length > 0) {
		console.log('faces: ' + arch[0].length)

		for (var f=0; f<arch[0].length; f++){
			faceAvgsWidths[f] = 0;
		}
		
		for (var i=0; i<maxBack; i++){
			console.log('steps back: '+ (i));

			for (var f=0; f<arch[i].length; f++){
				var face = arch[i][f];
				// console.log(' face '+f); console.log(face);

				faceAvgsWidths[f] += face.width;
			}
		}

		for (var f=0; f<arch[0].length; f++){
			faceAvgsWidths[f] /= maxBack;
			faceAvgsWidths[f] = Math.round(faceAvgsWidths[f]);
		}


	}
	return faceAvgsWidths;
}

var arch = [];
var f = [{
	x: 205,
	y: 0,
	width: 246,
	height: 246
}, {
	x: 205,
	y: 0,
	width: 246,
	height: 246
}];
var g = [{
	x: 205,
	y: 0,
	width: 346,
	height: 246
}, {
	x: 205,
	y: 0,
	width: 246,
	height: 246
}];
arch.push(f);
arch.push(f);
arch.push(g);
console.log(getAvgs(arch, 10));