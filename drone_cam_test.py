import cv2
import time

# cam = cv2.VideoCapture('tcp://192.168.1.1:5555/')
# running = True

# if cam.isOpened():
#     print "Video connected"
# else:
#     print "Video not connected"

# while running:
#     # get current frame of video
#     running, frame = cam.read()
#     if running:
#         cv2.imshow('frame', frame)
#         if cv2.waitKey(1) & 0xFF == 27: 
#             # escape key pressed
#             running = False
#     else:
#         # error reading frame
#         print 'error reading video feed'
#         time.sleep(1)
#         running = True

# cam.release()
# cv2.destroyAllWindows()


cap = cv2.VideoCapture("tcp://192.168.1.1:5555/")
while not cap.isOpened():
    cap = cv2.VideoCapture("tcp://192.168.1.1:5555/")
    cv2.waitKey(500)
    print "Wait for the header"

pos_frame = cap.get(cv2.cv.CV_CAP_PROP_POS_FRAMES)
while True:
    cap.read()
    cap.read()
    flag, frame = cap.read()
    if flag:
        # The frame is ready and already captured
        cv2.imshow('video', frame)
        pos_frame = cap.get(cv2.cv.CV_CAP_PROP_POS_FRAMES)
        # print str(pos_frame)+" frames"
    else:
        # The next frame is not ready, so we try to read it again
        cap.set(cv2.cv.CV_CAP_PROP_POS_FRAMES, pos_frame-1)
        print "frame is not ready"
        # It is better to wait for a while for the next frame to be ready
        cv2.waitKey(500)

    if cv2.waitKey(10) == 27:
        break
    if cap.get(cv2.cv.CV_CAP_PROP_POS_FRAMES) == cap.get(cv2.cv.CV_CAP_PROP_FRAME_COUNT):
        # If the number of captured frames is equal to the total number of frames,
        # we stop
        print('==')
        # break