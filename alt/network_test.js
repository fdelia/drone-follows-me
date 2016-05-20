var synaptic = require('synaptic'); // this line is not needed in the browser
var Neuron = synaptic.Neuron,
	Layer = synaptic.Layer,
	Network = synaptic.Network,
	Trainer = synaptic.Trainer,
	Architect = synaptic.Architect;


// input, hidden (...), output layer
var perceptron = new Architect.Perceptron(3, 200, 3);
var trainingSet = [];
var trainer = new Trainer(perceptron);


trainingSet.push({
	input: [1,0,0],
	output: [0,0,1]
})
trainingSet.push({
	input: [0,0,1],
	output: [1,0,0]
})
trainingSet.push({
	input: [0,1,0],
	output: [0,1,0]
})

trainer.train(trainingSet, {
	// rate: 0.1,
	iterations: 1000,
	// shuffle: true,
	// cost: Trainer.cost.MSE,
	log: 100
});


var res;
res = perceptron.activate([1,0,0]);
console.log(res);
res = perceptron.activate([0.5,0,0.5]);
console.log(res);