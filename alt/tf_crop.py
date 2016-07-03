import tensorflow as tf
import sys

# filename_queue = tf.train.string_input_producer(['records_crop/2_img_116.4.22_18.42.50.224.png 0', 'records_crop/2_img_8.png 0', 'records_crop/img_116.4.20_10.33.55.206.png 1'])
filenames = ['records_crop/2_img_116.4.22_18.42.50.224.png 0', 'records_crop/2_img_8.png 0', 'records_crop/img_116.4.20_10.33.55.206.png 1']

def read_image(filename_queue):
	class CropRecord(object):
		pass
	result = CropRecord()

	label_bytes = 1
	result.height = 40
	result.width = 40
	result.depth = 3
	# image_bytes = result.height * result.width * result.depth
	# record_bytes = label_bytes + image_bytes

	# Import own files
	# reader = tf.WholeFileReader()
	reader = tf.read_file()
	key, value = reader.read(filename_queue)

	# print value
	# result.label = 

	my_img = tf.image.decode_png(value)
	# print tf.decode_raw(value, tf.uint8)
	label = tf.cast(0, tf.int8)

	coord = tf.train.Coordinator()
	threads = tf.train.start_queue_runners(coord=coord)



	init_op = tf.initialize_all_variables()
	# with tf.Session() as sess:
	# 	sess.run(init_op)
		# image = my_img.eval(session=sess)
	# coord = tf.train.Coordinator()
	# threads = tf

	# print(image.shape)
	# Image.show(Image.fromarray(np.asarray(image)))

	# coord.request_stop()
	# coord.join(threads)

# read_image(filename_queue)

sess = tf.InteractiveSession()

def read_my_file_format(filename_and_label_tensor):
  """Consumes a single filename and label as a ' '-delimited string.

  Args:
    filename_and_label_tensor: A scalar string tensor.

  Returns:
    Two tensors: the decoded image, and the string label.
  """
  filename, label = tf.decode_csv(filename_and_label_tensor, [[""], [""]], " ")
  # print filename.eval()
  # print label.eval()

  file_contents = tf.read_file(filename)
  example = tf.image.decode_png(file_contents)
  return example, label



for f in filenames:
	image, label = read_my_file_format(f)
	image = tf.random_crop(image, [40, 40, 3])
	image_batch, label_batch = tf.train.batch([image, label], batch_size=1)
	print image_batch.eval()
	print label_batch.eval()




