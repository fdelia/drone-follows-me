#
# Crop 40x40 parts out of records/ images for neural network training.
# Save the crops into records_crop/label/
#

import os
import csv
import cv2

IMAGE_SIZE = 40
(winX, winY) = (IMAGE_SIZE, IMAGE_SIZE)

f = open('database.csv', 'rb') 
reader = csv.reader(f, delimiter=';') 
counter = 0
for row in reader:
	# activate this because of memory problem (??? cv2.imread returns None), first do one half then the other
	# if counter < 4000:
	# 	counter += 1
	# 	continue
		
	filename, dbX, dbY = row

  	if not filename or dbX is None or dbY is None:
  		print ('something is missing at ' + row)
  		continue

	dbX = int(dbX); dbY = int(dbY)
  	path = 'records/' + filename
  	if not os.path.isfile(path):
  		print ('file missing: ' + filename)
  		continue

  	img = cv2.imread(path)

  	if img is None:
  		print ('"' + filename + '" is None ? ')
  		continue

  	if (img.shape != (72, 128, 3)):
  		print ('wrong shape for image '+filename)
  		continue

  	if dbX >= 0 and dbY >= 0:
  		x = dbX / 5 - 20
  		y = dbY / 5 - 20

  		if x >= 128 - winX: x = 128 - winX - 1
  		if y >= 72 - winY: y = 72 - winY - 1

  		crop = img[y : y + winY, x : x + winX]
  		cv2.imwrite('records_crop/1/'+filename, crop)

  	else:
  		if filename.find('img_116.6.6_19.12') == 0:
  			print ('face image detected')
  			x = 39
  			y = 15

  			crop = img[y : y + winY, x : x + winX]
	  		cv2.imwrite('records_crop/0/'+filename, crop)

	  		x = 56
	  		y = 20

	  		crop = img[y : y + winY, x : x + winX]
	  		cv2.imwrite('records_crop/0/3_'+filename, crop)

	  	else:
	  		x = 44
	  		y = 16

	  		crop = img[y : y + winY, x : x + winX]
	  		cv2.imwrite('records_crop/0/'+filename, crop)

	  		x = 84
	  		y = 30

			crop = img[y : y + winY, x : x + winX]
	  		cv2.imwrite('records_crop/0/2_'+filename, crop)


