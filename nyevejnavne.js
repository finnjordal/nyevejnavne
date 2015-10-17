#! /usr/bin/env node

var program = require('commander')
	,request = require('request')
	,moment = require('moment');
 

program
  .version('0.0.1')
  .usage('[options]')
  .option('-d, --døgn [antal]', 'seneste døgn (default: 1)')
  .option('-o, --opret', 'oprettede (default)')
  .option('-æ, --ændret', 'ændrede')
  .option('-s, --slet', 'slettede')
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


var fra= moment(new Date()).subtract({days: antaldøgn});
var til= moment(new Date()); 
var url= host+"/replikering/vejstykker/haendelser";

var pvejnavne = new Promise(function(resolve, reject) {
	var options= {};
	options.uri= url;
	options.qs= {tidspunktfra: fra.utc().toISOString(), tidspunkttil: til.utc().toISOString()};

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
				if (!(program.opret || program.ændret || program.slet) 
					|| program.opret && vejnavne[i].operation === 'insert' 
					|| program.ændret && vejnavne[i].operation === 'update' 
					|| program.slet && vejnavne[i].operation === 'delete') {
	  			console.log("%s %s: %s", vejnavne[i].operation ,moment(vejnavne[i].tidspunkt).local().format(),vejnavne[i].data.navn);
	  		}
	  	};
		})
	.catch(
		function(error) {
			console.log('Fejl: '+error)
		});