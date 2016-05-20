var synaptic = require('synaptic'); // this line is not needed in the browser
var Neuron = synaptic.Neuron,
  Layer = synaptic.Layer,
  Network = synaptic.Network,
  Trainer = synaptic.Trainer,
  Architect = synaptic.Architect;

var fs = require('fs')
var cv = require('opencv')



// input, hidden (...), output layer
var perceptron = new Architect.Perceptron(608, 30, 4);
var trainingSet = [];
var trainer = new Trainer(perceptron);
// console.log(perceptron)



fs.readFile('records/records_data.txt', 'utf8', function(err, data) {
  if (err) {
    return console.log(err);
  }
  var lines = data.split('\n')
  var linesTrimmed = [];

  lines.forEach(function(line) {
    if (line[0] == '#') return;
    if (line.trim() == '') return;

    linesTrimmed.push(line);
  });

  console.log('found ' + linesTrimmed.length + ' lines of data')



  // only as many images as there is output data for
  var trainImages = [];
  for (var i = 16; i < 16 + linesTrimmed.length; i++) trainImages.push('img_' + i + '.jpg');

  trainImages = trainImages.slice(0, 1) // TEST

  trainImages.forEach(function(imageName, imageIndex) {
    cv.readImage('records/' + imageName, function(err, mat) {
      console.log(imageName)
        // console.log(mat.get(12, 12, 0))
        // console.log(mat.get(12, 12, 1))
        // console.log(mat.get(12, 12, 2))
        // console.log(cv.Matrix)
        // console.log(mat.toBuffer().length)

      // console.log(mat.get(0, 0) + ' ' + mat.get(0, 16))
      // console.log(mat.row(1).length) // 640
      // console.log(mat.col(1).length) // 360

      // make new Matrix (m x n), number of chunks:
      // var newMatrix_m = 32; // org: 640 (row)
      // var newMatrix_n = 18; // org: 360 (col)
      // // newMatrix_m = 2;
      // // newMatrix_n = 2;

      // var oldMatrix = [
      //   []
      // ];
      // // -2 because of segmentation fault 11 in row m=359 ...?
      // for (var m = 0; m < mat.size()[0] - 2; m++) {
      //   oldMatrix[m] = mat.row(m);
      // }

      // // console.log(oldMatrix.length)
      // // oldMatrix = [
      // //   [1, 3, 1, 1],
      // //   [5, 5, 5, 5],
      // //   [4, 6, 9, 9],
      // //   [0, 0, 0, 1]
      // // ]

      // matrixAveraged = averageMatrix(oldMatrix, newMatrix_m, newMatrix_n)
      // matrixFlattened = matrixAveraged.reduce(function(a, b) {
      //   return a.concat(b);
      // });


      var line = linesTrimmed[imageIndex]
      var t_data = line.split(',')
      if (t_data.length != 4) {
        console.log('data has wrong length on line "' + line + '"')
      }


      trainingSet.push({
        input: getInput(mat),
        output: t_data
      });


      trainer.train(trainingSet);

    });
  });
  console.log('end of training')
  console.log(' ')
  console.log('now activate')

  cv.readImage('records/img_94.jpg', function(err, mat) {
    var res = perceptron.activate(getInput(mat));
    console.log(res);
  });

});



function getInput(mat) {
  // make new Matrix (m x n), number of chunks:
  var newMatrix_m = 32; // org: 640 (row)
  var newMatrix_n = 18; // org: 360 (col)

  // newMatrix_m = 2;
  // newMatrix_n = 2;

  var oldMatrix = [
    []
  ];
  // -2 because of segmentation fault 11 in row m=359 ...?
  for (var m = 0; m < mat.size()[0] - 2; m++) {
    oldMatrix[m] = mat.row(m);
  }

  // console.log(oldMatrix.length)
  // oldMatrix = [
  //   [1, 3, 1, 1],
  //   [5, 5, 5, 5],
  //   [4, 6, 9, 9],
  //   [0, 0, 0, 1]
  // ]

  matrixAveraged = averageMatrix(oldMatrix, newMatrix_m, newMatrix_n)
  matrixFlattened = matrixAveraged.reduce(function(a, b) {
    return a.concat(b);
  });

  // console.log(matrixFlattened.length)
  return matrixFlattened;
}



function chunkArray(arr, chunkLength) {
  if (!arr || !chunkLength) return [arr];
  var resArr = [];

  for (var i = 0; i < arr.length; i += chunkLength) {
    resArr.push(arr.slice(i, i + chunkLength))
  }

  return resArr;
}

function average(arr) {
  var tot = 0;
  for (var i = 0; i < arr.length; i++) tot += arr[i];
  return tot / arr.length;
}

/* 
berechnet Durchschnitte von Einträgen einer Matrix,
so dass eine neue Matrix mit m x n Einträgen entsteht
*/
function averageMatrix(oldMatrix, newMatrix_m, newMatrix_n) {
  // ATTENTION please check that m and n divide through the height and length of the picture without remainder
  var chunkLength_row = Math.floor(oldMatrix[0].length / newMatrix_m);
  var chunkLength_col = Math.floor(oldMatrix.length / newMatrix_n);

  var newMatrix = [
    []
  ];

  // m rows
  // for (var m = 0; m < mat.col(0).length; m++) {
  for (var m = 0; m < oldMatrix.length; m++) {
    var rowChunks = chunkArray(oldMatrix[m], chunkLength_row)
    newMatrix[m] = []
    for (var c = 0; c < rowChunks.length; c++) newMatrix[m].push(average(rowChunks[c]));

    // console.log('anzahl chunks '+rowChunks.length) // = newMatrix_m

  }

  // console.log(newMatrix.length) // 360
  // console.log(newMatrix[0].length) // 32

  var newMatrix2 = [
    []
  ];

  // n cols
  for (var n = 0; n < newMatrix[0].length; n++) {
    var colArr = [];
    for (var m = 0; m < newMatrix.length; m++) {
      // var rowChunks = chunkArray(newMatrix)
      colArr.push(newMatrix[m][n])
    }
    // console.log(colArr.length)
    var colChunks = chunkArray(colArr, chunkLength_col)

    for (var c = 0; c < colChunks.length; c++) {
      if (!newMatrix2[c]) newMatrix2[c] = []
      newMatrix2[c][n] = average(colChunks[c]);
    }

  }

  return newMatrix2;
}