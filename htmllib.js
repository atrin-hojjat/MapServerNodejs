var fs = require('fs');
var mapnik = require('mapnik');
var express = require('express');
var util = require('util');
var mkdirp = require('mkdirp');
var dateformat = require ('dateformat');
var config = require('./config.json');

var router = express.Router();

mapnik.registerFonts("/Users/atrinhojjat/Library/Fonts");

var formats = config.htmllib.contenttypes;
var imformats = config.htmllib.imcontenttypes;

router.get ("/:path/:file.:format",function (request,response){
	var path = request.params.path;
	var file = request.params.file;
	var format = request.params.format;
	var fullpath = config.htmllib.libdir +path+'/'+file+'.'+format;
	console.log (fullpath)
	fs.readFile(fullpath,function(err,data){
		if(err){
			response.writeHead(404,{'Content-Type':'text/plain'});
			response.write ("File Not Found");
			response.end();
		}else{
			var premission = false;
			for(var f in formats){
				if (format == f){
					premission = true;
				}
			}

			if(premission == false){
				response.writeHead(403,{'Content-Type':'text/plain'});
				response.write ("You Don't Have Premission to Access this File.");
				response.end();
			}else{
				response.writeHead(200,{'Content-Type':formats[format]});
				response.write (data);
				response.end();
			}
		}

	});
});

router.get ("/:path/images/:file.:format",function (request,response){
	var path = request.params.path;
	var file = request.params.file;
	var format = request.params.format;
	var fullpath = config.htmllib.libdir +path+'/'+'images/'+file+'.'+format;
	console.log (fullpath)
	fs.readFile(fullpath,function(err,data){
		if(err){
			response.writeHead(404,{'Content-Type':'text/plain'});
			response.write ("File Not Found");
			response.end();
		}else{
			var premission = false;
			// for(var f in imformats){
				if (imformats[format]){
					premission = true;
				}
			// }

			if(premission == false){
				response.writeHead(403,{'Content-Type':'text/plain'});
				response.write ("You Don't Have Premission to Access this File.");
				response.end();
			}else{
				console.log()
				response.writeHead(200,{'Content-Type':imformats[format]});
				response.write (data);
				response.end();
			}
		}

	});
});

module.exports = router;
