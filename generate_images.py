

import cv2
import numpy as np
import time
import math
import random


DIVIDER = 12

width = 40
height = 40
STEP = 4


def generate_point_color(i):
	if i <= 0:
		raise Exception('i given to small in pixColor')

	divider = DIVIDER

	r = math.floor(i / divider / divider)
	i = i % (divider * divider)
	g = math.floor(i / divider)
	i = i % divider
	b = i

	num_pixels = float(255) / DIVIDER
	r *= num_pixels
	g *= num_pixels
	b *= num_pixels

	return (r, g, b)


def generate_random_color():
	start = random.randint(0, 150)
	r = float(random.randint(start, 255))
	g = float(random.randint(start, 255))
	b = float(random.randint(start, 255))

	return (r, g, b)



num_points = (DIVIDER)**3
colors = []
for i in range(1, num_points):
	# color = generate_point_color(i)
	color = generate_random_color()
	colors.append(color)


def generate_image():
	random.shuffle(colors)

	pixels = [[(0, 0, 0) for x in range(width)] for y in range(height)] 
	p = 0
	for w in range(0, int(width / STEP), 1):
		for h in range(0, int(height / STEP), 1):
			rgb = colors[p]

			p += 1
			if p >= len(colors): p = 0

			for i in range(0, STEP, 1):
				for j in range(0, STEP, 1):
					pixels[w*STEP + i][h*STEP + j] = rgb
					# print ( str(w*STEP+i) + ' / ' + str(h*STEP + j))

	return pixels


# print (pixels[10][10])
# print('\n'.join([''.join(['{:4}'.format(item) for item in row]) 
#       for row in pixels]))

for i in range(0, 1000):
	pixels = generate_image()
	pixels = np.asarray(pixels, np.uint8).reshape((width, height, 3))
	# cv2.imshow('image', pixels)
	# cv2.waitKey(1)
	# time.sleep(0.2)

	filename = str(i) + '.png'
	cv2.imwrite('records_crop/0_gen/'+filename, pixels)        

cv2.destroyAllWindows()



