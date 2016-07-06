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
	filename, dbX, dbY = row
	dbX = int(dbX); dbY = int(dbY)

  	if not filename or dbX is None or dbY is None:
  		print ('something is missing at ' + row)
  		continue

  	if not os.path.isfile('records/' + filename):
  		print ('file missing: ' + filename)
  		continue

  	img = cv2.imread('records/' + filename)

  	if dbX >= 0 and dbY >= 0:
  		x = dbX / 5 - 20
  		y = dbY / 5 - 20

  		if x >= 128 - winX: x = 128 - winX - 1
  		if y >= 72 - winY: y = 72 - winY - 1

  		crop = img[y : y + winY, x : x + winX]
  		cv2.imwrite('records_crop/1/'+filename, crop)

  	else:
  		x = 44
  		y = 16

  		crop = img[y : y + winY, x : x + winX]
  		cv2.imwrite('records_crop/0/'+filename, crop)

  		x = 84
  		y = 30

		crop = img[y : y + winY, x : x + winX]
  		cv2.imwrite('records_crop/0/2_'+filename, crop)
