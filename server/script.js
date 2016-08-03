/*
on click on image:
set parameters and imagename
send in /set/?... request

*/
$(function() {
	// console.log(url('?'));
	// var imageName = url('?').imageName;
	// var imagePath = '../records/' + imageName;
	var currentImage = '';
	var newImages = url('?').newImages.split(',');
	console.log(newImages);
	setImage(newImages.shift());
	
	// preload images
	var imgArray = []
	for (var i=0; i<newImages.length; i++){
		imgArray[i] = new Image();
		var imageName = newImages[i];
		imgArray[i].src = '../records/' + imageName;
	}
	console.log('preloaded images')


	$('#image').click(function(e) {
		console.log(e.pageX + ' ' + e.pageY);
		// window.location.href = '/set/?imageName=' + imageName + '&x=' + e.pageX + '&y=' + e.pageY;

		// if (newImages.length > 0) {
		// save data to db
		//window.location.href = '/set/?hasImages=true&imageName=' + currentImage + '&x=' + e.pageX + '&y=' + e.pageY;	
		saveImageData(currentImage, e.pageX, e.pageY);
		if (newImages.length > 0) setImage(newImages.shift());
		// } else //window.location.href = '/set/?imageName=' + currentImage + '&x=' + e.pageX + '&y=' + e.pageY;
		// saveImageData(currentImage, e.pageX, e.pageY);
	});

	function setImage(imageName) {
		var imagePath = '../records/' + imageName;
		// console.log(imagePath);
		currentImage = imageName;
		$('#image').attr('src', imagePath);
	}

	function saveImageData(imageName, x, y) {
		console.log('save '+imageName + ' '+x +'/'+y);
		// $.get('/set/?')
		if (newImages.length > 0)
			window.location.href = '/set/?hasImages=true&imageName=' + imageName + '&x=' + x + '&y=' + y;
		else
			window.location.href = '/set/?imageName=' + imageName + '&x=' + x + '&y=' + y;
	}

	// just for information
	$(document).mousemove(function(e) {
		$('#mouseCoord').html('x/y: ' + e.pageX + ' / ' + e.pageY);
	});

	$(document).keydown(function(e) {
		// SPACE -  if there is no hand
		if (e.which === 32) {
			// window.location.href = '/set/?imageName=' + currentImage + '&x=-1&y=-1';
			saveImageData(currentImage, -1, -1);
			if (newImages.length > 0) setImage(newImages.shift());
		}
		// N - next
		if (e.which === 78) {
			window.location.href = '/set/';
		}
		console.log(e.which);
	});
});