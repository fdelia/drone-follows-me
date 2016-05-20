opencv_createsamples -img logo.png -bg negatives.txt -info /home/user/annotations.lst -pngoutput -maxxangle 0.1 -maxyangle 0.1 -maxzangle 0.1



opencv_traincascade -data obj-classifier -vec samples/img_28.png.vec -bg negatives.txt -precalcValBufSize 2048 -precalcIdxBufSize 2048 -numPos 82 -numNeg 79 -nstages 20 -minhitrate 0.999 -maxfalsealarm 0.5 -w 50 -h 50 -nonsym -baseFormatSave




find records -name "*.png" | while read f ; do 
convert $f -type Grayscale $f; done