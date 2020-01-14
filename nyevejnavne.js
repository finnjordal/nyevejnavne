#!/usr/bin/env node

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
  .option('-m, --miljø [miljø]', 'DAWA miljø. Feks. dawa-p2') 
  .parse(process.argv);

// if (!program.args[0]) {
//    program.outputHelp();
//    
//  }

moment.locale('da');

var host= "http://dawa.aws.dk";
let miljø= program.miljø;
if (miljø) {
	host= host.replace('dawa',miljø); 
} 

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

function getkommune(vejnavn) {
	return new Promise(function(resolve, reject) {
		var options= {};
		options.uri= host+'/kommuner/'+vejnavn.data.kommunekode;

		request(options, function (error, response, body) {
			if (error) {
				reject(error);
				return;
			}

			try {	
				var kommune= {};
				if (response.statusCode === 404) {
					kommune.navn= 'Ukendt kommune';
				}
				else if (response.statusCode !== 200) {
					reject(response.statusCode);
					return;
				}
				else {						
			  	kommune= JSON.parse(body);	
				}		
		  	vejnavn.data.kommunenavn= kommune.navn;
		  	resolve(vejnavn);
			}
			catch(e) {
				reject(e.message);
			}
		});
	});
}

pvejnavne
	.then(
		function(vejnavne) {
			var pvejnavne= [];
			for (var i = 0; i < vejnavne.length; i++) {
				if (!(program.opret || program.ændret || program.slet) 
					|| program.opret && vejnavne[i].operation === 'insert' 
					|| program.ændret && vejnavne[i].operation === 'update' 
					|| program.slet && vejnavne[i].operation === 'delete') {
					pvejnavne.push(getkommune(vejnavne[i]));
	  		}
	  	};
	  	Promise.all(pvejnavne)
	  		.then(function(vejnavne) {
	  			vejnavne.forEach(function(vejnavn) {
  					console.log("%s %s %s (%s), %s (%s)" ,moment(vejnavn.tidspunkt).local().format('LLL'),vejnavn.operation,vejnavn.data.navn,vejnavn.data.kode,vejnavn.data.kommunenavn,vejnavn.data.kommunekode);
	  			})
	  		})
	  		.catch(function(error) {	  			
					console.log('all Fejl: '+error);
	  		})
		})
	.catch(
		function(error) {
			console.log('Fejl: '+error)
		});