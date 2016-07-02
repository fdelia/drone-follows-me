/*

Try to do an statistical analysis of stats.txt. But needs more parameters (e.g. max. iterations) to work correctly.

*/

var fs = require('fs');
var synaptic = require('synaptic'); // this line is not needed in the browser
var Neuron = synaptic.Neuron,
	Layer = synaptic.Layer,
	Network = synaptic.Network,
	Trainer = synaptic.Trainer,
	Architect = synaptic.Architect;



var trainingSet = [];
var perceptron = new Architect.Perceptron(4, 2, 1);
var trainer = new Trainer(perceptron);
var lines = fs.readFileSync('stats.txt', 'utf8').split('\n');

const INPUT_MAX = 30000;
const HIDDEN_MAX = 3200;

var skip = 112;
for (var i = skip; i < lines.length; i++) {
	if (lines[i].trim() == '') continue;
	if (lines[i][0] == '#') continue;
	var data = lines[i].split(',');
	var input = getInput(data);
	var output = (data[4].split('%')[0].trim() - 50) / 100 * 2;

	// console.log(input);
	// console.log(output);
	trainingSet.push({
		input: input,
		output: [output]
	})

}


trainer.train(trainingSet, {
	// rate: 0.02,
	iterations: 1000,
	shuffle: true,
	cost: Trainer.cost.CROSS_ENTROPY,
	log: 100
});


for (var inputNeurons = 1000; inputNeurons < 30000; inputNeurons += 1000) {
	for (var hiddenNeurons = 10; hiddenNeurons < 3000; hiddenNeurons *= 2) {
		var data = ['x', inputNeurons + '/' + hiddenNeurons, '0', '0.05  '];

		var input = getInput(data);
		var res = perceptron.activate(input);
		res = Math.round(res * 50 + 50);
		console.log(inputNeurons+'/'+hiddenNeurons + '  ->  ' + res + ' %');
	}
}



function getInput(data) {
	var input = [];

	// input.push(data[0].trim()); // divider
	var inp = Math.min(data[1].split('/')[0].trim(), INPUT_MAX);
	input.push((inp - INPUT_MAX / 2) / INPUT_MAX); // input neurons / rgb pixels
	var hid = Math.min(data[1].split('/')[1].trim(), HIDDEN_MAX);
	input.push((hid - HIDDEN_MAX / 2) / HIDDEN_MAX); // hidden neurons
	input.push(data[2].trim()); // margin
	var maxe = Math.sqrt(data[3].substr(0, 7).trim() * 10);
	input.push(maxe); // max. error

	return input;
}