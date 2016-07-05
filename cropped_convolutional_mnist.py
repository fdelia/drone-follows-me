# Copyright 2015 The TensorFlow Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ==============================================================================

"""Simple, end-to-end, LeNet-5-like convolutional MNIST model example.

This should achieve a test error of 0.7%. Please keep this model as simple and
linear as possible, it is meant as a tutorial for simple convolutional models.
Run with --self_test on the command line to execute a short self-test.
"""
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import gzip
import os
import sys
import time
import csv
from PIL import Image 

import numpy
from six.moves import urllib
from six.moves import xrange  # pylint: disable=redefined-builtin
import tensorflow as tf

import cv2

# remove alpha channel with this
# gm convert -background color -extent 0x0 +matte src.png dst.png

IMAGE_SIZE = 40
NUM_CHANNELS = 3
PIXEL_DEPTH = 255
NUM_LABELS = 2
VALIDATION_SIZE = 1000  # Size of the validation set.
TEST_SIZE = 100  # Size of test set (at the end), is new data for the network
SEED = 66478  # Set to None for random seed.
BATCH_SIZE = 50 # 64
NUM_EPOCHS = 100
EVAL_BATCH_SIZE = 50 #64
EVAL_FREQUENCY = 100  # Number of steps between evaluations.

tf.app.flags.DEFINE_boolean('run_only', True, 'only run with activation images')

tf.app.flags.DEFINE_boolean("self_test", False, "True if running a self test.")
FLAGS = tf.app.flags.FLAGS

def get_images_and_labels(num_images):
  images = []
  labels = []

  f = open('records_crop/_DB.csv', 'rb') 
  reader = csv.reader(f) 
  counter = 0
  for row in reader:   
      if counter >= num_images:
        break
      
      filename, label = row[0].split(';')
      if not filename or not label: 
        print ("Error: missing image filename or label")
        continue

      if not os.path.isfile('records_crop/'+filename):
        continue

      im = Image.open('records_crop/'+filename)  # .convert("L")  # Convert to greyscale
      im = numpy.asarray(im, numpy.float32)
      
      # queue = tf.train.string_input_producer([filename])
      # reader = tf.WholeFileReader()
      # _, contents = reader.read(queue)
      # contents = tf.read_file('records_crop/'+filename)
      # im = tf.image.decode_jpeg(contents, channels=3)
      # im = tf.cast(im, tf.float32)

      if im.shape != (IMAGE_SIZE, IMAGE_SIZE, NUM_CHANNELS):
        print('    wrong shape: '+filename)
        # print(im.shape)
      else:
        images = numpy.append(images, [im])
        labels = numpy.append(labels, [label])
        counter += 1

      if counter%100 == 0:
        print('   loaded '+str(counter)+' images')
      # augmentation
      # im2 = tf.image.flip_left_right(im)
      # images = numpy.append(images, [im2])
      # labels = numpy.append(labels, [label])
      # images = numpy.append(images, [tf.image.])
        

  print (len(images))
  images = (images - (PIXEL_DEPTH / 2.0)) / PIXEL_DEPTH
  images = images.reshape(counter, IMAGE_SIZE, IMAGE_SIZE, 3)

  labels = labels.astype(int)

  # images = tf.to_float(np.array(images))
  # labels = np.array(labels)

  return images, labels

def special_images():
  filenames = [f for f in os.listdir('records_crop_sp') if os.path.isfile(os.path.join('records_crop_sp', f))]
  images = []
  counter = 0
  for filename in filenames:
    print ('special: '+filename)
    im = Image.open('records_crop_sp/'+filename)  # .convert("L")  # Convert to greyscale
    im = numpy.asarray(im, numpy.float32)

    if im.shape != (IMAGE_SIZE, IMAGE_SIZE, NUM_CHANNELS):
        print('      wrong shape (special image): '+filename)
        print(im.shape)
    else:
      images = numpy.append(images, [im])
      counter += 1

  print ('special images found: ' + str((counter)))
  images = (images - (PIXEL_DEPTH / 2.0)) / PIXEL_DEPTH
  images = images.reshape(counter, IMAGE_SIZE, IMAGE_SIZE, NUM_CHANNELS)
  return images


def sliding_window(image, stepSize, windowSize):
  # slide a window across the image
  for y in xrange(0, image.shape[0], stepSize):
    for x in xrange(0, image.shape[1], stepSize):
      # yield the current window
      yield (x, y, image[y:y + windowSize[1], x:x + windowSize[0]])



