#
# Crop 40x40 parts out of records/ images for neural network training.
# Save the crops into records_crop/
#

import os
import csv
import cv2

f = open('records_crop/_DB.csv', 'rb') 
  reader = csv.reader(f) 
  counter = 0
  for row in reader:
  	filename, x, y = row.split(';')

  	if not filename or not x or not y:
  		print ('something is missing at '+row)
  		continue


