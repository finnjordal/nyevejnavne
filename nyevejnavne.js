#! /usr/bin/env node

var program = require('commander')
	,request = require('request')
	,moment = require('moment');
 

program
  .version('0.0.1')
  .usage('[options]')
  .option('-d, --døgn [antal]', 'seneste døgn (default: 1)')
  .parse(process.argv);

// if (!program.args[0]) {
//    program.outputHelp();
//    
//  }


var host= "http://dawa.aws.dk";

var antaldøgn= 1;
if (program.døgn) {
	antaldøgn= parseInt(program.døgn);
	if (isNaN(antaldøgn) || antaldøgn < 1) {
		program.outputHelp();
		process.exit(1);
	}
}

console.log('antal døgn: %d', antaldøgn);


var fra= moment(new Date()).subtract({weeks: 1});
var til= moment(new Date()); 
var url= host+"/replikering/vejstykker/haendelser?tidspunktfra="+fra.utc().toISOString()+"&tidspunkttil="+til.utc().toISOString();
console.log('url: %s', url);
process.exit(1);

var pvejnavne = new Promise(function(resolve, reject) {
	var options= {};
	options.uri= 'http://dawa.aws.dk/vejnavne';
	options.qs= {q: program.args[0], fuzzy: program.fuzzy, per_side: 20};

	request(options, function (error, response, body) {
		if (error) {
			reject(error);
			return;
		}
		if (response.statusCode !== 200) {
			reject(response.statusCode);
			return;
		}
		try {			
	  	var vejnavne= JSON.parse(body);
	  	resolve(vejnavne);
		}
		catch(e) {
			reject(e.message);
		}
	});
});

pvejnavne
	.then(
		function(vejnavne) {
			for (var i = 0; i < vejnavne.length; i++) {
	  		console.log(vejnavne[i].navn);
	  	};
		})
	.catch(
		function(error) {
			console.log('Fejl: '+error)
		});