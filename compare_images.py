#
# The idea of this script is to remove images that are too similar.
# I want to achieve that the image database is more equally diversified 
# to balance bias originating from the image production.
#

#
# TODO:
# save the names of the removed images to remove them instantly next time
# since they are produced again with the next cropping and the comparing takes very long
#

from skimage import img_as_float, io
from skimage.measure import compare_ssim as ssim
import random
import os


def compare_in_path(path):
	filenames = [f for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))]

	# shuffle because I started the script several times without finishing the process
	random.shuffle(filenames)

	counter = 0
	for idx, f1 in enumerate(filenames):

		# don't compare two files twice
		for f2 in filenames[(idx+1):]:
			a1 = io.imread(os.path.join(path, f1))
			a2 = io.imread(os.path.join(path, f2))

			s = ssim(a1, a2, multichannel=True)

			# 0.5 seems reasonable, but one could try around here (maybe 0.4)
			if s > 0.5:
				print(f1 + '   ' + f2 + '\t\t' + str(s))

				# remove the second file
				os.remove(os.path.join(path, f2))

				filenames.remove(f2)

		
		counter += 1
		print ('  * ' + str(counter) + ' *  ' )
		if counter > 100: break




compare_in_path('records_crop/0/')
# compare_in_path('records_crop/0_gen/')
# compare_in_path('records_crop/1/')
# compare_in_path('records_crop/2/')
