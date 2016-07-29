# Drone "dog"

## Idea

The idea is to make a drone follow a hand showed to the drone. It should also understand simple gestures (like open hand or fist) to control the movement.

*Disclaimer: This is work in progress. The code is messy to some extent.*

## Does it work?

Yes. It recognices the position of the hand pretty good, even against the light and under bad light conditions. Gesture recognicition is still under process but already works ok. The controller which gives flight commands to the drone still needs adjustment (it works, but it's slow and not intuitive).

If someone wants to reproduce the hand recognition I can provide trained neural networks since I didn't upload the image database. Please contact me in this case. The hand recognicition works against a lot of backgrounds (need to extend the image library to improve that) and doesn't recognices the face or similar as hand.

## Installation

You need to have installed:
```
python2.7
tensorflow (installation instructions on their website)
opencv2 (use pip or brew/apt)
numpy (use pip)
node/npm for recording and labeling images (use brew/apt)
```

The scripts themselves don't require any installation.

## Todo

* Tidy up the image database for better recognition
* Maybe switch to ROS because of the lag and all the features 
* Get rid of drone cam to pc lag
* Better recognition of hand on the bottom of the cam (not the whole hand showing, when the drone should decline)
* Buy some 🍷 for stocking, coop has 20%

## Bugs/problems of extern libraries

* cv2.imread() only works for about 5000 images, then returns None
* Node.Js async processes build a queue and are processed at the end of the main process, not sure if controllable

