/*
on click on image:
set parameters and imagename
send in /set/?... request

*/
$(function() {
	var currentImage = '';

	getAndLoadImages();


	$('#image').click(function(e) {
		// console.log(e.pageX + ' ' + e.pageY);
		saveImageData(currentImage, e.pageX, e.pageY);
	});

	function setImage(imageName) {
		var imagePath = '../records/' + imageName;
		// console.log(imagePath);
		currentImage = imageName;
		$('#image').attr('src', imagePath);
	}

	function saveImageData(imageName, x, y) {
		// console.log('save ' + imageName + ' ' + x + '/' + y);
		$.get('/saveImageCoords/', {
			imageName: imageName,
			x: x,
			y: y
		}).done((res) => {
			console.log('saved ' + imageName);
			if (res) $('#imageCounter').text(res);
		});

		if (newImages.length > 0) 	setImage(newImages.shift());
		else 						getAndLoadImages();
		
	}

	function getAndLoadImages() {
		$.get('/getImageNames/', {
			number: 20
		}).done((data) => {
			console.log('loaded image names, got ' + parseInt(data.length) + ' images');
			// console.log(data);
			newImages = data;
			setImage(newImages.shift());

			// preload images
			var imgArray = []
			for (var i = 0; i < newImages.length; i++) {
				imgArray[i] = new Image();
				var imageName = newImages[i];
				imgArray[i].src = '../records/' + imageName;
			}
			console.log('preloaded images')
		});
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
			// if (newImages.length > 0) setImage(newImages.shift());
		}
		// N - next
		if (e.which === 78) {
			window.location.href = '/set/';
		}
		console.log(e.which);
	});
});