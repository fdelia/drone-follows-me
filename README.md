
Just hacking around - don't look at me 🙈

## Idea

The idea is to make a drone follow a hand showed at the drone. It should also understand simple gestures (like open hand or fist) to let it control the movement.

## Todo

* Make a lot of pictures of fist in different light situations
  * label them
  * crop them for "label 2"
  * train CNN and test it
* Find a control library for the AR Drone and Python (there is a major one, but the cam doesn't work there)
  * or translate the tensorflow CNN for NodeJs
* Make more tests with the drone cam (it handels bad light worse than most webcams)
* It still recognises an arm or a lot of skin as a hand

## Bugs/problems of extern libraries
* cv2.imread() only works for about 5000 images, then returns None
* Node.Js async processes mostly queue and are processed at the end of the main process, not sure if controllable

