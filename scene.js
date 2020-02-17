var fs = require('fs');
var util = require('util');
var config = require('./config.json');
var express = require('express');

var router = express.Router();

var formats = config.scenes.contenttypes;

router.get ("/:name/scene.:format",function (request,response){
	var name = request.params.name;
	var format = request.params.format;
	var fullpath = config.scenes.scenesdir +name+'/scene'+'.'+format;
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

router.get ("/get-scenes",function (request,response){
	var data = "{'scenes':[";
	var styles = config.scenes.scenes;
	for (var i = 0;i<styles.length;i++){
		data += ""+styles[i].toString();
		// data += (i == styles.lenght - 1 ? "]}" :",");
		if(i==styles.length -1 )
			data+="]}";
		else
			data+=",";
	}
	response.writeHead(200,{'Content-Type':'application/json'});
	response.write (data);
	response.end();
});

module.exports = router;
