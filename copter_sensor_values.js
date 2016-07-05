var arDrone = require('ar-drone');
var client = arDrone.createClient();
client.createRepl();
var fs = require('fs');


console.log('battery: ' + client.battery())

var imgCounter = 1;

client.on('navdata', printData);

function printData(data){
	if (data.demo)
	console.log(data.demo)
}