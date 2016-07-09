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
  special_label = None
  # activate this because of memory problem (??? cv2.imread returns None), first do one half then the other
  if counter < 5000:
    counter += 1
    continue
    
  if len(row) == 3:
    filename, dbX, dbY = row
  elif len(row) == 4:
    filename, dbX, dbY, special_label = row
  else:
    print('row length is wrong, leave out')
    print row
    continue

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



  # hand
  if dbX >= 0 and dbY >= 0:
    # special face files
    if filename.find('img_116.6.7_21') == 0:
      # we will take a 72x72 part and resize it to 40x40
      print ('special face image detected')
      x = dbX / 5 - 36
      y = 0
      crop = img[y : y + 72, x : x + 72]
      crop = cv2.resize(crop, (40, 40))
      cv2.imwrite('records_crop/0/'+filename, crop) 
      continue      

    x = dbX / 5 - winX/2
    y = dbY / 5 - winY/2

    if x >= 128 - winX: x = 128 - winX 
    if y >= 72 - winY: y = 72 - winY    

    crop = img[y : y + winY, x : x + winX]
    
    if special_label is None:
      cv2.imwrite('records_crop/1/'+filename, crop)
    elif special_label == 'fist':
      print ('fist image detected')
      cv2.imwrite('records_crop/2/'+filename, crop)



  # no hand
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


