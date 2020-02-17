
/*
 * extent format : [x1,y2,x2,y1]
 */

var fs = require('fs');
var mapnik = require('mapnik');
var express = require('express');
var util = require('util');
var mkdirp = require('mkdirp');
var dateformat = require ('dateformat');
var config = require('./config.json');

var router = express.Router();

mapnik.registerFonts("/Users/atrinhojjat/Library/Fonts");


var createTileCheck = function(filepath,callback){
	console.log(filepath);
	fs.readFile(filepath,function (err,data){
		var createTile = false;
		if(err){
			createTile = true;
		}else if(!err){
			var tileStat = fs.statSync(filepath);
			var tileModDate = new Date(tileStat.mtime);
			var today = new Date();
			var tileModDateYear = dateformat(tileModDate,"yyyy");
			var todayYear = dateformat(today,"yyyy");
			if(todayYear > tileModDateYear){
				createTile = true;
			} else {
				var tileModDateMonth = dateformat(tileModDate,"mm");
				var todayMonth =  dateformat(today,"mm");
				if(todayMonth > tileModDateMonth)
					createTile = true;
				else {
					var tileModDateDay = dateformat(tileModDate,"dd");
					var todayDay =  dateformat(today,"dd");
					if(todayDay-7>=tileModDateDay)
						createTile = true;
				}
			}
		}
		callback(createTile);
	});
}

var tileFileCheck = function(filepath,filename){
	mkdirp(config.projectloc+filepath,function(err){if (err)console.log(err);else console.log(filepath);});
	fs.readFile(filepath+filename,function (err,data){
		if(!err){
			fs.unlink(filepath+filename);
		}
	});
}

var SphericalMercator = require('sphericalmercator')
var mercator = new SphericalMercator({
  size: config.tilesize //tile size
})

Tile = function(style,zoom,x,y,response){
	this.x = x;
	this.y = y;
	this.zoom = zoom;
	this.style = style;

	// this.bbox = mercator.xyz_to_envelope(parseInt(this.zoom),parseInt(this.x),parseInt(this.y),false);

	var create = true;
	createTileCheck(util.format("%s%s/%s/%s/%s.png",config.tiledir,style,zoom,x,y),function(b){
		create = b;
	});

	if(create){

		tileFileCheck(util.format("%s%s/%s/%s/",config.tiledir,style,zoom,x),util.format("%s.png",y));
		console.log(util.format("Tile { %s , %s , %s }Needs To Be Created .",zoom,x,y));

		var map = new mapnik.Map(config.tilesize, config.tilesize);
		mapnik.register_default_fonts();
		mapnik.register_default_input_plugins();

		map.loadSync(util.format('%s%s/%s.xml',config.styledir,style,style));

		var bbox = mercator.bbox(
		  this.x,
		  this.y,
		  this.z,
		  false,
		  '900913'
	  	);
		map.extent = bbox;

		var im = new mapnik.Image(config.tilesize,config.tilesize);
		map.render(im,/*{"z":parseInt(this.zoom),"x":parseInt(this.x),"y":parseInt(this.y)},*/ function(err,im) {
			if (err) throw err;
			im.encode('png', function(err,buffer) {
				if (err) throw err;
				fs.writeFile(util.format("%s%s/%s/%s/%s.png",config.tiledir,style,zoom,x,y),buffer, function(err) {
					if (err) throw err;
					else this.data = fs.readFileSync(util.format("%s%s/%s/%s/%s.png",config.tiledir,style,zoom,x,y));
				});

			});
		});

	} else {
		this.data = fs.readFileSync(util.format("%s%s/%s/%s/%s.png",config.tiledir,style,zoom,x,y));
	}

	response.writeHead(200,{'Content-Type':'image/png'});
	// response.write ();
	response.end(this.data);
	return this.data;
}

// Tile.prototype = {
// 	getData : function(){
// 		return this.data;
// 	}
// }


router.get ("/:style/:zoom/:x/:y.png",function (request,response){
	var style = request.params.style;
	var zoom = request.params.zoom;
	var x = request.params.x;
	var y = request.params.y;
	var tile = Tile(style,zoom,x,y,response);
});

router.get ("/",function (request,response){
	var data = fs.readFileSync('Images/icon.png');
	response.writeHead(200,{'Content-Type':'image/png'});
	response.write (data);
	response.end();
});

router.get ("/styles",function (request,response){
	var data = "{'styles':[";
	var styles = config.styles;
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

router.get ("/preview/:style.png",function (request,response){
	var style = request.params.style;
	response.writeHead(200,{'Content-Type':'image/png'});

	var create = false;
	createTileCheck(util.format("%s%s/preview.png",config.tiledir,style),function(b){
		create = b;
	});
	console.log(create);

	if(create){
		tileFileCheck(util.format("%s%s/",config.tiledir,style),"preview.png");
		console.log("Tile Does Not Exist. Creating Tile ");
		mapnik.register_default_fonts();
		mapnik.register_default_input_plugins();
		var map = new mapnik.Map(config.preview.width, config.preview.height);
		map.load(util.format('%s%s/%s.xml',config.styledir,style,style), function(err,map) {
			if (err) throw err;
			map.zoomAll();
			var im = new mapnik.Image(config.preview.width, config.preview.height);
			map.render(im, function(err,im) {
				if (err) throw err;
				im.encode('png', function(err,buffer) {
					if (err) throw err;
					fs.writeFile(util.format('%s%s/preview.png',config.tiledir,style),buffer, function(err) {
						if (err) throw err;
					});
					response.end(buffer);
					console.log("Tile Created");
				});
			});
		});
	}else {
		var data = fs.readFileSync(util.format("%s%s/preview.png",config.tiledir,style));
		response.write(data);
		response.end();
	}

});

module.exports = router;
