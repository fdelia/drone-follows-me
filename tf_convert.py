import imageflow
import csv
from PIL import Image 
import numpy as np
import tensorflow as tf
import my_cifar

# import sys    

# f = open(sys.argv[1], 'rb') 
# images = []
# labels = []

# try:
#     reader = csv.reader(f)  

#     for row in reader:   
#         img_name, label = row[0].split(';')
#         if not img_name or not label: 
#         	print "Error: missing image filename or label"
#         	continue

#         images.append(img_name)
#         labels.append(label)

# finally:
#     f.close()

#     print "images: "+ str(len(images))
#     print "labels: "+str(len(labels))

#     imageflow.convert_images(images, labels, 'tensor_cropped')

flags = tf.app.flags
FLAGS = tf.app.flags.FLAGS
flags.DEFINE_integer('batch_size', 1, 'Batch size.')
tf.app.flags.DEFINE_boolean('log_device_placement', False,
                            """Whether to log device placement.""")
tf.app.flags.DEFINE_string('train_dirr', 'tmp/log',
                           """Directory where to write event logs """
                           """and checkpoint.""")
tf.app.flags.DEFINE_string('eval_data', 'test',
                           """Either 'test' or 'train_eval'.""")
tf.app.flags.DEFINE_string('checkpoint_dir', 'tmp/ckpt',
                           """Directory where to read model checkpoints.""")
batch_size = 1
IMAGE_PIXELS = 40 * 40 * 3

def get_images_and_labels():
	images = []
	labels = []

	f = open('records_crop/_DB_small.csv', 'rb') 
	reader = csv.reader(f)  
	for row in reader:   
	    filename, label = row[0].split(';')
	    if not filename or not label: 
	    	print "Error: missing image filename or label"
	    	continue

	    im = Image.open('records_crop/'+filename)  # .convert("L")  # Convert to greyscale
	    im = np.asarray(im, np.uint8)
	    # images.append([filename, im])
	    images.append(im)
	    labels.append(label)

	images = tf.to_float(np.array(images))
	labels = np.array(labels)

	return images, labels


def placeholder_inputs(batch_size):
  """Generate placeholder variables to represent the the input tensors.
  These placeholders are used as inputs by the rest of the model building
  code and will be fed from the downloaded ckpt in the .run() loop, below.
  Args:
    batch_size: The batch size will be baked into both placeholders.
  Returns:
    images_placeholder: Images placeholder.
    labels_placeholder: Labels placeholder.
  """
  # Note that the shapes of the placeholders match the shapes of the full
  # image and label tensors, except the first dimension is now batch_size
  # rather than the full size of the train or test ckpt sets.
  # batch_size = -1
  images_placeholder = tf.placeholder(tf.float32, shape=(batch_size,
                                                         IMAGE_PIXELS))
  # 32, 32, 3))
  labels_placeholder = tf.placeholder(tf.int32, shape=batch_size)

  return images_placeholder, labels_placeholder


def train(re_train=True):
	"""Train CIFAR-10 for a number of steps."""
	images, labels = get_images_and_labels()

	# print "found " + str(len(images)) + " images"
	train_size = 5	
	train_images = images[:train_size, :, :, :]
	train_labels = labels[:train_size]

	val_images = images[train_size:, :, :, :]
	val_labels = labels[train_size:]

  	with tf.Graph().as_default():
		global_step = tf.Variable(0, trainable=False)

		images_placeholder, labels_placeholder = placeholder_inputs(FLAGS.batch_size)

		print (images.get_shape(), val_images.get_shape())
		logits = my_cifar.inference(images_placeholder)

		# Calculate loss.
		loss = my_cifar.loss(logits, labels_placeholder)

		# Build a Graph that trains the model with one batch of examples and
		# updates the model parameters.
		train_op = my_cifar.training(loss, global_step)

		# Calculate accuracy #
		acc, n_correct = my_cifar.evaluation(logits, labels_placeholder)

		# Create a saver.
		saver = tf.train.Saver()

		tf.scalar_summary('Acc', acc)
		# tf.scalar_summary('Val Acc', acc_val)
		tf.scalar_summary('Loss', loss)
		tf.image_summary('Images', tf.reshape(images, shape=[-1, 40, 40, 3]), max_images=10)
		tf.image_summary('Val Images', tf.reshape(val_images, shape=[-1, 40, 40, 3]), max_images=10)

		# Build the summary operation based on the TF collection of Summaries.
		summary_op = tf.merge_all_summaries()

		# Build an initialization operation to run below.
		init = tf.initialize_all_variables()

		# Start running operations on the Graph.
		# NUM_CORES = 2  # Choose how many cores to use.
		sess = tf.Session(config=tf.ConfigProto(log_device_placement=FLAGS.log_device_placement, ))
		# inter_op_parallelism_threads=NUM_CORES,
		# intra_op_parallelism_threads=NUM_CORES))
		sess.run(init)

		# Write all terminal output results here
		val_f = open("tmp/val.txt", "ab")

		# Start the queue runners.
		coord = tf.train.Coordinator()
		threads = tf.train.start_queue_runners(sess=sess, coord=coord)

		summary_writer = tf.train.SummaryWriter(FLAGS.train_dirr,
                                    graph_def=sess.graph_def)


		# ckpt = tf.train.get_checkpoint_state(checkpoint_dir=FLAGS.checkpoint_dir)
		# print ckpt.model_checkpoint_path
		# if ckpt and ckpt.model_checkpoint_path:
		# 	saver.restore(sess, ckpt.model_checkpoint_path)
		# print('Restored!')

		for i in range(10):
			images_val_r, labels_val_r = sess.run([val_images, val_labels])
			val_feed = {images_placeholder: images_val_r,
			            labels_placeholder: labels_val_r}

		tf.scalar_summary('Acc', acc)

		print('Calculating Acc: ')

		acc_r = sess.run(acc, feed_dict=val_feed)
		print(acc_r)

		coord.join(threads)
		sess.close()




def main(argv):
	# images, labels = get_images_and_labels()

	# print "found " + str(len(images)) + " images"
	# train_size = 5	
	# train_images = images[:train_size, :, :, :]
	# train_labels = labels[:train_size]

	# validation_images = images[train_size:, :, :, :]
	# validation_labels = labels[train_size:]

	train()
	# imageflow.convert_images(train_images, train_labels, 'train')


main([])