def extract_labels(filename, num_images):
  """Extract the labels into a vector of int64 label IDs."""
  print('Extracting', filename)
  with gzip.open(filename) as bytestream:
    bytestream.read(8)
    buf = bytestream.read(1 * num_images)
    labels = numpy.frombuffer(buf, dtype=numpy.uint8).astype(numpy.int64)
  return labels


def fake_data(num_images):
  """Generate a fake dataset that matches the dimensions of MNIST."""
  data = numpy.ndarray(
      shape=(num_images, IMAGE_SIZE, IMAGE_SIZE, NUM_CHANNELS),
      dtype=numpy.float32)
  labels = numpy.zeros(shape=(num_images,), dtype=numpy.int64)
  for image in xrange(num_images):
    label = image % 2
    data[image, :, :, 0] = label - 0.5
    labels[image] = label
  return data, labels


def error_rate(predictions, labels):
  """Return the error rate based on dense predictions and sparse labels."""
  # print (numpy.argmax(predictions, 1))
  return 100.0 - (
      100.0 *
      numpy.sum(numpy.argmax(predictions, 1) == labels) /
      predictions.shape[0])


def main(argv=None):  # pylint: disable=unused-argument
  if FLAGS.self_test or FLAGS.run_only:
    print('Running self-test.')
    train_data, train_labels = fake_data(256)
    validation_data, validation_labels = fake_data(EVAL_BATCH_SIZE)
    test_data, test_labels = fake_data(EVAL_BATCH_SIZE)
    num_epochs = 1
  else:
    # Extract it into numpy arrays.
    train_data, train_labels = get_images_and_labels(20*1000)

    test_data = train_data[:TEST_SIZE, ...]
    test_labels = train_labels[:TEST_SIZE, ...]

    train_data = numpy.delete(train_data, range(1, TEST_SIZE), axis=0)
    train_labels = numpy.delete(train_labels, range(1, TEST_SIZE), axis=0)

    print('training labels: ' + str(len(train_labels)))
    print('test labels: ' + str(len(test_labels)))

    # Generate a validation set.
    validation_data = train_data[:VALIDATION_SIZE, ...]
    validation_labels = train_labels[:VALIDATION_SIZE]
    train_data = train_data[VALIDATION_SIZE:, ...]
    train_labels = train_labels[VALIDATION_SIZE:]
    num_epochs = NUM_EPOCHS
  train_size = train_labels.shape[0]

  # This is where training samples and labels are fed to the graph.
  # These placeholder nodes will be fed a batch of training data at each
  # training step using the {feed_dict} argument to the Run() call below.
  train_data_node = tf.placeholder(
      tf.float32,
      shape=(BATCH_SIZE, IMAGE_SIZE, IMAGE_SIZE, NUM_CHANNELS))
  train_labels_node = tf.placeholder(tf.int64, shape=(BATCH_SIZE,))
  eval_data = tf.placeholder(
      tf.float32,
      shape=(EVAL_BATCH_SIZE, IMAGE_SIZE, IMAGE_SIZE, NUM_CHANNELS))

  # The variables below hold all the trainable weights. They are passed an
  # initial value which will be assigned when we call:
  # {tf.initialize_all_variables().run()}
  conv1_weights = tf.Variable(
      tf.truncated_normal([5, 5, NUM_CHANNELS, 32],  # 5x5 filter, depth 32.
                          stddev=0.1,
                          seed=SEED))
  conv1_biases = tf.Variable(tf.zeros([32]))
  conv2_weights = tf.Variable(
      tf.truncated_normal([5, 5, 32, 64],
                          stddev=0.1,
                          seed=SEED))
  conv2_biases = tf.Variable(tf.constant(0.1, shape=[64]))
  fc1_weights = tf.Variable(  # fully connected, depth 512.
      tf.truncated_normal(
          [IMAGE_SIZE // 4 * IMAGE_SIZE // 4 * 64, 512],
          stddev=0.1,
          seed=SEED))
  fc1_biases = tf.Variable(tf.constant(0.1, shape=[512]))
  fc2_weights = tf.Variable(
      tf.truncated_normal([512, NUM_LABELS],
                          stddev=0.1,
                          seed=SEED))
  fc2_biases = tf.Variable(tf.constant(0.1, shape=[NUM_LABELS]))

  # We will replicate the model structure for the training subgraph, as well
  # as the evaluation subgraphs, while sharing the trainable parameters.
  def model(data, train=False):
    """The Model definition."""
    # 2D convolution, with 'SAME' padding (i.e. the output feature map has
    # the same size as the input). Note that {strides} is a 4D array whose
    # shape matches the data layout: [image index, y, x, depth].
    conv = tf.nn.conv2d(data,
                        conv1_weights,
                        strides=[1, 1, 1, 1],
                        padding='SAME')
    # Bias and rectified linear non-linearity.
    relu = tf.nn.relu(tf.nn.bias_add(conv, conv1_biases))
    # Max pooling. The kernel size spec {ksize} also follows the layout of
    # the data. Here we have a pooling window of 2, and a stride of 2.
    pool = tf.nn.max_pool(relu,
                          ksize=[1, 2, 2, 1],
                          strides=[1, 2, 2, 1],
                          padding='SAME')
    conv = tf.nn.conv2d(pool,
                        conv2_weights,
                        strides=[1, 1, 1, 1],
                        padding='SAME')
    relu = tf.nn.relu(tf.nn.bias_add(conv, conv2_biases))
    pool = tf.nn.max_pool(relu,
                          ksize=[1, 2, 2, 1],
                          strides=[1, 2, 2, 1],
                          padding='SAME')
    # Reshape the feature map cuboid into a 2D matrix to feed it to the
    # fully connected layers.
    pool_shape = pool.get_shape().as_list()
    reshape = tf.reshape(
        pool,
        [pool_shape[0], pool_shape[1] * pool_shape[2] * pool_shape[3]])
    # Fully connected layer. Note that the '+' operation automatically
    # broadcasts the biases.
    hidden = tf.nn.relu(tf.matmul(reshape, fc1_weights) + fc1_biases)
    # Add a 50% dropout during training only. Dropout also scales
    # activations such that no rescaling is needed at evaluation time.
    if train:
      hidden = tf.nn.dropout(hidden, 0.5, seed=SEED)
    return tf.matmul(hidden, fc2_weights) + fc2_biases

  # Training computation: logits + cross-entropy loss.
  logits = model(train_data_node, True)
  cross_entropy = tf.nn.sparse_softmax_cross_entropy_with_logits(
      logits, train_labels_node)
  # cross_entropy = tf.Print(cross_entropy, [cross_entropy], 'crossE ')
  loss = tf.reduce_mean(cross_entropy)

  # L2 regularization for the fully connected parameters.
  regularizers = (tf.nn.l2_loss(fc1_weights) + tf.nn.l2_loss(fc1_biases) +
                  tf.nn.l2_loss(fc2_weights) + tf.nn.l2_loss(fc2_biases))
  # Add the regularization term to the loss.
  loss += 5e-4 * regularizers

  # Optimizer: set up a variable that's incremented once per batch and
  # controls the learning rate decay.
  batch = tf.Variable(0)
  # Decay once per epoch, using an exponential schedule starting at 0.01.
  learning_rate = tf.train.exponential_decay(
      0.01,                # Base learning rate.
      batch * BATCH_SIZE,  # Current index into the dataset.
      train_size,          # Decay step.
      0.95,                # Decay rate.
      staircase=True)
  # Use simple momentum for the optimization.
  optimizer = tf.train.MomentumOptimizer(learning_rate,
                                         0.9).minimize(loss,
                                                       global_step=batch)

  # Predictions for the current training minibatch.
  # logits = tf.Print(logits, [logits], 'logits: ')
  train_prediction = tf.nn.softmax(logits)

  # Predictions for the test and validation, which we'll compute less often.
  eval_prediction = tf.nn.softmax(model(eval_data))

  # Small utility function to evaluate a dataset by feeding batches of data to
  # {eval_data} and pulling the results from {eval_predictions}.
  # Saves memory and enables this to run on smaller GPUs.
  def eval_in_batches(data, sess):
    """Get all predictions for a dataset by running it in small batches."""
    size = data.shape[0]
    if size < EVAL_BATCH_SIZE:
      raise ValueError("batch size for evals larger than dataset: %d" % size)
    predictions = numpy.ndarray(shape=(size, NUM_LABELS), dtype=numpy.float32)
    for begin in xrange(0, size, EVAL_BATCH_SIZE):
      end = begin + EVAL_BATCH_SIZE
      if end <= size:
        predictions[begin:end, :] = sess.run(
            eval_prediction,
            feed_dict={eval_data: data[begin:end, ...]})
      else:
        batch_predictions = sess.run(
            eval_prediction,
            feed_dict={eval_data: data[-EVAL_BATCH_SIZE:, ...]})
        predictions[begin:, :] = batch_predictions[begin - size:, :]
    return predictions

  # Create a local session to run the training.
  start_time = time.time()
  saver = tf.train.Saver()

  with tf.Session() as sess:
    # Run all the initializers to prepare the trainable parameters.
    tf.initialize_all_variables().run()
    print('Initialized!')


    # Run only
    if FLAGS.run_only:
      print ('load checkpoint')
      saver.restore(sess, "conv_mnist_model.ckpt")

      eval_data = tf.placeholder(tf.float32, shape=(1, IMAGE_SIZE, IMAGE_SIZE, NUM_CHANNELS))
      eval_prediction = tf.nn.softmax(model(eval_data))

      # print('special 40x40 images')
      # special_data = special_images()
      # for data in special_data:
      #   pred_spec = sess.run(eval_prediction, feed_dict={eval_data: [data]})
      #   print(pred_spec.argmax(axis=1))


      def test_image_for_hand(filename):
        image = cv2.imread('records/'+filename)

        def chunks(l, n):
          for i in range(0, len(l), n):
            yield l[i:i+n]



        (winW, winH) = (40, 40)

        clone = image.copy()
        for (x, y, window) in sliding_window(image, stepSize=16, windowSize=(winW, winH)):
          if window.shape[0] != winH or window.shape[1] != winW:
            continue
       
          # cv2.imshow('test', window)
          # cv2.waitKey(1)
          im2 = numpy.asarray(window, numpy.float32).flatten()
          im2 = chunks(im2, 3)

          new_im2 = []
          for rgb in im2:
            new_im2.append(rgb[::-1])

          data = numpy.asarray(new_im2, numpy.float32).reshape(IMAGE_SIZE, IMAGE_SIZE, NUM_CHANNELS)

          # data = numpy.asarray(window, numpy.float32)
          data = (data - (PIXEL_DEPTH / 2.0)) / PIXEL_DEPTH
          data = data.reshape(IMAGE_SIZE, IMAGE_SIZE, 3)



          predictions = sess.run(eval_prediction, feed_dict={eval_data: [data]})
          # print (predictions)
          # time.sleep(2)
          if predictions[0][1] > predictions[0][0]:
            # clone = image.copy()
            cv2.rectangle(clone, (x, y), (x + winW, y + winH), (0, 255*predictions[0][1], 0), 1)

        cv2.imshow('search for hand in '+filename, clone)
        cv2.waitKey(1)
        time.sleep(3)
       



      fs = ['img_116.5.5_18.40.25.305.png', 'img_142.png', 'img_14.4.4.73.png', 'img_14.4.15.145.png', 'img_11.46.12.78.png', 'img_12.53.10.112.png', 'img_14.4.7.97.png']
      for filename in fs:
        print (filename)
        test_image_for_hand(filename)



    # Train
    else:
      # Loop through training steps.
      for step in xrange(int(num_epochs * train_size) // BATCH_SIZE):
        # Compute the offset of the current minibatch in the data.
        # Note that we could use better randomization across epochs.
        offset = (step * BATCH_SIZE) % (train_size - BATCH_SIZE)
        batch_data = train_data[offset:(offset + BATCH_SIZE), ...]
        batch_labels = train_labels[offset:(offset + BATCH_SIZE)]
        # This dictionary maps the batch data (as a numpy array) to the
        # node in the graph it should be fed to.
        feed_dict = {train_data_node: batch_data,
                     train_labels_node: batch_labels}
        # Run the graph and fetch some of the nodes.
        _, l, lr, predictions = sess.run(
            [optimizer, loss, learning_rate, train_prediction],
            feed_dict=feed_dict)
        if step % EVAL_FREQUENCY == 0:
          elapsed_time = time.time() - start_time
          start_time = time.time()

          print('Step %d (epoch %.2f), %.1f ms' %
                (step, float(step) * BATCH_SIZE / train_size,
                 1000 * elapsed_time / EVAL_FREQUENCY))
          print('Minibatch loss: %.3f, learning rate: %.6f' % (l, lr))
          print('Minibatch error: %.1f%%' % error_rate(predictions, batch_labels))
          print('Validation error: %.1f%%' % error_rate(
              eval_in_batches(validation_data, sess), validation_labels))
          sys.stdout.flush()
      # Finally print the result!
      test_error = error_rate(eval_in_batches(test_data, sess), test_labels)
      print('Test error: %.1f%%' % test_error)

      save_path = saver.save(sess, "conv_mnist_model.ckpt")
      print("Model saved in file: %s" % save_path)

      if FLAGS.self_test:
        print('test_error', test_error)
        assert test_error == 0.0, 'expected 0.0 test_error, got %.2f' % (
            test_error,)

      

if __name__ == '__main__':
  tf.app.run()
