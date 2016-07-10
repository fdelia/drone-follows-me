
Just hacking around - don't look at me 🙈

## Idea

The idea is to make a drone follow a hand showed at the drone. It should also understand simple gestures (like open hand or fist) to control the movement.

## Todo

* Tidy up the image database for better recognition
* Maybe switch to ROS because of the lag and all the features 
* Get rid of drone cam to pc lag
* Better recognition of hand on the bottom of the cam (not the whole hand showing, when the drone should decline)
* Buy some 🍷 for stocking, coop has 20%

## Bugs/problems of extern libraries
* cv2.imread() only works for about 5000 images, then returns None
* Node.Js async processes mostly queue and are processed at the end of the main process, not sure if controllable

