import cv2


video_capture = cv2.VideoCapture(0)

while True:
	ret, frame = video_capture.read()
	frame = cv2.resize(frame, (640, 360))
	cv2.imshow('Recording from webcam', frame)
	cv2.waitKey(1)

